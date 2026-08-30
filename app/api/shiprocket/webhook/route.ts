import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { apiJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { updateProductStockAdmin } from "@/app/lib/inventory.server";

export const runtime = "nodejs";

/**
 * Connectivity Check
 */
export async function GET() {
  return apiJson({
    status: "active",
    message: "Shiprocket Webhook Endpoint is online and accessible.",
    endpoint: "https://albaaqir.com/api/shiprocket/webhook"
  });
}

/**
 * Shiprocket Webhook Handler
 * Handles real-time status updates and tracking scans from Shiprocket.
 */
export async function POST(request: Request) {
  let db;
  let logRef;
  const startTime = Date.now();

  try {
    // 1. Lenient JSON Parsing (Shiprocket test button might not send perfect headers)
    let data: any = {};
    try {
      const text = await request.text();
      if (text) {
        data = JSON.parse(text);
      }
    } catch (e) {
      console.error("[Webhook] JSON Parse Error:", e);
      return apiJson({ ok: false, message: "Invalid JSON" }, 400);
    }

    // 2. Initialize Firebase inside try block
    db = getFirestore(getAdminApp());
    logRef = db.collection("shiprocket_webhook_logs").doc();

    // 3. Extract fields based on Shiprocket Webhook Format
    const awb = String(data.awb || "");
    const shiprocketOrderId = String(data.order_id || "");
    const channelOrderId = String(data.channel_order_id || "");
    const currentStatus = String(data.current_status || data.shipment_status || "").toLowerCase();
    const statusId = String(data.current_status_id || data.shipment_status_id || "");
    const timestamp = data.current_timestamp || data.timestamp || new Date().toISOString();
    const courier = String(data.courier_name || "");
    const scans = Array.isArray(data.scans) ? data.scans : [];

    // 4. Handle Test Payload / Validation
    // If it's a test from Shiprocket, they might use dummy values or missing fields
    const isTest = data.is_test === 1 || data.is_test === true || (!awb && !shiprocketOrderId && currentStatus === "delivered");

    if (isTest) {
      await logRef.set({
        timestamp: FieldValue.serverTimestamp(),
        payload: data,
        status: "TEST_SUCCESS",
        message: "Test webhook received successfully"
      });
      return apiJson({ success: true, message: "Test webhook received" });
    }

    if ((!shiprocketOrderId && !awb && !channelOrderId) || !currentStatus) {
      await logRef.set({
        timestamp: FieldValue.serverTimestamp(),
        payload: data,
        error: "Missing identification fields (order_id/awb) or status",
        status: "SKIPPED"
      });
      // Returning 200 even for skipped to keep Shiprocket happy during setup
      return apiJson({ ok: true, message: "Data skipped - insufficient fields" });
    }

    // 5. Logging the event for History
    await logRef.set({
      timestamp: FieldValue.serverTimestamp(),
      shiprocketOrderId,
      channelOrderId,
      awb,
      currentStatus,
      statusId,
      payload: data,
      status: "PROCESSING"
    });

    // 6. Duplicate Event Protection (Idempotency)
    const eventSignature = `${awb}_${statusId || currentStatus}_${timestamp}`;
    const eventRef = db.collection("shiprocket_processed_events").doc(eventSignature);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      await logRef.update({
        status: "DUPLICATE",
        processingTime: Date.now() - startTime
      });
      return apiJson({ success: true, message: "Event already processed" });
    }

    // 7. Order Matching
    const ordersRef = db.collection("orders");
    let orderDoc = null;

    const matchId = channelOrderId || shiprocketOrderId;
    if (matchId) {
      const q = ordersRef.where("invoiceNumber", "==", matchId).limit(1);
      const snapshot = await q.get();
      if (!snapshot.empty) orderDoc = snapshot.docs[0];
    }

    if (!orderDoc && awb) {
      const q = ordersRef.where("shiprocketAwb", "==", awb).limit(1);
      const snapshot = await q.get();
      if (!snapshot.empty) orderDoc = snapshot.docs[0];
    }

    if (!orderDoc) {
      await logRef.update({
        status: "NOT_FOUND",
        error: `Order not found for ID: ${matchId} or AWB: ${awb}`,
        processingTime: Date.now() - startTime
      });
      // Return 200 so Shiprocket doesn't retry for non-existent orders (e.g. manual Shiprocket orders)
      return apiJson({ success: true, message: "Order not found in local DB" });
    }

    const orderData = orderDoc.data();
    const orderId = orderDoc.id;

    // 8. Status Mapping & Restock Logic
    let internalStatus = orderData.status;
    let shouldRestock = false;

    if (currentStatus.includes("delivered") && !currentStatus.includes("rto")) {
      internalStatus = "delivered";
    } else if (
      currentStatus.includes("rto") ||
      currentStatus.includes("returned") ||
      currentStatus.includes("return") ||
      statusId === "13" || // RTO Initiated
      statusId === "17"    // RTO Delivered
    ) {
      if (internalStatus !== "returned" && !orderData.inventoryRestocked) {
        internalStatus = "returned";
        shouldRestock = true;
      }
    } else if (
      currentStatus.includes("shipped") ||
      currentStatus.includes("transit") ||
      currentStatus.includes("pick") ||
      currentStatus.includes("out for delivery") ||
      ["6", "18", "19", "7"].includes(statusId)
    ) {
      if (["pending", "packed", "shipped"].includes(internalStatus)) {
        internalStatus = "shipped";
      }
    } else if (currentStatus.includes("canceled") || currentStatus.includes("cancelled")) {
      internalStatus = "cancelled";
      if (!orderData.inventoryRestocked) {
        shouldRestock = true;
      }
    }

    // 9. Prepare Updates
    const updates: Record<string, any> = {
      shiprocketStatus: currentStatus.toUpperCase(),
      shiprocketStatusId: statusId,
      lastUpdated: FieldValue.serverTimestamp(),
      shiprocketAwb: awb || orderData.shiprocketAwb || null,
      courierName: courier || orderData.courierName || null,
      trackingScans: scans
    };

    if (internalStatus !== orderData.status) {
      updates.status = internalStatus;
      updates.statusHistory = FieldValue.arrayUnion({
        status: internalStatus,
        changedAt: new Date().toISOString(),
        reason: `Webhook: ${currentStatus} (Shiprocket ID: ${statusId})`
      });
    }

    await orderDoc.ref.update(updates);

    // 10. Inventory Restock
    let restockResult = null;
    if (shouldRestock && orderData.cartItems) {
      for (const item of orderData.cartItems) {
        if (item.id && item.quantity) {
          try {
            await updateProductStockAdmin(
              item.id,
              item.quantity,
              `Auto-Restock (Shiprocket ${currentStatus.toUpperCase()}): ${matchId}`
            );
          } catch (e) {
            console.error(`Restock failed for ${item.id}:`, e);
          }
        }
      }
      await orderDoc.ref.update({
        inventoryRestocked: true,
        restockedAt: FieldValue.serverTimestamp()
      });
      restockResult = "COMPLETED";
    }

    // Mark event as processed
    await eventRef.set({
      processedAt: FieldValue.serverTimestamp(),
      awb,
      status: currentStatus,
      statusId,
      timestamp,
      orderId: orderId
    });

    await logRef.update({
      status: "SUCCESS",
      orderId: orderId,
      internalStatus: internalStatus,
      restockResult: restockResult,
      processingTime: Date.now() - startTime
    });

    return apiJson({ success: true, orderId });

  } catch (error) {
    console.error("[Shiprocket-Webhook] Error:", error);
    if (logRef) {
      await logRef.set({
        timestamp: FieldValue.serverTimestamp(),
        error: String(error),
        status: "CRITICAL_FAILURE"
      }, { merge: true }).catch(() => {});
    }

    // Always return 200 during testing/setup to avoid Shiprocket "unable to send request" errors
    // unless it's a real code failure we want to know about.
    return apiJson({ success: false, error: "Processed with errors" }, 200);
  }
}

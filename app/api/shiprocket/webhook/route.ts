import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { apiJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { updateProductStockAdmin } from "@/app/lib/inventory.server";

export const runtime = "nodejs";

/**
 * GET: Health Check
 */
export async function GET() {
  return apiJson({
    status: "active",
    message: "Shiprocket Webhook Endpoint is online. IMPORTANT: Use the WWW version of this URL in Shiprocket.",
    endpoint: "https://www.albaaqir.com/api/shiprocket/webhook"
  });
}

/**
 * POST: Actual Webhook Processing
 */
export async function POST(request: Request) {
  const db = getFirestore(getAdminApp());
  const logRef = db.collection("shiprocket_webhook_logs").doc();
  const startTime = Date.now();

  try {
    const data = await request.json();

    if (!data || typeof data !== 'object') {
      return apiJson({ success: false, error: "Invalid JSON payload" }, 400);
    }

    const awb = String(data.awb || "");
    const shiprocketOrderId = String(data.order_id || "");
    const channelOrderId = String(data.channel_order_id || "");
    const shipmentId = String(data.shipment_id || "");
    const currentStatus = String(data.current_status || data.shipment_status || "").toLowerCase();
    const statusId = String(data.current_status_id || data.shipment_status_id || "");
    const timestamp = data.current_timestamp || data.timestamp || new Date().toISOString();
    const courier = String(data.courier_name || "");
    const channel = String(data.channel || "");
    const scans = Array.isArray(data.scans) ? data.scans : [];

    // 1. Initial Logging (Always log incoming events)
    await logRef.set({
      timestamp: FieldValue.serverTimestamp(),
      awb,
      shiprocketOrderId,
      channelOrderId,
      shipmentId,
      currentStatus,
      statusId,
      courier,
      channel,
      payload: data,
      status: "RECEIVED"
    });

    // 2. Identification Check
    if (!awb && !shiprocketOrderId && !channelOrderId && !shipmentId) {
      await logRef.update({ status: "SKIPPED", error: "No order identifier found (awb/order_id/channel_order_id/shipment_id)" });
      return apiJson({ success: true, processed: false, message: "Insufficient data to match order" });
    }

    // 3. Duplicate Protection
    const eventSignature = `${awb || 'noawb'}_${statusId || currentStatus}_${timestamp}`;
    const eventRef = db.collection("shiprocket_processed_events").doc(eventSignature);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      await logRef.update({ status: "DUPLICATE", processingTime: Date.now() - startTime });
      return apiJson({ success: true, processed: true, message: "Duplicate event already processed" });
    }

    // 4. Order Matching Logic (Sequential Attempt)
    const ordersRef = db.collection("orders");
    let orderDoc = null;

    // Step A: Match by Invoice Number (This is what we send to Shiprocket as order_id)
    if (channelOrderId) {
      const q = ordersRef.where("invoiceNumber", "==", channelOrderId).limit(1);
      const snap = await q.get();
      if (!snap.empty) orderDoc = snap.docs[0];
    }

    // Step B: Match by Shiprocket's Internal Order ID
    if (!orderDoc && shiprocketOrderId) {
      const q = ordersRef.where("shiprocketOrderId", "==", shiprocketOrderId).limit(1);
      const snap = await q.get();
      if (!snap.empty) orderDoc = snap.docs[0];
    }

    // Step C: Match by Shipment ID
    if (!orderDoc && shipmentId) {
      const q = ordersRef.where("shiprocketShipmentId", "==", shipmentId).limit(1);
      const snap = await q.get();
      if (!snap.empty) orderDoc = snap.docs[0];
    }

    // Step D: Match by AWB
    if (!orderDoc && awb) {
      const q = ordersRef.where("shiprocketAwb", "==", awb).limit(1);
      const snap = await q.get();
      if (!snap.empty) orderDoc = snap.docs[0];
    }

    if (!orderDoc) {
      await logRef.update({ status: "NOT_FOUND", message: "No matching order found in local database", processingTime: Date.now() - startTime });
      return apiJson({ success: true, processed: false, message: "Order not found in local DB" });
    }

    const orderData = orderDoc.data();
    const orderId = orderDoc.id;

    // 5. Status Mapping
    let internalStatus = orderData.status;
    let shouldRestock = false;

    if (currentStatus.includes("delivered")) {
      internalStatus = "delivered";
    } else if (currentStatus.includes("rto") || currentStatus.includes("return") || ["13", "17"].includes(statusId)) {
      if (internalStatus !== "returned" && !orderData.inventoryRestocked) {
        internalStatus = "returned";
        shouldRestock = true;
      }
    } else if (currentStatus.includes("shipped") || currentStatus.includes("transit") || currentStatus.includes("pick") || currentStatus.includes("out for delivery")) {
      if (["pending", "packed", "shipped"].includes(internalStatus)) {
        internalStatus = "shipped";
      }
    } else if (currentStatus.includes("cancel")) {
      internalStatus = "cancelled";
      if (!orderData.inventoryRestocked) shouldRestock = true;
    }

    // 6. Database Updates
    const updates: any = {
      shiprocketStatus: currentStatus.toUpperCase(),
      shiprocketStatusId: statusId,
      lastUpdated: FieldValue.serverTimestamp(),
      shiprocketAwb: awb || orderData.shiprocketAwb || null,
      shiprocketOrderId: shiprocketOrderId || orderData.shiprocketOrderId || null,
      courierName: courier || orderData.courierName || null,
      trackingScans: scans
    };

    if (internalStatus !== orderData.status) {
      updates.status = internalStatus;
      updates.statusHistory = FieldValue.arrayUnion({
        status: internalStatus,
        changedAt: new Date().toISOString(),
        reason: `Shiprocket Webhook: ${currentStatus}`
      });
    }

    await orderDoc.ref.update(updates);

    // 7. Inventory Restock
    let restockDone = false;
    if (shouldRestock && orderData.cartItems) {
      for (const item of orderData.cartItems) {
        if (item.id && item.quantity) {
          await updateProductStockAdmin(item.id, item.quantity, `RTO Restock: ${channelOrderId || orderId}`);
        }
      }
      await orderDoc.ref.update({ inventoryRestocked: true, restockedAt: FieldValue.serverTimestamp() });
      restockDone = true;
    }

    // Mark event processed
    await eventRef.set({ processedAt: FieldValue.serverTimestamp(), signature: eventSignature });

    await logRef.update({
      status: "SUCCESS",
      orderId,
      internalStatus,
      restockDone,
      processingTime: Date.now() - startTime
    });

    return apiJson({ success: true, processed: true, orderId });

  } catch (error) {
    console.error("[Shiprocket-Webhook] Error:", error);
    await logRef.set({
      timestamp: FieldValue.serverTimestamp(),
      error: String(error),
      status: "ERROR"
    }, { merge: true });

    return apiJson({ success: false, error: "Internal processing error" }, 500);
  }
}

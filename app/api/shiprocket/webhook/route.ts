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

    // Extracting all possible Shiprocket fields
    const awb = String(data.awb || "");
    const srOrderId = String(data.order_id || "");
    const channelOrderId = String(data.channel_order_id || "");
    const shipmentId = String(data.shipment_id || "");

    // Status fields
    const currentStatus = String(data.current_status || data.shipment_status || "").toLowerCase();
    const statusId = String(data.current_status_id || data.shipment_status_id || "");

    const timestamp = data.current_timestamp || data.timestamp || new Date().toISOString();
    const courier = String(data.courier_name || "");
    const scans = Array.isArray(data.scans) ? data.scans : [];

    // 1. Initial Logging
    await logRef.set({
      timestamp: FieldValue.serverTimestamp(),
      awb,
      shiprocketOrderId: srOrderId,
      channelOrderId,
      shipmentId,
      currentStatus,
      statusId,
      courier,
      payload: data,
      status: "RECEIVED"
    });

    // 2. Identification Check
    if (!awb && !srOrderId && !channelOrderId && !shipmentId) {
      await logRef.update({
        status: "SKIPPED",
        error: "Missing all identifiers: awb, order_id, channel_order_id, and shipment_id are all empty."
      });
      return apiJson({
        success: true,
        processed: false,
        message: "Insufficient data: Need at least one identifier (awb, order_id, etc.)"
      });
    }

    // 3. Duplicate Protection
    const eventSignature = `${awb || 'noawb'}_${statusId || currentStatus}_${timestamp}`;
    const eventRef = db.collection("shiprocket_processed_events").doc(eventSignature);
    const eventDoc = await eventRef.get();

    if (eventDoc.exists) {
      await logRef.update({ status: "DUPLICATE", processingTime: Date.now() - startTime });
      return apiJson({ success: true, processed: true, message: "Duplicate event already processed" });
    }

    // 4. Robust Order Matching Logic
    const ordersRef = db.collection("orders");
    let orderDoc = null;

    // A. Match by Invoice Number (Shiprocket's 'order_id' or 'channel_order_id' usually contains our Invoice)
    const possibleInvoiceNumbers = [srOrderId, channelOrderId].filter(id => id && id.startsWith('ALB-'));
    for (const inv of possibleInvoiceNumbers) {
      const q = ordersRef.where("invoiceNumber", "==", inv).limit(1);
      const snap = await q.get();
      if (!snap.empty) {
        orderDoc = snap.docs[0];
        break;
      }
    }

    // B. Match by AWB
    if (!orderDoc && awb) {
      const q = ordersRef.where("shiprocketAwb", "==", awb).limit(1);
      const snap = await q.get();
      if (!snap.empty) orderDoc = snap.docs[0];
    }

    // C. Match by Shipment ID
    if (!orderDoc && shipmentId) {
      const q = ordersRef.where("shiprocketShipmentId", "==", shipmentId).limit(1);
      const snap = await q.get();
      if (!snap.empty) orderDoc = snap.docs[0];
    }

    // D. Match by Shiprocket Order ID (Internal)
    if (!orderDoc && srOrderId) {
      const q = ordersRef.where("shiprocketOrderId", "==", srOrderId).limit(1);
      const snap = await q.get();
      if (!snap.empty) orderDoc = snap.docs[0];
    }

    if (!orderDoc) {
      await logRef.update({
        status: "NOT_FOUND",
        message: `No order matched for Invoice/Order: ${srOrderId}, AWB: ${awb}, Shipment: ${shipmentId}`,
        processingTime: Date.now() - startTime
      });
      return apiJson({ success: true, processed: false, message: "Order not found in database" });
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
      courierName: courier || orderData.courierName || null,
      trackingScans: scans
    };

    // If SR provided an internal order_id, save it for future matching
    if (srOrderId && !srOrderId.startsWith('ALB-')) {
       updates.shiprocketOrderId = srOrderId;
    }

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
          await updateProductStockAdmin(item.id, item.quantity, `RTO Restock: ${orderData.invoiceNumber || orderId}`);
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

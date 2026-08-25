import { getFirestore } from "firebase-admin/firestore";
import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { syncOrderToShiprocket } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as { orderId: string };
    const { orderId } = body;

    if (!orderId) {
      return apiError("Order ID is required", 400);
    }

    const db = getFirestore(getAdminApp());
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return apiError("Order not found", 404);
    }

    const orderData = orderDoc.data()!;

    // Check if already synced successfully
    if (orderData.shiprocketOrderId) {
      return apiJson({
        success: true,
        message: "Order already synced to Shiprocket",
        shiprocketOrderId: orderData.shiprocketOrderId
      });
    }

    const syncResult = await syncOrderToShiprocket(orderId, orderData);
    await orderRef.update(syncResult);

    if (syncResult.shiprocketStatus === "FAILED") {
      return apiError(syncResult.shiprocketError || "Shiprocket sync failed", 500);
    }

    return apiJson({
      success: true,
      message: "Synced to Shiprocket successfully",
      shiprocketOrderId: syncResult.shiprocketOrderId,
      shiprocketShipmentId: syncResult.shiprocketShipmentId
    });
  } catch (error) {
    console.error("Manual Shiprocket sync failed:", error);
    return apiError(error instanceof Error ? error.message : "Sync failed", 500);
  }
}

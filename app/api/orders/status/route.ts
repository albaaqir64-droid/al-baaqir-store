import { NextRequest } from "next/server";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

const messages: Record<string, string> = {
  confirmed: "Your Al Baaqir order has been confirmed.",
  packed: "Your Al Baaqir order has been packed.",
  shipped: "Your Al Baaqir order has been shipped.",
  out_for_delivery: "Your Al Baaqir order is out for delivery.",
  delivered: "Your Al Baaqir order has been delivered successfully.",
};
const validStatuses = new Set(["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"]);

export async function POST(request: NextRequest) {
  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as Record<string, unknown>;
    const orderId = String(body.orderId ?? "").trim();
    const status = String(body.status ?? "").trim();
    if (!orderId || !validStatuses.has(status)) {
      return apiError("Invalid order status update.", 400);
    }

    const db = getFirestore(getAdminApp());
    const orderRef = db.collection("orders").doc(orderId);
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw new Error("Order not found.");
      const order = snapshot.data() ?? {};
      if (order.status === status) return { changed: false, customerId: "", invoiceNumber: "" };
      const update: Record<string, unknown> = { status, lastUpdated: FieldValue.serverTimestamp() };
      if (body.internalNotes !== undefined) update.internalNotes = String(body.internalNotes ?? "");
      transaction.update(orderRef, update);
      return {
        changed: true,
        customerId: String(order.customerId ?? ""),
        invoiceNumber: String(order.invoiceNumber ?? orderId),
      };
    });

    if (result.changed && messages[status] && result.customerId) {
      const user = await db.collection("users").doc(result.customerId).get();
      const tokens = Array.isArray(user.data()?.fcmTokens)
        ? user.data()!.fcmTokens.filter((token: unknown): token is string => typeof token === "string" && token.length > 0)
        : [];
      if (tokens.length) {
        await getMessaging(getAdminApp()).sendEachForMulticast({
          tokens,
          notification: { title: `Order ${result.invoiceNumber}`, body: messages[status] },
          data: { orderId, status },
          webpush: { fcmOptions: { link: `/my-orders?orderId=${encodeURIComponent(orderId)}` } },
        });
      }
    }
    return apiJson({ success: true, changed: result.changed });
  } catch (error) {
    console.error("Order status update failed:", error);
    return apiError(error instanceof Error ? error.message : "Unable to update order status.", 500);
  }
}

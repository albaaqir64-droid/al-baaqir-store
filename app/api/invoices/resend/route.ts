import { NextRequest } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { resendInvoiceEmail } from "@/app/lib/email";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { toOrderRecord } from "@/app/lib/invoiceOrder";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as { orderId?: string };
    const orderId = String(body.orderId ?? "").trim();
    if (!orderId) {
      return apiError("Order ID is required", 400);
    }

    const snapshot = await getFirestore(getAdminApp()).collection("orders").doc(orderId).get();
    if (!snapshot.exists) {
      return apiError("Order not found", 404);
    }

    const order = toOrderRecord(snapshot.id, snapshot.data() ?? {});

    if (!order.invoiceNumber || !order.invoiceUrl) {
      return apiError("Invoice not found for this order. Please generate invoice first.", 400);
    }

    if (!order.email) {
      return apiError("Customer email not found", 400);
    }

    const emailSent = await resendInvoiceEmail(order, order.invoiceUrl!, order.invoiceNumber);

    if (emailSent) {
      return apiJson({ success: true, message: "Invoice email resent successfully" });
    }

    return apiError("Failed to send invoice email", 500);
  } catch (error) {
    console.error("Error resending invoice:", error);
    return apiError(error instanceof Error ? error.message : "Failed to resend invoice email", 500, {
      details: String(error),
    });
  }
}

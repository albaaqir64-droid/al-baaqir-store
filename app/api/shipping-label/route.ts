import { NextRequest } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { apiError } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { toOrderRecord } from "@/app/lib/invoiceOrder";
import { generateShippingLabelPDF } from "@/app/lib/shippingLabel";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
  if (!orderId) return apiError("Order ID is required", 400);
  try {
    const snapshot = await getFirestore(getAdminApp()).collection("orders").doc(orderId).get();
    if (!snapshot.exists) return apiError("Order not found", 404);
    const order = toOrderRecord(snapshot.id, snapshot.data() ?? {});
    const pdf = await generateShippingLabelPDF(order);
    const filename = `shipping-label-${order.invoiceNumber || order.id}.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating shipping label:", error);
    return apiError(error instanceof Error ? error.message : "Failed to generate shipping label", 500);
  }
}

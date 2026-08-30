import { NextRequest } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { apiError } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { toOrderRecord } from "@/app/lib/invoiceOrder";
import { generateShippingLabelPDF } from "@/app/lib/shippingLabel";
import { getShiprocketLabel } from "@/app/lib/shiprocket";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
  if (!orderId) return apiError("Order ID is required", 400);

  try {
    const snapshot = await getFirestore(getAdminApp()).collection("orders").doc(orderId).get();
    if (!snapshot.exists) return apiError("Order not found", 404);

    const orderData = snapshot.data() ?? {};
    const order = toOrderRecord(snapshot.id, orderData);

    let pdfBuffer: Buffer | Uint8Array;
    let filename = `shipping-label-${order.invoiceNumber || order.id}.pdf`;

    // Try to get real Shiprocket label if shipment ID exists
    if (orderData.shiprocketShipmentId && orderData.shiprocketShipmentId !== "null" && orderData.shiprocketShipmentId !== "undefined") {
      try {
        const labelUrl = await getShiprocketLabel(orderData.shiprocketShipmentId);
        if (labelUrl) {
          const response = await fetch(labelUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            pdfBuffer = new Uint8Array(arrayBuffer);
          } else {
            console.warn("Failed to fetch PDF from Shiprocket URL, falling back to manual label");
            pdfBuffer = await generateShippingLabelPDF(order);
          }
        } else {
          pdfBuffer = await generateShippingLabelPDF(order);
        }
      } catch (srError) {
        console.error("Shiprocket label fetch error:", srError);
        pdfBuffer = await generateShippingLabelPDF(order);
      }
    } else {
      // Fallback to manual label if not synced
      pdfBuffer = await generateShippingLabelPDF(order);
    }

    return new Response(pdfBuffer as any, {
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

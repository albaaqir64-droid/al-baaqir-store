import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { toOrderRecord } from "@/app/lib/invoiceOrder";
import { generateShippingLabelPDF } from "@/app/lib/shippingLabel";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
  if (!orderId) return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  try {
    const snapshot = await getFirestore(getAdminApp()).collection("orders").doc(orderId).get();
    if (!snapshot.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = toOrderRecord(snapshot.id, snapshot.data() ?? {});
    const pdf = await generateShippingLabelPDF(order);
    const filename = `shipping-label-${order.invoiceNumber || order.id}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating shipping label:", error);
    return NextResponse.json({ error: "Failed to generate shipping label" }, { status: 500 });
  }
}

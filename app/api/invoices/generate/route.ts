import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { generateInvoicePDF } from "@/app/lib/invoice";
import { sendCustomerOrderEmail, sendAdminOrderEmail } from "@/app/lib/email";
import { getAdminApp, getAdminStorage } from "@/app/lib/firebaseAdmin";
import type { OrderRecord } from "@/app/lib/orders";
import { BUSINESS } from "@/app/lib/business";
import { toOrderRecord } from "@/app/lib/invoiceOrder";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function asFiniteNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

async function enrichTaxDetails(order: OrderRecord): Promise<OrderRecord> {
  const db = getFirestore(getAdminApp());
  const cartItems = await Promise.all(order.cartItems.map(async (item) => {
    if ((item.hsnSac && item.gstRate !== undefined) || !item.id) return item;
    const product = await db.collection("products").doc(item.id).get();
    if (!product.exists) return item;
    const data = product.data() ?? {};
    return {
      ...item,
      hsnSac: item.hsnSac || String(data.hsnSac ?? data.hsn ?? data.sac ?? "") || undefined,
      gstRate: item.gstRate || asFiniteNumber(data.gstRate ?? data.taxRate),
    };
  }));
  return { ...order, cartItems };
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Request body must be valid JSON", 400);
    }

    const orderId = typeof (body as { orderId?: unknown })?.orderId === "string"
      ? (body as { orderId: string }).orderId.trim()
      : "";
    if (!orderId) return jsonError("Order ID is required", 400);

    // This must use the Admin SDK. The browser SDK cannot access Firestore from
    // a Route Handler and was returning its "client is offline" error.
    const db = getFirestore(getAdminApp());
    const orderSnapshot = await db.collection("orders").doc(orderId).get();
    if (!orderSnapshot.exists) return jsonError("Order not found", 404);

    const rawOrder = orderSnapshot.data() ?? {};
    const order = await enrichTaxDetails(toOrderRecord(orderSnapshot.id, rawOrder));
    if (!order.cartItems.length) return jsonError("Order has no invoiceable items", 422);

    const invoiceNumber = order.invoiceNumber || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${orderId.slice(-6).toUpperCase()}`;
    const invoiceOrder = { ...order, invoiceNumber };
    const pdfBuffer = await generateInvoicePDF({
      order: invoiceOrder,
      storeName: BUSINESS.name,
      storeGST: BUSINESS.gstin,
    });

    const file = getAdminStorage().bucket().file(`invoices/${orderId}/${invoiceNumber}.pdf`);
    await file.save(pdfBuffer, { metadata: { contentType: "application/pdf" } });
    const [invoiceUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      // Google Cloud Storage V4 signed URLs are limited to seven days.
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    await orderSnapshot.ref.update({ invoiceNumber, invoiceUrl, invoiceGeneratedAt: new Date() });
    const customerEmailSent = await sendCustomerOrderEmail(invoiceOrder, invoiceUrl, invoiceNumber);
    const adminEmailSent = await sendAdminOrderEmail(invoiceOrder, invoiceUrl);

    return NextResponse.json({
      success: true,
      invoiceNumber,
      invoiceUrl,
      customerEmailSent,
      adminEmailSent,
      message: "Invoice generated successfully",
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return jsonError("Failed to generate invoice", 500);
  }
}

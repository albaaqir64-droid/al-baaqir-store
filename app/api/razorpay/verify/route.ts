import crypto from "crypto";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { sanitizeCartItems, sanitizeShipping } from "@/app/lib/firestore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const parsed = await readRequestJson(req);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as {
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
      orderMeta?: Record<string, unknown>;
    };

    const razorpay_payment_id = String(body.razorpay_payment_id ?? "");
    const razorpay_order_id = String(body.razorpay_order_id ?? "");
    const razorpay_signature = String(body.razorpay_signature ?? "");
    const orderMeta = body.orderMeta && typeof body.orderMeta === "object" ? body.orderMeta : {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return apiError("Missing Razorpay payment verification fields", 400);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return apiError("Razorpay secret not configured", 500);

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return apiError("Invalid signature", 400);
    }

    const orderItems = sanitizeCartItems(orderMeta.cartItems);
    const shipping = sanitizeShipping(orderMeta.shipping);

    if (!orderItems.length) {
      return apiError("Invalid order payload", 400);
    }

    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;

    const db = getFirestore(getAdminApp());
    const orderRef = db.collection("orders").doc();

    await orderRef.set({
      customerName: String(orderMeta.customerName ?? ""),
      phone: String(orderMeta.phone ?? ""),
      email: String(orderMeta.email ?? ""),
      customerGSTIN: String(orderMeta.customerGSTIN ?? "").trim().toUpperCase(),
      paymentMethod: String(orderMeta.paymentMethod ?? "razorpay"),
      subtotal: Number(orderMeta.subtotal ?? 0) || 0,
      shippingCharge: Number(orderMeta.shippingCharge ?? 0) || 0,
      total: Number(orderMeta.total ?? 0) || 0,
      invoiceNumber,
      status: "confirmed",
      shipping,
      cartItems: orderItems,
      payment: {
        provider: "razorpay",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
      },
      paymentStatus: "paid",
      createdAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    const orderId = orderRef.id;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const invoiceResponse = await fetch(`${baseUrl}/api/invoices/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!invoiceResponse.ok) {
        const invoiceBody = await invoiceResponse.text();
        console.warn("Failed to generate invoice automatically:", invoiceResponse.status, invoiceBody.slice(0, 500));
      }
    } catch (invoiceError) {
      console.error("Error triggering invoice generation:", invoiceError);
    }

    return apiJson({ ok: true, orderId });
  } catch (err) {
    console.error("Razorpay verify failed:", err);
    return apiError(err instanceof Error ? err.message : String(err), 500);
  }
}

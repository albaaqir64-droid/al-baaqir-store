import crypto from "crypto";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { sanitizeCartItems, sanitizeShipping } from "@/app/lib/firestore";
import { syncOrderToShiprocket } from "@/app/lib/shiprocket";

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

    // Use the invoice number from metadata if available, otherwise generate one
    const invoiceNumber = String(orderMeta.invoiceNumber || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

    const db = getFirestore(getAdminApp());
    const orderRef = db.collection("orders").doc();

    // --- STOCK DEDUCTION LOGIC ---
    await db.runTransaction(async (transaction) => {
      // 1. Get all unique product IDs from order
      const productIds = Array.from(new Set(orderItems.map(item => item.id)));
      const snapshots = await Promise.all(
        productIds.map(id => transaction.get(db.collection("products").doc(id)))
      );

      const productSnapshots = new Map(snapshots.map(s => [s.id, s]));

      // Group items by product ID to handle multiple variants of the same product correctly
      const itemsByProduct = new Map<string, typeof orderItems>();
      for (const item of orderItems) {
        const list = itemsByProduct.get(item.id) || [];
        list.push(item);
        itemsByProduct.set(item.id, list);
      }

      for (const [productId, items] of itemsByProduct.entries()) {
        const snap = productSnapshots.get(productId);
        if (!snap || !snap.exists) {
          throw new Error(`Product ${productId} no longer exists.`);
        }

        const product = snap.data() || {};
        const updates: Record<string, any> = { lastUpdated: FieldValue.serverTimestamp() };
        const variantStock = { ...(product.variantStock || {}) } as Record<string, number>;

        let totalQtyForThisProduct = 0;

        for (const item of items) {
          totalQtyForThisProduct += item.quantity;

          // Variant Deduction
          const size = item.selectedSize || "";
          const color = item.selectedColor || "";
          let vKey = "";
          if (size && color) vKey = `${size}_${color}`;
          else if (size) vKey = `size_${size}`;
          else if (color) vKey = `color_${color}`;

          if (vKey && variantStock[vKey] !== undefined) {
            const currentVStock = variantStock[vKey] || 0;
            if (currentVStock < item.quantity) {
              // Note: User has already paid. We deduct what we can,
              // but you might want to log this for manual refund/customer service.
              console.error(`Oversell detected during payment verification for ${productId} (${vKey})`);
            }
            variantStock[vKey] = Math.max(0, currentVStock - item.quantity);
          }
        }

        updates.variantStock = variantStock;

        // Main Stock Deduction
        const mainStockField = (product.inventory !== undefined) ? "inventory" :
                              (product.quantity !== undefined && product.stock === undefined) ? "quantity" : "stock";

        const currentStock = Number(product[mainStockField] || 0);
        if (currentStock < totalQtyForThisProduct) {
          console.error(`Oversell detected during payment verification for product ${productId}`);
        }
        updates[mainStockField] = Math.max(0, currentStock - totalQtyForThisProduct);

        transaction.update(snap.ref, updates);
      }

      // 3. Create Order
      transaction.set(orderRef, {
        customerName: String(orderMeta.customerName ?? ""),
        phone: String(orderMeta.phone ?? ""),
        email: String(orderMeta.email ?? ""),
        customerGSTIN: String(orderMeta.customerGSTIN ?? "").trim().toUpperCase(),
        paymentMethod: "online",
        subtotal: Number(orderMeta.subtotal ?? 0),
        discount: Number(orderMeta.discount ?? 0),
        shippingCharge: Number(orderMeta.shippingCharge ?? 0),
        total: Number(orderMeta.total ?? 0),
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
    });

    const orderId = orderRef.id;

    // --- SHIPROCKET INTEGRATION ---
    try {
      const orderDoc = await orderRef.get();
      const shiprocketResult = await syncOrderToShiprocket(orderId, orderDoc.data());
      await orderRef.update(shiprocketResult);
    } catch (shiprocketErr) {
      console.error("Shiprocket sync failed for order", orderId, shiprocketErr);
      await orderRef.update({
        shiprocketStatus: "FAILED",
        shiprocketError: shiprocketErr instanceof Error ? shiprocketErr.message : String(shiprocketErr),
        shiprocketSyncAt: FieldValue.serverTimestamp(),
      });
    }

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

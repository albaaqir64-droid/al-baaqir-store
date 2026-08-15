import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";

export const runtime = "nodejs";

class InsufficientStockError extends Error {}

function text(value: unknown) {
  return String(value ?? "").trim();
}
function amount(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export async function POST(request: Request) {
  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as Record<string, unknown>;
    const rawItems = Array.isArray(body.cartItems) ? body.cartItems : [];
    const items = rawItems
      .map((item) => {
        const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          id: text(value.id),
          name: text(value.name),
          price: amount(value.price),
          originalPrice: value.originalPrice !== undefined ? amount(value.originalPrice) : null,
          discountPercent: value.discountPercent !== undefined ? amount(value.discountPercent) : null,
          quantity: Math.floor(amount(value.quantity)),
          image: text(value.image),
          productUrl: text(value.productUrl),
          hsnSac: text(value.hsnSac) || null,
          gstRate: amount(value.gstRate),
        };
      })
      .filter((item) => item.id && item.name && item.quantity > 0);

    if (!items.length) return apiError("Your cart is empty.", 400);

    const shippingValue = body.shipping && typeof body.shipping === "object" ? body.shipping as Record<string, unknown> : {};
    const shipping = {
      name: text(shippingValue.name),
      phone: text(shippingValue.phone),
      address: text(shippingValue.address),
      city: text(shippingValue.city),
      state: text(shippingValue.state),
      pincode: text(shippingValue.pincode),
    };

    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.state || !/^[1-9][0-9]{5}$/.test(shipping.pincode)) {
      return apiError("Please provide a complete delivery address.", 400);
    }

    const db = getFirestore(getAdminApp());
    const orderRef = db.collection("orders").doc();
    const quantities = new Map<string, number>();
    for (const item of items) quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);

    await db.runTransaction(async (transaction) => {
      const products = await Promise.all(
        [...quantities.keys()].map(async (id) => [id, await transaction.get(db.collection("products").doc(id))] as const)
      );
      for (const [productId, snapshot] of products) {
        const requested = quantities.get(productId) ?? 0;
        const product = snapshot.data();
        const stock = Math.max(0, Math.floor(amount(product?.stock)));
        if (!snapshot.exists || product?.active === false || stock < requested) {
          const productName = text(product?.name) || "this product";
          throw new InsufficientStockError(`Only ${stock} item${stock === 1 ? "" : "s"} are available for ${productName}.`);
        }
        transaction.update(snapshot.ref, { stock: stock - requested, lastUpdated: FieldValue.serverTimestamp() });
      }

      transaction.create(orderRef, {
        customerId: text(body.customerId) || null,
        customerName: text(body.customerName),
        phone: text(body.phone),
        email: text(body.email) || null,
        customerGSTIN: text(body.customerGSTIN).toUpperCase() || null,
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "pending",
        subtotal: amount(body.subtotal),
        shippingCharge: amount(body.shippingCharge),
        total: amount(body.total),
        invoiceNumber: text(body.invoiceNumber),
        shipping,
        cartItems: items,
        createdAt: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
      });
    });

    return apiJson({ success: true, orderId: orderRef.id });
  } catch (error) {
    if (error instanceof InsufficientStockError) return apiError(error.message, 409);
    console.error("Order creation failed:", error);
    return apiError(error instanceof Error ? error.message : "Unable to create your order. Please try again.", 500);
  }
}

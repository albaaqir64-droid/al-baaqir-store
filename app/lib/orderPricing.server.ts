import "server-only";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "./firebaseAdmin";

export interface OrderLineItem {
  id: string;
  quantity?: number;
  qty?: number;
}

/**
 * Authoritative pricing engine to prevent client-side price manipulation.
 * Always calculates based on Firestore product data.
 */
export async function computeVerifiedOrderTotals(
  cartItems: OrderLineItem[],
  paymentMethod: "online" | "cod"
) {
  const db = getFirestore(getAdminApp());

  if (!cartItems || !cartItems.length) {
    throw new Error("Cart is empty");
  }

  // Fetch all products in one batch
  const productRefs = cartItems.map(item => db.collection("products").doc(item.id));
  const productSnaps = await db.getAll(...productRefs);

  let subtotal = 0;
  const verifiedLines = [];

  for (let i = 0; i < productSnaps.length; i++) {
    const snap = productSnaps[i];
    const requestedItem = cartItems[i];
    const quantity = Number(requestedItem.quantity || requestedItem.qty || 0);

    if (!snap.exists) {
      throw new Error(`Product not found: ${requestedItem.id}`);
    }

    if (quantity <= 0) continue;

    const data = snap.data()!;
    let price = Number(data.price) || 0;

    // Apply discount if exists in Firestore
    const discountPercent = Number(data.discountPercent) || 0;
    if (discountPercent > 0) {
      price = price - (price * discountPercent) / 100;
    }

    subtotal += price * quantity;

    verifiedLines.push({
      id: requestedItem.id,
      name: data.name,
      price: price,
      quantity: quantity,
      image: data.images?.[0] || data.image || ""
    });
  }

  // Business Logic: 10% discount for online payments (Prepaid)
  let discount = 0;
  if (paymentMethod === "online") {
    discount = Math.round(subtotal * 0.10);
  }

  // Shipping Logic: Free shipping as per current Checkout UI
  const shippingCharge = 0;

  const total = subtotal - discount + shippingCharge;

  return {
    lines: verifiedLines,
    subtotal,
    discount,
    shippingCharge,
    total: Math.max(0, total)
  };
}

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { getAdminApp } from "@/app/lib/firebaseAdmin";
import { syncOrderToShiprocket } from "@/app/lib/shiprocket";

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
          quantity: Math.floor(amount(value.quantity || value.qty)),
          image: text(value.image),
          productUrl: text(value.productUrl),
          hsnSac: text(value.hsnSac) || null,
          gstRate: amount(value.gstRate),
          category: text(value.category),
          selectedSize: text(value.selectedSize) || null,
          selectedColor: text(value.selectedColor) || null,
          dimensions: value.dimensions && typeof value.dimensions === "object" ? {
            length: amount((value.dimensions as any).length),
            breadth: amount((value.dimensions as any).breadth),
            height: amount((value.dimensions as any).height),
          } : null,
          weight: value.weight !== undefined ? amount(value.weight) : null,
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
        const product = snapshot.data();
        const requestedTotal = quantities.get(productId) ?? 0;

        if (!snapshot.exists || product?.active === false) {
          const productName = text(product?.name) || "this product";
          throw new InsufficientStockError(`${productName} is no longer available.`);
        }

        const updates: Record<string, any> = { lastUpdated: FieldValue.serverTimestamp() };
        const variantStock = (product?.variantStock || {}) as Record<string, number>;
        let hasVariantUpdates = false;

        // 1. Check and update variant-specific stock
        for (const item of items.filter(i => i.id === productId)) {
          const size = item.selectedSize || "";
          const color = item.selectedColor || "";

          let vKey = "";
          if (size && color) vKey = `${size}_${color}`;
          else if (size) vKey = `size_${size}`;
          else if (color) vKey = `color_${color}`;

          if (vKey && variantStock[vKey] !== undefined) {
            const currentVStock = Math.max(0, Math.floor(amount(variantStock[vKey])));
            if (currentVStock < item.quantity) {
              const variantLabel = size && color ? `${size}/${color}` : (size || color);
              throw new InsufficientStockError(`Only ${currentVStock} items available for ${item.name} (${variantLabel}).`);
            }
            variantStock[vKey] = currentVStock - item.quantity;
            hasVariantUpdates = true;
          }
        }

        if (hasVariantUpdates) {
          updates.variantStock = variantStock;
        }

        // 2. Update main stock field (fallback lookup: stock -> inventory -> quantity)
        const mainStockField = (product?.inventory !== undefined) ? "inventory" :
                              (product?.quantity !== undefined && product?.stock === undefined) ? "quantity" : "stock";

        const currentMainStock = Math.max(0, Math.floor(amount(product?.[mainStockField] ?? 0)));
        if (currentMainStock < requestedTotal) {
          const productName = text(product?.name) || "this product";
          throw new InsufficientStockError(`Only ${currentMainStock} items available for ${productName}.`);
        }

        updates[mainStockField] = currentMainStock - requestedTotal;
        transaction.update(snapshot.ref, updates);
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
        discount: amount(body.discount),
        shippingCharge: amount(body.shippingCharge),
        total: amount(body.total),
        invoiceNumber: text(body.invoiceNumber),
        shipping,
        cartItems: items,
        createdAt: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
      });
    });

    const orderId = orderRef.id;

    // --- SHIPROCKET INTEGRATION ---
    try {
      const orderDoc = await orderRef.get();
      const orderData = orderDoc.data();

      // Safety: Only sync if it hasn't been synced yet (though it's a new order here)
      if (orderData && !orderData.shiprocketOrderId) {
        const shiprocketResult = await syncOrderToShiprocket(orderId, orderData);

        // Update Firestore with the actual result from Shiprocket
        await orderRef.update(shiprocketResult);

        // Log for server debugging
        if (shiprocketResult.shiprocketStatus === "FAILED") {
          console.error(`[Order-Create] Shiprocket Sync FAILED for ${orderId}:`, shiprocketResult.shiprocketError);
        } else {
          console.log(`[Order-Create] Shiprocket Sync SUCCESS for ${orderId}. SR Order ID: ${shiprocketResult.shiprocketOrderId}`);
        }
      }
    } catch (shiprocketErr) {
      console.error("Shiprocket sync failed for order", orderId, shiprocketErr);
      await orderRef.update({
        shiprocketStatus: "FAILED",
        shiprocketError: shiprocketErr instanceof Error ? shiprocketErr.message : String(shiprocketErr),
        shiprocketSyncAt: FieldValue.serverTimestamp(),
      });
    }

    return apiJson({ success: true, orderId });
  } catch (error) {
    if (error instanceof InsufficientStockError) return apiError(error.message, 409);
    console.error("Order creation failed:", error);
    return apiError(error instanceof Error ? error.message : "Unable to create your order. Please try again.", 500);
  }
}

import type { OrderRecord, OrderStatus } from "./orders";
import { GSTIN_PATTERN } from "./business";

function asFiniteNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function toOrderRecord(id: string, data: Record<string, unknown>): OrderRecord {
  const shippingData = (data.shipping && typeof data.shipping === "object" ? data.shipping : {}) as Record<string, unknown>;
  const items = Array.isArray(data.cartItems) ? data.cartItems : [];
  const customerGSTIN = String(data.customerGSTIN ?? data.gstin ?? "").trim().toUpperCase();

  return {
    id,
    customerName: String(data.customerName ?? ""), phone: String(data.phone ?? ""), email: String(data.email ?? ""),
    customerGSTIN: GSTIN_PATTERN.test(customerGSTIN) ? customerGSTIN : "", paymentMethod: String(data.paymentMethod ?? "cod"),
    subtotal: asFiniteNumber(data.subtotal), shippingCharge: asFiniteNumber(data.shippingCharge), total: asFiniteNumber(data.total),
    status: String(data.status ?? "pending") as OrderStatus, createdAt: data.createdAt ?? null, lastUpdated: data.lastUpdated ?? null,
    invoiceNumber: String(data.invoiceNumber ?? ""), invoiceUrl: typeof data.invoiceUrl === "string" ? data.invoiceUrl : undefined,
    invoiceGeneratedAt: data.invoiceGeneratedAt,
    shipping: { name: String(shippingData.name ?? ""), phone: String(shippingData.phone ?? ""), address: String(shippingData.address ?? ""), city: String(shippingData.city ?? ""), state: String(shippingData.state ?? ""), pincode: String(shippingData.pincode ?? "") },
    cartItems: items.map((item) => {
      const orderItem = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return { id: String(orderItem.id ?? ""), name: String(orderItem.name ?? ""), price: asFiniteNumber(orderItem.price), quantity: asFiniteNumber(orderItem.quantity), image: String(orderItem.image ?? ""), slug: String(orderItem.slug ?? ""), hsnSac: String(orderItem.hsnSac ?? orderItem.hsn ?? orderItem.sac ?? "") || undefined, gstRate: asFiniteNumber(orderItem.gstRate ?? orderItem.taxRate) };
    }),
  };
}

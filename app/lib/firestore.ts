/* eslint-disable @typescript-eslint/no-explicit-any */

export type SanitizedOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productUrl: string;
};

export function sanitizeCartItem(item: any): SanitizedOrderItem {
  return {
    id: String(item?.id ?? ""),
    name: String(item?.name ?? ""),
    price: Number(item?.price ?? item?.qty ?? 0) || 0,
    quantity: Number(item?.quantity ?? item?.qty ?? 0) || 0,
    image: String(item?.image ?? ""),
    productUrl: String(item?.productUrl ?? ""),
  };
}

export function sanitizeCartItems(items: unknown): SanitizedOrderItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(sanitizeCartItem)
    .filter((item) => item.id && item.name && !Number.isNaN(item.price) && !Number.isNaN(item.quantity));
}

export function sanitizeShipping(shipping: any) {
  return {
    name: String(shipping?.name ?? ""),
    phone: String(shipping?.phone ?? ""),
    address: String(shipping?.address ?? ""),
    city: String(shipping?.city ?? ""),
    state: String(shipping?.state ?? ""),
    pincode: String(shipping?.pincode ?? ""),
  };
}

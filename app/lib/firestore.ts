/* eslint-disable @typescript-eslint/no-explicit-any */

export type SanitizedOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productUrl: string;
  hsnSac?: string;
  gstRate?: number;
  selectedSize?: string;
  selectedColor?: string;
  dimensions?: {
    length?: number;
    breadth?: number;
    height?: number;
  };
  weight?: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Firestore does not accept undefined, including inside nested objects or
 * arrays. Plain-object fields with undefined values are omitted; array slots
 * are represented as null so the array keeps its intended shape. Firestore
 * values such as serverTimestamp() are deliberately left unchanged.
 */
export function sanitizeFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : sanitizeFirestoreData(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, sanitizeFirestoreData(item)])
    ) as T;
  }

  return value;
}

export function sanitizeCartItem(item: any): SanitizedOrderItem {
  return sanitizeFirestoreData({
    id: String(item?.id ?? ""),
    name: String(item?.name ?? ""),
    price: Number(item?.price ?? 0) || 0,
    quantity: Number(item?.quantity ?? item?.qty ?? 0) || 0,
    image: String(item?.image ?? ""),
    productUrl: String(item?.productUrl ?? ""),
    hsnSac: String(item?.hsnSac ?? item?.hsn ?? item?.sac ?? "") || undefined,
    gstRate: Number(item?.gstRate ?? item?.taxRate ?? 0) || 0,
    selectedSize: item?.selectedSize || undefined,
    selectedColor: item?.selectedColor || undefined,
    dimensions: item?.dimensions ? {
      length: Number(item.dimensions.length) || 0,
      breadth: Number(item.dimensions.breadth) || 0,
      height: Number(item.dimensions.height) || 0,
    } : undefined,
    weight: item?.weight !== undefined ? Number(item.weight) : undefined,
  });
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

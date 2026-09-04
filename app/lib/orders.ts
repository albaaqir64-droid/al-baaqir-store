/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "./firebase";
import { readApiJson } from "./api/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
} from "firebase/firestore";

function isClientOffline() {
  return typeof window !== "undefined" && window.navigator?.onLine === false;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  image: string;
  slug: string;
  category?: string;
  hsnSac?: string;
  gstRate?: number;
}

export interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderRecord {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email?: string;
  customerGSTIN?: string;
  paymentMethod: string;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: any;
  lastUpdated: any;
  invoiceNumber: string;
  invoiceUrl?: string;
  invoiceGeneratedAt?: any;
  shipping: ShippingInfo;
  cartItems: OrderItem[];
  internalNotes?: string;
  // Shiprocket Integration
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  shiprocketStatus?: string;
  shiprocketError?: string;
  shiprocketSyncAt?: string;
}

function normalizeOrder(id: string, data: DocumentData): OrderRecord {
  const cartItems = Array.isArray(data.cartItems)
    ? data.cartItems.map((item: any) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        originalPrice: item.originalPrice !== undefined ? Number(item.originalPrice) : undefined,
        discountPercent: item.discountPercent !== undefined ? Number(item.discountPercent) : undefined,
        quantity: Number(item.quantity ?? 0),
        image: String(item.image ?? ""),
        slug: String(item.slug ?? ""),
        category: String(item.category ?? ""),
        hsnSac: String(item.hsnSac ?? item.hsn ?? item.sac ?? "") || undefined,
        gstRate: Number(item.gstRate ?? item.taxRate ?? 0) || 0,
      }))
    : [];

  return {
    id,
    customerId: data.customerId || undefined,
    customerName: String(data.customerName ?? ""),
    phone: String(data.phone ?? ""),
    email: String(data.email ?? ""),
    customerGSTIN: String(data.customerGSTIN ?? data.gstin ?? ""),
    paymentMethod: String(data.paymentMethod ?? "cod"),
    subtotal: Number(data.subtotal ?? 0),
    shippingCharge: Number(data.shippingCharge ?? 0),
    discount: Number(data.discount ?? 0),
    total: Number(data.total ?? 0),
    status: ORDER_STATUSES.includes(data.status) ? data.status : "pending",
    createdAt: data.createdAt ?? null,
    lastUpdated: data.lastUpdated ?? null,
    invoiceNumber: String(data.invoiceNumber ?? ""),
    shipping: {
      name: String(data.shipping?.name ?? ""),
      phone: String(data.shipping?.phone ?? ""),
      address: String(data.shipping?.address ?? ""),
      city: String(data.shipping?.city ?? ""),
      state: String(data.shipping?.state ?? ""),
      pincode: String(data.shipping?.pincode ?? ""),
    },
    cartItems,
    invoiceUrl: data.invoiceUrl ?? undefined,
    invoiceGeneratedAt: data.invoiceGeneratedAt ?? undefined,
    internalNotes: String(data.internalNotes ?? ""),
    shiprocketOrderId: data.shiprocketOrderId || undefined,
    shiprocketShipmentId: data.shiprocketShipmentId || undefined,
    shiprocketStatus: data.shiprocketStatus || undefined,
    shiprocketError: data.shiprocketError || undefined,
    shiprocketSyncAt: data.shiprocketSyncAt || undefined,
  };
}

export async function fetchOrders(options: {
  status?: OrderStatus;
  search?: string;
  phone?: string;
  customerId?: string;
  email?: string;
} = {}): Promise<OrderRecord[]> {
  if (isClientOffline()) {
    return [];
  }

  const ordersRef = collection(db, "orders");
  let ordersQuery = query(ordersRef);

  if (options.status) {
    ordersQuery = query(ordersQuery, where("status", "==", options.status));
  }

  if (options.customerId) {
    ordersQuery = query(ordersQuery, where("customerId", "==", options.customerId));
  } else if (options.phone) {
    ordersQuery = query(ordersQuery, where("phone", "==", options.phone));
  } else if (options.email) {
    ordersQuery = query(ordersQuery, where("email", "==", options.email));
  }

  const snapshot = await getDocs(ordersQuery);
  const list = snapshot.docs.map((docSnap) => normalizeOrder(docSnap.id, docSnap.data()));

  // Sort in memory to avoid needing a composite index
  list.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  if (options.search) {
    const queryText = options.search.toLowerCase();
    return list.filter(
      (order) =>
        order.customerName.toLowerCase().includes(queryText) ||
        order.phone.includes(queryText) ||
        order.invoiceNumber.toLowerCase().includes(queryText) ||
        order.cartItems.some((item) => item.name.toLowerCase().includes(queryText))
    );
  }

  return list;
}

export async function fetchOrderById(orderId: string): Promise<OrderRecord | null> {
  const docRef = doc(db, "orders", orderId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return normalizeOrder(docSnap.id, docSnap.data());
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  updates: Partial<Pick<OrderRecord, "internalNotes" | "shipping">> = {}
): Promise<void> {
  const response = await fetch("/api/orders/status", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, status, internalNotes: updates.internalNotes }),
  });
  const parsed = await readApiJson<{ error?: string }>(response);
  if (!parsed.ok) {
    throw new Error(parsed.error || "Unable to update order status.");
  }
}

export function generateInvoiceNumber(): string {
  const base = Date.now().toString().slice(-8);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `ALB-${base}-${suffix}`;
}

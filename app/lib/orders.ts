/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
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
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
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
  customerName: string;
  phone: string;
  email?: string;
  paymentMethod: string;
  subtotal: number;
  shippingCharge: number;
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
}

function normalizeOrder(id: string, data: DocumentData): OrderRecord {
  const cartItems = Array.isArray(data.cartItems)
    ? data.cartItems.map((item: any) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 0),
        image: String(item.image ?? ""),
        slug: String(item.slug ?? ""),
      }))
    : [];

  return {
    id,
    customerName: String(data.customerName ?? ""),
    phone: String(data.phone ?? ""),
    email: String(data.email ?? ""),
    paymentMethod: String(data.paymentMethod ?? "cod"),
    subtotal: Number(data.subtotal ?? 0),
    shippingCharge: Number(data.shippingCharge ?? 0),
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
  };
}

export async function fetchOrders(options: {
  status?: OrderStatus;
  search?: string;
  phone?: string;
} = {}): Promise<OrderRecord[]> {
  if (isClientOffline()) {
    return [];
  }

  const ordersRef = collection(db, "orders");
  let ordersQuery = query(ordersRef, orderBy("createdAt", "desc"));

  if (options.status) {
    ordersQuery = query(ordersQuery, where("status", "==", options.status));
  }

  if (options.phone) {
    ordersQuery = query(ordersQuery, where("phone", "==", options.phone));
  }

  const snapshot = await getDocs(ordersQuery);
  const list = snapshot.docs.map((docSnap) => normalizeOrder(docSnap.id, docSnap.data()));

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
  const orderRef = doc(db, "orders", orderId);
  const payload: Record<string, unknown> = {
    status,
    lastUpdated: serverTimestamp(),
  };

  if (updates.internalNotes !== undefined) {
    payload.internalNotes = updates.internalNotes;
  }

  if (updates.shipping) {
    payload.shipping = {
      name: String(updates.shipping.name ?? ""),
      phone: String(updates.shipping.phone ?? ""),
      address: String(updates.shipping.address ?? ""),
      city: String(updates.shipping.city ?? ""),
      state: String(updates.shipping.state ?? ""),
      pincode: String(updates.shipping.pincode ?? ""),
    };
  }

  await updateDoc(orderRef, payload);
}

export function generateInvoiceNumber(): string {
  const base = Date.now().toString().slice(-8);
  const suffix = Math.floor(100 + Math.random() * 900);
  return `ALB-${base}-${suffix}`;
}

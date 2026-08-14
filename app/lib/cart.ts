/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getOrCreateCurrentUserId } from "./auth";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  productUrl: string;
  hsnSac?: string;
  gstRate?: number;
  stock?: number;
};

const CART_KEY = 'albaaqir_cart';
const CART_COLLECTION = 'carts';

function getCartDocRef(userId: string) {
  return doc(db, CART_COLLECTION, userId);
}

function isBrowserOnline() {
  return typeof window !== 'undefined' && window.navigator?.onLine !== false;
}

export function sanitizeCartItem(item: any): CartItem {
  const price = Number(item?.price ?? 0);
  const qty = Number(item?.qty ?? item?.quantity ?? 0);
  return {
    id: String(item?.id ?? ""),
    name: String(item?.name ?? ""),
    price: !isNaN(price) ? price : 0,
    qty: !isNaN(qty) ? qty : 0,
    image: String(item?.image ?? ""),
    productUrl: String(item?.productUrl ?? ""),
    hsnSac: String(item?.hsnSac ?? item?.hsn ?? item?.sac ?? "") || undefined,
    gstRate: Number(item?.gstRate ?? item?.taxRate ?? 0) || 0,
    stock: Number.isFinite(Number(item?.stock)) ? Math.max(0, Math.floor(Number(item.stock))) : undefined,
  };
}

export function sanitizeCartItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(sanitizeCartItem)
    .filter((item) => item && item.id !== "" && item.qty > 0);
}

export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(CART_KEY);
    if (!value) return [];
    return sanitizeCartItems(JSON.parse(value));
  } catch {
    return [];
  }
}

function saveLocalCartItems(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  const safeItems = sanitizeCartItems(items);
  window.localStorage.setItem(CART_KEY, JSON.stringify(safeItems));
  window.dispatchEvent(new Event('albaaqir-cart-updated'));
}

export function getCartItemCount() {
  return getCartItems().reduce((sum, item) => sum + item.qty, 0);
}

function normalizeFirestoreCartItems(items: unknown): CartItem[] {
  return sanitizeCartItems(items);
}

export async function loadCartItems(): Promise<CartItem[]> {
  if (typeof window === 'undefined') return [];
  const localItems = getCartItems();
  const userId = getOrCreateCurrentUserId();
  if (!userId) return localItems;

  if (!isBrowserOnline()) {
    return localItems;
  }

  try {
    const snapshot = await getDoc(getCartDocRef(userId));
    if (!snapshot.exists()) {
      if (localItems.length) {
        void persistCartItems(localItems);
      }
      return localItems;
    }

    const data = snapshot.data();
    const firestoreItems = normalizeFirestoreCartItems(data.items ?? []);
    if (firestoreItems.length) {
      saveLocalCartItems(firestoreItems);
      return firestoreItems;
    }

    if (localItems.length) {
      saveLocalCartItems(localItems);
      void persistCartItems(localItems);
    }

    return localItems;
  } catch (error) {
    console.error("Unable to load cart from Firestore:", error);
    return localItems;
  }
}

function serializeCartItem(item: CartItem): Record<string, any> {
  // Ensure all values are valid Firestore types
  const id = String(item.id || "").trim().substring(0, 255);
  const name = String(item.name || "").trim().substring(0, 500);
  const image = String(item.image || "").trim().substring(0, 2000);
  const productUrl = String(item.productUrl || "").trim().substring(0, 2000);
  const price = Number(item.price) || 0;
  const qty = Number(item.qty) || 0;
  const gstRate = Number(item.gstRate ?? 0) || 0;

  // Validate numbers are finite
  if (!isFinite(price) || !isFinite(qty)) {
    console.warn("Invalid number in cart item:", item);
    return null as any;
  }

  // Ensure no undefined values
  if (!id || !name) {
    console.warn("Missing required fields in cart item:", item);
    return null as any;
  }

  return {
    id,
    name,
    price,
    qty,
    image,
    productUrl,
    hsnSac: item.hsnSac || "",
    gstRate,
  };
}

export async function persistCartItems(items: CartItem[]) {
  const userId = getOrCreateCurrentUserId();
  if (!userId) return;

  const safeItems = sanitizeCartItems(items)
    .map(serializeCartItem)
    .filter((item) => item !== null);

  if (!isBrowserOnline()) {
    return;
  }

  try {
    await setDoc(
      getCartDocRef(userId),
      {
        userId,
        items: safeItems,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Unable to persist cart to Firestore:", error);
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  const sanitized = sanitizeCartItems(items);
  saveLocalCartItems(sanitized);
  if (isBrowserOnline()) {
    void persistCartItems(sanitized);
  }
}

export function addCartItem(item: Omit<CartItem, 'qty'>, quantity: number) {
  const current = getCartItems();
  const existing = current.find((entry) => entry.id === item.id);
  const stockLimit = Number.isFinite(Number(item.stock)) ? Math.max(0, Math.floor(Number(item.stock))) : Number.POSITIVE_INFINITY;
  if (stockLimit < 1) return current;
  if (existing) {
    existing.qty = Math.min(stockLimit, existing.qty + quantity);
    if (existing.qty < 1) existing.qty = 1;
  } else {
    current.push({ ...item, qty: Math.min(stockLimit, Math.max(1, quantity)) });
  }
  saveCartItems(current);
  return current;
}

export function updateCartItemQty(id: string, qty: number) {
  const current = getCartItems();
  const next = current.map((item) => item.id === id ? { ...item, qty: Math.max(1, qty) } : item);
  saveCartItems(next);
  return next;
}

export function removeCartItem(id: string) {
  const next = getCartItems().filter((item) => item.id !== id);
  saveCartItems(next);
  return next;
}

export function clearCart() {
  saveCartItems([]);
}

/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "./firebase";
import { getOrCreateCurrentUserId } from "./auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  productUrl: string;
};

const WISHLIST_KEY = "albaaqir_wishlist";
const WISHLIST_COLLECTION = "wishlists";

// Store only IDs locally to save space
const LOCAL_WISHLIST_IDS_KEY = "albaaqir_wishlist_ids";

export function sanitizeWishlistItem(item: any): WishlistItem {
  return {
    id: String(item?.id ?? "").trim(),
    name: String(item?.name ?? "").trim(),
    price: Number(item?.price ?? 0) || 0,
    image: String(item?.image ?? ""),
    productUrl: String(item?.productUrl ?? ""),
  };
}

export function sanitizeWishlistItems(items: unknown): WishlistItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map(sanitizeWishlistItem)
    .filter((item) => item && item.id !== "");
}

function getLocalWishlistIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const value = window.localStorage.getItem(LOCAL_WISHLIST_IDS_KEY);
    if (!value) return new Set();
    return new Set(JSON.parse(value));
  } catch {
    return new Set();
  }
}

function saveLocalWishlistIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_WISHLIST_IDS_KEY, JSON.stringify(Array.from(ids)));
    window.dispatchEvent(new Event("albaaqir-wishlist-updated"));
  } catch (error) {
    console.error("Unable to save wishlist IDs to localStorage:", error);
  }
}

function getLocalWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(WISHLIST_KEY);
    if (!value) return [];
    return sanitizeWishlistItems(JSON.parse(value));
  } catch {
    return [];
  }
}

function saveLocalWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  const safeItems = sanitizeWishlistItems(items);
  
  try {
    // Save full items to Firestore
    const ids = new Set(safeItems.map(item => item.id));
    saveLocalWishlistIds(ids);
    
    // Try to save to localStorage, but fail gracefully if quota exceeded
    try {
      window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(safeItems));
    } catch (e) {
      console.warn("Wishlist data too large for localStorage, storing IDs only:", e);
    }
    
    window.dispatchEvent(new Event("albaaqir-wishlist-updated"));
  } catch (error) {
    console.error("Unable to save wishlist:", error);
  }
}

function isBrowserOnline() {
  return typeof window !== 'undefined' && window.navigator?.onLine !== false;
}

function getWishlistDocRef(userId: string) {
  return doc(db, WISHLIST_COLLECTION, userId);
}

async function persistWishlistItems(items: WishlistItem[]) {
  const userId = getOrCreateCurrentUserId();
  if (!userId) return;

  if (!isBrowserOnline()) {
    return;
  }

  const safeItems = sanitizeWishlistItems(items);

  try {
    await setDoc(
      getWishlistDocRef(userId),
      {
        userId,
        items: safeItems,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Unable to persist wishlist to Firestore:", error);
  }
}

export function getWishlistItems(): WishlistItem[] {
  return getLocalWishlist();
}

export async function loadWishlistItems(): Promise<WishlistItem[]> {
  const userId = getOrCreateCurrentUserId();
  if (!userId) {
    return getLocalWishlist();
  }

  if (!isBrowserOnline()) {
    return getLocalWishlist();
  }

  try {
    const snapshot = await getDoc(getWishlistDocRef(userId));
    if (!snapshot.exists()) {
      return getLocalWishlist();
    }

    const data = snapshot.data();
    if (!Array.isArray(data.items)) {
      return getLocalWishlist();
    }

    const items = sanitizeWishlistItems(data.items);
    saveLocalWishlist(items);
    return items;
  } catch (error) {
    console.error("Unable to load wishlist from Firestore:", error);
    return getLocalWishlist();
  }
}

export function toggleWishlistItem(item: WishlistItem) {
  if (typeof window === "undefined") return [];

  getOrCreateCurrentUserId();

  const next = getLocalWishlist();
  const existingIndex = next.findIndex((entry) => entry.id === item.id);

  if (existingIndex >= 0) {
    next.splice(existingIndex, 1);
  } else {
    next.push(item);
  }

  saveLocalWishlist(next);
  void persistWishlistItems(next);
  return sanitizeWishlistItems(next);
}

export function isWishlisted(id: string) {
  return getLocalWishlistIds().has(id);
}

export function removeWishlistItem(id: string) {
  if (typeof window === "undefined") return [];
  getOrCreateCurrentUserId();
  const next = getLocalWishlist().filter((item) => item.id !== id);
  saveLocalWishlist(next);
  void persistWishlistItems(next);
  return next;
}

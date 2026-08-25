/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  DocumentData,
  limit as firestoreLimit,
} from "firebase/firestore";
import type { ProductRecord } from "./productTypes";
import { sanitizeText } from "./utils";

function createSlug(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 200);
}

function normalizeProductImageUrl(value: unknown): string {
  const imageUrl = String(value ?? "").trim();
  if (!imageUrl.startsWith("gs://")) return imageUrl;

  const [, bucketAndPath = ""] = imageUrl.split("gs://");
  const slashIndex = bucketAndPath.indexOf("/");
  if (slashIndex < 1) return imageUrl;

  const bucket = bucketAndPath.slice(0, slashIndex);
  const objectPath = bucketAndPath.slice(slashIndex + 1)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `https://storage.googleapis.com/${bucket}/${objectPath}`;
}

function normalizeProduct(docSnap: DocumentData): ProductRecord {
  const data = docSnap.data();
  const createdAtValue = data.createdAt;
  const lastUpdatedValue = data.lastUpdated;

  const normalizeTimestamp = (value: any) => {
    if (value?.toMillis) return value.toMillis();
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    return null;
  };

  const galleryImages = Array.isArray(data.galleryImages)
    ? data.galleryImages.map(normalizeProductImageUrl)
    : Array.isArray(data.images)
      ? data.images.map(normalizeProductImageUrl)
      : [];
  const discountValue = Number(data.discount ?? data.discountPercent ?? 0) || 0;

  return {
    id: docSnap.id,
    name: sanitizeText(String(data.name ?? "")),
    category: String(data.category ?? ""),
    gender: String(data.gender ?? ""),
    price: Number(data.price ?? 0),
    stock: Number(data.stock ?? 0),
    discountPercent: discountValue,
    discount: discountValue,
    active: data.active !== false,
    featured: data.featured === true,
    description: sanitizeText(String(data.description ?? "")),
    // Older products may use `coverImage`; prefer the current mainImage field
    // but retain that existing catalog data as the display image fallback.
    mainImage: normalizeProductImageUrl(data.mainImage ?? data.coverImage ?? data.image),
    images: galleryImages,
    galleryImages,
    slug: String(data.slug ?? createSlug(String(data.name ?? ""))),
    createdAt: normalizeTimestamp(createdAtValue),
    lastUpdated: normalizeTimestamp(lastUpdatedValue),
    sizes: Array.isArray(data.sizes) ? data.sizes.map((item: any) => String(item ?? "")) : undefined,
    colors: Array.isArray(data.colors) ? data.colors.map((item: any) => String(item ?? "")) : undefined,
    rating: data.rating != null ? Number(data.rating) : undefined,
    hsnSac: String(data.hsnSac ?? data.hsn ?? data.sac ?? "") || undefined,
    gstRate: data.gstRate != null || data.taxRate != null ? Number(data.gstRate ?? data.taxRate) || 0 : undefined,
  };
}

function productTimestampMs(product: ProductRecord) {
  const timestamp = product.createdAt;
  if (timestamp?.toMillis) return timestamp.toMillis();
  if (timestamp instanceof Date) return timestamp.getTime();
  return 0;
}

function sortByCreatedAtDesc(a: ProductRecord, b: ProductRecord) {
  return productTimestampMs(b) - productTimestampMs(a);
}

/** Firestore rejects undefined values, including optional blank form fields. */
export async function fetchAllProducts(): Promise<ProductRecord[]> {
  const productsRef = collection(db, "products");
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map(normalizeProduct).sort(sortByCreatedAtDesc);
}

export async function fetchProducts(activeOnly: boolean = true): Promise<ProductRecord[]> {
  const productsRef = collection(db, "products");
  const snapshot = activeOnly
    ? await getDocs(query(productsRef, where("active", "==", true)))
    : await getDocs(productsRef);
  const products = snapshot.docs.map(normalizeProduct);
  return products.sort(sortByCreatedAtDesc);
}

export async function fetchProductById(id: string): Promise<ProductRecord | null> {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return normalizeProduct(docSnap);
}

export async function fetchProductsByCategory(category: string): Promise<ProductRecord[]> {
  const productsRef = collection(db, "products");
  const categoryQuery = query(productsRef, where("category", "==", category), where("active", "==", true));
  const snapshot = await getDocs(categoryQuery);
  return snapshot.docs.map(normalizeProduct).sort(sortByCreatedAtDesc);
}

export async function fetchProductsByGender(gender: string): Promise<ProductRecord[]> {
  const products = await fetchProducts(true);
  return products.filter(p => p.gender === gender || p.gender === "Unisex");
}

export async function fetchSaleProducts(limit: number = 12): Promise<ProductRecord[]> {
  const productsRef = collection(db, "products");
  const saleQuery = query(
    productsRef,
    where("discountPercent", ">", 0),
    where("active", "==", true),
    firestoreLimit(limit)
  );
  const snapshot = await getDocs(saleQuery);
  return snapshot.docs.map(normalizeProduct).sort(sortByCreatedAtDesc);
}

/**
 * Fetches unique categories that have at least one active product.
 */
export async function fetchActiveCategories(): Promise<string[]> {
  const products = await fetchProducts(true);
  const categories = new Set(products.map(p => p.category));
  return Array.from(categories).sort();
}

export async function fetchNewArrivals(limit: number = 12): Promise<ProductRecord[]> {
  const products = await fetchProducts();
  return products.slice(0, limit);
}

export async function searchProducts(term: string): Promise<ProductRecord[]> {
  const products = await fetchProducts();
  const queryTerm = term.trim().toLowerCase();
  if (!queryTerm) return products;

  return products.filter((product) =>
    [product.name, product.category, product.description, product.slug]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(queryTerm))
  );
}

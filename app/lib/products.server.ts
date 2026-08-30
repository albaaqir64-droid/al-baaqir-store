import "server-only";

import { getAdminStorage, getAdminApp } from "./firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { ProductSavePayload, ProductRecord } from "./productTypes";
import { sanitizeText } from "./utils";

function createSlug(value: string) {
  return String(value).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 200);
}

function withoutUndefined<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export async function createProduct(payload: ProductSavePayload) {
  try {
    const firestore = getFirestore(getAdminApp());
    const docRef = firestore.collection("products").doc();
    const productId = docRef.id;

    const galleryImages = Array.isArray(payload.galleryImages) ? payload.galleryImages : Array.isArray(payload.images) ? payload.images : [];

    const discount = Number(payload.discount ?? payload.discountPercent ?? 0) || 0;

    const data = withoutUndefined({
      id: productId,
      name: sanitizeText(String(payload.name ?? "")),
      category: String(payload.category ?? "").trim(),
      gender: String(payload.gender ?? "").trim(),
      price: Number(payload.price) || 0,
      stock: Number(payload.stock) || 0,
      active: payload.active !== false,
      slug: createSlug(payload.name),
      createdAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
      mainImage: String(payload.mainImage ?? "").trim(),
      galleryImages: galleryImages.map(img => String(img ?? "").trim()),
      images: galleryImages.map(img => String(img ?? "").trim()),
      description: payload.description ? sanitizeText(payload.description) : undefined,
      discount,
      discountPercent: discount,
      featured: payload.featured === true,
      hsnSac: optionalText(payload.hsnSac),
      gstRate: optionalFiniteNumber(payload.gstRate),
      dimensions: payload.dimensions ? {
        length: optionalFiniteNumber(payload.dimensions.length),
        breadth: optionalFiniteNumber(payload.dimensions.breadth),
        height: optionalFiniteNumber(payload.dimensions.height),
      } : undefined,
      weight: optionalFiniteNumber(payload.weight),
      sizes: Array.isArray(payload.sizes) ? payload.sizes.map(s => String(s)) : [],
      colors: Array.isArray(payload.colors) ? payload.colors.map(c => String(c)) : [],
    });

    await docRef.set(data);

    return {
      success: true,
      id: productId,
      name: data.name,
      slug: data.slug,
      mainImage: data.mainImage,
      images: data.images
    };
  } catch (error) {
    console.error("Error in createProduct:", error);
    throw error;
  }
}

export async function updateProduct(id: string, payload: Partial<ProductSavePayload>) {
  const firestore = getFirestore(getAdminApp());
  const docRef = firestore.collection("products").doc(id);

  const galleryImages = Array.isArray(payload.galleryImages) ? payload.galleryImages : Array.isArray(payload.images) ? payload.images : undefined;

  const updatePayload: Record<string, unknown> = withoutUndefined({
    name: payload.name !== undefined ? sanitizeText(String(payload.name)) : undefined,
    category: payload.category !== undefined ? String(payload.category).trim() : undefined,
    price: payload.price !== undefined ? Number(payload.price) || 0 : undefined,
    stock: payload.stock !== undefined ? Number(payload.stock) || 0 : undefined,
    active: payload.active,
    description: payload.description !== undefined ? sanitizeText(String(payload.description)) : undefined,
    gender: payload.gender !== undefined ? String(payload.gender).trim() : undefined,
    hsnSac: payload.hsnSac !== undefined ? optionalText(payload.hsnSac) ?? null : undefined,
    gstRate: payload.gstRate !== undefined ? optionalFiniteNumber(payload.gstRate) ?? null : undefined,
    sizes: Array.isArray(payload.sizes) ? payload.sizes.map(s => String(s)) : undefined,
    colors: Array.isArray(payload.colors) ? payload.colors.map(c => String(c)) : undefined,
    dimensions: payload.dimensions ? {
      length: payload.dimensions.length !== undefined ? (payload.dimensions.length === null ? null : optionalFiniteNumber(payload.dimensions.length)) : undefined,
      breadth: payload.dimensions.breadth !== undefined ? (payload.dimensions.breadth === null ? null : optionalFiniteNumber(payload.dimensions.breadth)) : undefined,
      height: payload.dimensions.height !== undefined ? (payload.dimensions.height === null ? null : optionalFiniteNumber(payload.dimensions.height)) : undefined,
    } : undefined,
    weight: payload.weight !== undefined ? (payload.weight === null ? null : optionalFiniteNumber(payload.weight)) : undefined,
    lastUpdated: FieldValue.serverTimestamp()
  });

  if (payload.mainImage !== undefined) {
    updatePayload.mainImage = String(payload.mainImage ?? "").trim();
  }

  if (galleryImages !== undefined) {
    const images = galleryImages.map(img => String(img ?? "").trim());
    updatePayload.galleryImages = images;
    updatePayload.images = images;
  }

  const discount = payload.discount ?? payload.discountPercent;
  if (discount !== undefined) updatePayload.discount = updatePayload.discountPercent = Number(discount) || 0;

  if (payload.featured !== undefined) updatePayload.featured = payload.featured;
  if (payload.name) updatePayload.slug = createSlug(payload.name);

  await docRef.update(updatePayload);
}

export async function deleteProductById(id: string) {
  const firestore = getFirestore(getAdminApp());
  await firestore.collection("products").doc(id).delete();
}

function normalizeProductImageUrl(value: unknown): string {
  const imageUrl = String(value ?? "").trim();
  if (!imageUrl.startsWith("gs://")) return imageUrl;

  const [, bucketAndPath = ""] = imageUrl.split("gs://");
  const slashIndex = bucketAndPath.indexOf("/");
  if (slashIndex < 1) return imageUrl;

  const bucket = bucketAndPath.slice(0, slashIndex);
  const objectPath = bucketAndPath
    .slice(slashIndex + 1)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `https://storage.googleapis.com/${bucket}/${objectPath}`;
}

function normalizeTimestamp(value: unknown): number | null {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return null;
}

function normalizeProductFromAdmin(id: string, data: any): ProductRecord {
  const galleryImages = Array.isArray(data.galleryImages)
    ? data.galleryImages.map(normalizeProductImageUrl)
    : Array.isArray(data.images)
      ? data.images.map(normalizeProductImageUrl)
      : [];
  const discountValue = Number(data.discount ?? data.discountPercent ?? 0) || 0;

  return {
    id,
    name: String(data.name ?? ""),
    category: String(data.category ?? ""),
    gender: String(data.gender ?? ""),
    price: Number(data.price ?? 0),
    stock: Number(data.stock ?? 0),
    discountPercent: discountValue,
    discount: discountValue,
    active: data.active !== false,
    featured: data.featured === true,
    description: String(data.description ?? ""),
    mainImage: normalizeProductImageUrl(data.mainImage ?? data.coverImage ?? data.image),
    images: galleryImages,
    galleryImages,
    slug: String(data.slug ?? createSlug(String(data.name ?? ""))),
    createdAt: normalizeTimestamp(data.createdAt),
    lastUpdated: normalizeTimestamp(data.lastUpdated),
    sizes: Array.isArray(data.sizes) ? data.sizes.map((item: any) => String(item ?? "")) : undefined,
    colors: Array.isArray(data.colors) ? data.colors.map((item: any) => String(item ?? "")) : undefined,
    rating: data.rating != null ? Number(data.rating) : undefined,
    hsnSac: String(data.hsnSac ?? data.hsn ?? data.sac ?? "") || undefined,
    gstRate: data.gstRate != null || data.taxRate != null ? Number(data.gstRate ?? data.taxRate) || 0 : undefined,
    dimensions: data.dimensions ? {
      length: Number(data.dimensions.length || 0) || 0,
      breadth: Number(data.dimensions.breadth || 0) || 0,
      height: Number(data.dimensions.height || 0) || 0,
    } : undefined,
    weight: data.weight != null ? Number(data.weight) : undefined,
  };
}

export async function fetchProductsForApi(options?: {
  category?: string;
  gender?: string;
  search?: string;
  discount?: boolean;
  activeOnly?: boolean;
  sort?: string;
}): Promise<ProductRecord[]> {
  const firestore = getFirestore(getAdminApp());
  const snapshot = await firestore.collection("products").get();
  let products = snapshot.docs.map((docSnap) => normalizeProductFromAdmin(docSnap.id, docSnap.data() as Record<string, unknown>));

  if (options?.activeOnly) {
    products = products.filter((product) => product.active);
  }

  if (options?.category) {
    products = products.filter((product) => product.category === options.category);
  }

  if (options?.gender) {
    products = products.filter((product) => product.gender === options.gender);
  }

  if (options?.discount) {
    products = products.filter((product) => product.discountPercent > 0);
  }

  if (options?.search) {
    const searchTerm = options.search.toLowerCase();
    products = products.filter((product) =>
      [product.name, product.category, product.description, product.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }

  const sort = options?.sort || "newest";
  if (sort === "price_asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    products.sort((a, b) => b.price - a.price);
  } else {
    products.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));
  }

  return products;
}

export async function fetchActiveCategories(): Promise<string[]> {
  const firestore = getFirestore(getAdminApp());
  const snapshot = await firestore.collection("products").where("active", "==", true).get();
  const categories = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.category) {
      categories.add(String(data.category).trim());
    }
  });
  return Array.from(categories).sort();
}

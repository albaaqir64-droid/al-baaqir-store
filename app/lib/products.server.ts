import "server-only";

import { db } from "./firebase";
import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getAdminStorage, getAdminApp } from "./firebaseAdmin";
import type { ProductSavePayload, ProductRecord } from "./productTypes";

function createSlug(value: string) {
  return String(value).trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 200);
}

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:[^;]+;base64,/.test(value);
}

function parseDataUrl(value: string) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(value);
  if (!match) throw new Error("Invalid data URL");
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}

function getExtensionFromMimeType(mimeType: string) {
  const extensions: Record<string, string> = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp", "image/svg+xml": ".svg" };
  return extensions[mimeType.toLowerCase()] ?? "";
}

async function uploadProductImage(productId: string, imageValue: string, index: number, type: "mainImage" | "galleryImages") {
  if (!isDataUrl(imageValue)) return imageValue;
  const { mimeType, buffer } = parseDataUrl(imageValue);
  const destinationPath = type === "mainImage" ? `products/${productId}/main${getExtensionFromMimeType(mimeType)}` : `products/${productId}/gallery-${index}${getExtensionFromMimeType(mimeType)}`;
  const bucket = getAdminStorage().bucket();
  const file = bucket.file(destinationPath);
  await file.save(buffer, { metadata: { contentType: mimeType } });
  try {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
  } catch {
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires: Date.now() + 365 * 24 * 60 * 60 * 1000 });
    return signedUrl;
  }
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
  const docRef = doc(collection(db, "products"));
  const productId = docRef.id;
  const galleryImages = Array.isArray(payload.galleryImages) ? payload.galleryImages : Array.isArray(payload.images) ? payload.images : [];
  const mainImage = payload.mainImage ? await uploadProductImage(productId, String(payload.mainImage), 0, "mainImage") : "";
  const images = await Promise.all(galleryImages.map((image, index) => uploadProductImage(productId, String(image), index, "galleryImages")));
  const discount = Number(payload.discount ?? payload.discountPercent ?? 0) || 0;
  const data = withoutUndefined({ id: productId, name: String(payload.name ?? "").trim(), category: String(payload.category ?? "").trim(), price: Number(payload.price) || 0, stock: Number(payload.stock) || 0, active: payload.active !== false, slug: createSlug(payload.name), createdAt: serverTimestamp(), lastUpdated: serverTimestamp(), mainImage, galleryImages: images, images, description: optionalText(payload.description), discount, discountPercent: discount, featured: payload.featured === true, hsnSac: optionalText(payload.hsnSac), gstRate: optionalFiniteNumber(payload.gstRate) });
  await setDoc(docRef, data);
  return { id: productId, ...payload, slug: data.slug, mainImage, galleryImages: images, images, discount, discountPercent: discount };
}

export async function updateProduct(id: string, payload: Partial<ProductSavePayload>) {
  const galleryImages = Array.isArray(payload.galleryImages) ? payload.galleryImages : Array.isArray(payload.images) ? payload.images : undefined;
  const updatePayload: Record<string, unknown> = withoutUndefined({ name: payload.name !== undefined ? String(payload.name).trim() : undefined, category: payload.category !== undefined ? String(payload.category).trim() : undefined, price: payload.price !== undefined ? Number(payload.price) || 0 : undefined, stock: payload.stock !== undefined ? Number(payload.stock) || 0 : undefined, active: payload.active, description: payload.description !== undefined ? optionalText(payload.description) ?? null : undefined, hsnSac: payload.hsnSac !== undefined ? optionalText(payload.hsnSac) ?? null : undefined, gstRate: payload.gstRate !== undefined ? optionalFiniteNumber(payload.gstRate) ?? null : undefined, lastUpdated: serverTimestamp() });
  if (payload.mainImage !== undefined) updatePayload.mainImage = isDataUrl(payload.mainImage) ? await uploadProductImage(id, payload.mainImage, 0, "mainImage") : payload.mainImage;
  if (galleryImages !== undefined) {
    const images = await Promise.all(galleryImages.map((image, index) => uploadProductImage(id, String(image), index, "galleryImages")));
    updatePayload.galleryImages = images;
    updatePayload.images = images;
  }
  const discount = payload.discount ?? payload.discountPercent;
  if (discount !== undefined) updatePayload.discount = updatePayload.discountPercent = Number(discount) || 0;
  if (payload.featured !== undefined) updatePayload.featured = payload.featured;
  if (payload.name) updatePayload.slug = createSlug(payload.name);
  await updateDoc(doc(db, "products", id), updatePayload);
}

export async function deleteProductById(id: string) {
  await deleteDoc(doc(db, "products", id));
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

function normalizeProductFromAdmin(id: string, data: Record<string, unknown>): ProductRecord {
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
    sizes: Array.isArray(data.sizes) ? data.sizes.map((item) => String(item ?? "")) : undefined,
    colors: Array.isArray(data.colors) ? data.colors.map((item) => String(item ?? "")) : undefined,
    rating: data.rating != null ? Number(data.rating) : undefined,
    hsnSac: String(data.hsnSac ?? data.hsn ?? data.sac ?? "") || undefined,
    gstRate: data.gstRate != null || data.taxRate != null ? Number(data.gstRate ?? data.taxRate) || 0 : undefined,
  };
}

export async function fetchProductsForApi(options?: {
  category?: string;
  search?: string;
  discount?: boolean;
  activeOnly?: boolean;
  sort?: string;
}): Promise<ProductRecord[]> {
  const { getFirestore } = await import("firebase-admin/firestore");
  const snapshot = await getFirestore(getAdminApp()).collection("products").get();
  let products = snapshot.docs.map((docSnap) => normalizeProductFromAdmin(docSnap.id, docSnap.data() as Record<string, unknown>));

  if (options?.activeOnly) {
    products = products.filter((product) => product.active);
  }

  if (options?.category) {
    products = products.filter((product) => product.category === options.category);
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


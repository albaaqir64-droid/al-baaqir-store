import { db } from "./firebase";
import { getAdminStorage } from "./firebaseAdmin";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  DocumentData,
} from "firebase/firestore";
import type { ProductRecord, ProductSavePayload } from "./productTypes";

function createSlug(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 200);
}

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:[^;]+;base64,/.test(value);
}

function parseDataUrl(value: string) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(value);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function getExtensionFromMimeType(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/gif") return ".gif";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "image/svg+xml") return ".svg";
  return "";
}

async function uploadImageDataUrl(destinationPath: string, data: Buffer, mimeType: string) {
  const bucket = getAdminStorage().bucket();
  const file = bucket.file(destinationPath);
  await file.save(data, {
    metadata: {
      contentType: mimeType,
    },
  });

  try {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
  } catch {
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });
    return signedUrl;
  }
}

async function uploadProductImage(productId: string, imageValue: string, index: number, type: "mainImage" | "galleryImages") {
  if (!isDataUrl(imageValue)) return imageValue;
  const { mimeType, buffer } = parseDataUrl(imageValue);
  const extension = getExtensionFromMimeType(mimeType) || "";
  const filename =
    type === "mainImage"
      ? `products/${productId}/main${extension}`
      : `products/${productId}/gallery-${index}${extension}`;
  return await uploadImageDataUrl(filename, buffer, mimeType);
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
    ? data.galleryImages.map((item: any) => String(item ?? ""))
    : Array.isArray(data.images)
      ? data.images.map((item: any) => String(item ?? ""))
      : [];
  const discountValue = Number(data.discount ?? data.discountPercent ?? 0) || 0;

  return {
    id: docSnap.id,
    name: String(data.name ?? ""),
    category: String(data.category ?? ""),
    price: Number(data.price ?? 0),
    stock: Number(data.stock ?? 0),
    discountPercent: discountValue,
    discount: discountValue,
    active: data.active !== false,
    description: String(data.description ?? ""),
    mainImage: String(data.mainImage ?? ""),
    images: galleryImages,
    galleryImages,
    slug: String(data.slug ?? createSlug(String(data.name ?? ""))),
    createdAt: normalizeTimestamp(createdAtValue),
    lastUpdated: normalizeTimestamp(lastUpdatedValue),
    sizes: Array.isArray(data.sizes) ? data.sizes.map((item: any) => String(item ?? "")) : undefined,
    colors: Array.isArray(data.colors) ? data.colors.map((item: any) => String(item ?? "")) : undefined,
    rating: data.rating != null ? Number(data.rating) : undefined,
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

export async function fetchSaleProducts(limit: number = 12): Promise<ProductRecord[]> {
  const productsRef = collection(db, "products");
  const saleQuery = query(productsRef, where("discountPercent", ">", 0), where("active", "==", true));
  const snapshot = await getDocs(saleQuery);
  return snapshot.docs.map(normalizeProduct).sort(sortByCreatedAtDesc).slice(0, limit);
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

export async function createProduct(payload: ProductSavePayload) {
  const docRef = doc(collection(db, "products"));
  const productId = docRef.id;
  const galleryImages = Array.isArray(payload.galleryImages)
    ? payload.galleryImages
    : Array.isArray(payload.images)
      ? payload.images
      : [];
  const uploadedMainImage = payload.mainImage
    ? await uploadProductImage(productId, String(payload.mainImage), 0, "mainImage")
    : "";
  const uploadedGalleryImages = await Promise.all(
    galleryImages.map((image, index) => uploadProductImage(productId, String(image), index, "galleryImages"))
  );
  const discountValue = Number(payload.discount ?? payload.discountPercent ?? 0) || 0;
  const data = {
    ...payload,
    id: productId,
    slug: createSlug(payload.name),
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    mainImage: uploadedMainImage,
    galleryImages: uploadedGalleryImages,
    images: uploadedGalleryImages,
    discount: discountValue,
    discountPercent: discountValue,
  };
  await setDoc(docRef, data);
  return {
    id: productId,
    ...payload,
    slug: data.slug,
    mainImage: uploadedMainImage,
    galleryImages: uploadedGalleryImages,
    images: uploadedGalleryImages,
    discount: discountValue,
    discountPercent: discountValue,
  };
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductSavePayload>
) {
  const productRef = doc(db, "products", id);
  const galleryImages = Array.isArray(payload.galleryImages)
    ? payload.galleryImages
    : Array.isArray(payload.images)
      ? payload.images
      : undefined;
  const discountValue = payload.discount ?? payload.discountPercent;

  const updatePayload: Record<string, unknown> = {
    ...payload,
    lastUpdated: serverTimestamp(),
  };

  if (payload.mainImage !== undefined) {
    if (typeof payload.mainImage === "string" && isDataUrl(payload.mainImage)) {
      updatePayload.mainImage = await uploadProductImage(id, payload.mainImage, 0, "mainImage");
    } else {
      updatePayload.mainImage = payload.mainImage;
    }
  }

  if (galleryImages !== undefined) {
    const uploadedGalleryImages = await Promise.all(
      galleryImages.map((image, index) => uploadProductImage(id, String(image), index, "galleryImages"))
    );
    updatePayload.galleryImages = uploadedGalleryImages;
    updatePayload.images = uploadedGalleryImages;
  }

  if (discountValue !== undefined) {
    const discountNumber = Number(discountValue) || 0;
    updatePayload.discount = discountNumber;
    updatePayload.discountPercent = discountNumber;
  }

  if (payload.name) {
    updatePayload.slug = createSlug(payload.name);
  }
  await updateDoc(productRef, updatePayload);
}

export async function deleteProductById(id: string) {
  const productRef = doc(db, "products", id);
  await deleteDoc(productRef);
}

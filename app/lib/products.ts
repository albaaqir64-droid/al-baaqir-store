import { db } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  DocumentData,
} from "firebase/firestore";

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  discountPercent: number;
  active: boolean;
  description: string;
  mainImage: string;
  images: string[];
  slug: string;
  createdAt: any;
  lastUpdated: any;
  sizes?: string[];
  colors?: string[];
  rating?: number;
}

function createSlug(value: string) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 200);
}

function normalizeProduct(docSnap: DocumentData): ProductRecord {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: String(data.name ?? ""),
    category: String(data.category ?? ""),
    price: Number(data.price ?? 0),
    stock: Number(data.stock ?? 0),
    discountPercent: Number(data.discountPercent ?? 0),
    active: data.active !== false,
    description: String(data.description ?? ""),
    mainImage: String(data.mainImage ?? ""),
    images: Array.isArray(data.images) ? data.images.map((item: any) => String(item ?? "")) : [],
    slug: String(data.slug ?? createSlug(String(data.name ?? ""))),
    createdAt: data.createdAt ?? null,
    lastUpdated: data.lastUpdated ?? null,
    sizes: Array.isArray(data.sizes) ? data.sizes.map((item: any) => String(item ?? "")) : undefined,
    colors: Array.isArray(data.colors) ? data.colors.map((item: any) => String(item ?? "")) : undefined,
    rating: data.rating != null ? Number(data.rating) : undefined,
  };
}

export async function fetchProducts(): Promise<ProductRecord[]> {
  const productsRef = collection(db, "products");
  const productsQuery = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(productsQuery);
  return snapshot.docs.map(normalizeProduct);
}

export async function fetchProductById(id: string): Promise<ProductRecord | null> {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return normalizeProduct(docSnap);
}

export async function fetchProductsByCategory(category: string): Promise<ProductRecord[]> {
  const productsRef = collection(db, "products");
  const productsQuery = query(productsRef, where("category", "==", category));
  const snapshot = await getDocs(productsQuery);
  const results = snapshot.docs.map(normalizeProduct);

  return results
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
      const bTime = b.createdAt?.toMillis?.() ?? (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
      return bTime - aTime;
    });
}

export async function createProduct(payload: Omit<ProductRecord, "id" | "slug" | "createdAt" | "lastUpdated">) {
  const data = {
    ...payload,
    slug: createSlug(payload.name),
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, "products"), data);
  return { id: docRef.id, ...payload, slug: createSlug(payload.name), createdAt: data.createdAt, lastUpdated: data.lastUpdated };
}

export async function updateProduct(id: string, payload: Partial<Omit<ProductRecord, "id" | "slug" | "createdAt" | "lastUpdated">>) {
  const productRef = doc(db, "products", id);
  const updatePayload: Record<string, unknown> = {
    ...payload,
    lastUpdated: serverTimestamp(),
  };
  if (payload.name) {
    updatePayload.slug = createSlug(payload.name);
  }
  await updateDoc(productRef, updatePayload);
}

export async function deleteProductById(id: string) {
  const productRef = doc(db, "products", id);
  await deleteDoc(productRef);
}

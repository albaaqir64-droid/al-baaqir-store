import "server-only";

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "./firebaseAdmin";
import { fetchProductsForApi } from "./products.server";
import type { ProductRecord } from "./productTypes";

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  sku?: string;
  reorderStatus: "sufficient" | "low" | "out_of_stock";
  updatedAt: number;
}

function getReorderStatus(stock: number): "sufficient" | "low" | "out_of_stock" {
  if (stock === 0) return "out_of_stock";
  if (stock < 5) return "low";
  return "sufficient";
}

function toInventoryItem(product: ProductRecord): InventoryItem {
  let stock = Number(product.stock ?? 0);

  // If variant stock exists, use the sum of variants as the "current stock" for the inventory view
  if (product.variantStock && Object.keys(product.variantStock).length > 0) {
    const variantSum = Object.values(product.variantStock).reduce((a, b) => a + (Number(b) || 0), 0);
    if (variantSum > 0) stock = variantSum;
  }

  return {
    id: product.id,
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentStock: stock,
    minStock: 5,
    maxStock: 100,
    sku: `SKU-${product.id}`,
    reorderStatus: getReorderStatus(stock),
    updatedAt: Number(product.lastUpdated ?? product.createdAt ?? Date.now()),
  };
}

export async function getAllInventoryAdmin(): Promise<InventoryItem[]> {
  const products = await fetchProductsForApi();
  return products.map(toInventoryItem);
}

export async function searchInventoryAdmin(searchQuery: string): Promise<InventoryItem[]> {
  const allInventory = await getAllInventoryAdmin();
  const lowerQuery = searchQuery.toLowerCase().trim();
  if (!lowerQuery) return allInventory;

  return allInventory.filter(
    (item) =>
      item.productName.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.sku?.toLowerCase().includes(lowerQuery) ||
      item.productId.toLowerCase().includes(lowerQuery)
  );
}

export async function getInventoryStatsAdmin() {
  const inventory = await getAllInventoryAdmin();
  const totalStock = inventory.reduce((sum, item) => sum + item.currentStock, 0);

  return {
    totalProducts: inventory.length,
    totalStock,
    lowStockItems: inventory.filter((item) => item.reorderStatus === "low").length,
    outOfStockItems: inventory.filter((item) => item.reorderStatus === "out_of_stock").length,
    averageStock: inventory.length ? Math.round(totalStock / inventory.length) : 0,
  };
}

export async function updateProductStockAdmin(
  productId: string,
  quantityChange: number,
  reason: string = "Manual update"
): Promise<boolean> {
  const db = getFirestore(getAdminApp());
  const productRef = db.collection("products").doc(productId);
  const snapshot = await productRef.get();
  if (!snapshot.exists) return false;

  const product = snapshot.data() ?? {};
  const currentStock = Math.max(0, Math.floor(Number(product.stock ?? 0)));
  const newStock = Math.max(0, currentStock + quantityChange);

  await productRef.update({
    stock: newStock,
    lastUpdated: FieldValue.serverTimestamp(),
  });

  await db.collection("stock_logs").add({
    productId,
    productName: String(product.name ?? ""),
    quantityChange,
    reason,
    newStock,
    timestamp: FieldValue.serverTimestamp(),
  });

  return true;
}

export async function batchUpdateStockAdmin(
  updates: Array<{ productId: string; quantity: number; reason: string }>
): Promise<boolean> {
  for (const update of updates) {
    const success = await updateProductStockAdmin(update.productId, update.quantity, update.reason);
    if (!success) return false;
  }
  return true;
}

export async function getStockHistoryAdmin(productId?: string, limit = 50) {
  const db = getFirestore(getAdminApp());
  const snapshot = productId
    ? await db.collection("stock_logs").where("productId", "==", productId).orderBy("timestamp", "desc").limit(limit).get()
    : await db.collection("stock_logs").orderBy("timestamp", "desc").limit(limit).get();

  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

/* eslint-disable @typescript-eslint/no-explicit-any */

import { db } from "./firebase";
import { addDoc, collection, doc, getDocs, query, where, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { fetchAllProducts, fetchProductById } from "./products";
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

export interface StockUpdate {
  quantity: number;
  type: "add" | "remove" | "adjustment";
  reason?: string;
  updatedBy?: string;
}

function toInventoryItem(product: ProductRecord): InventoryItem {
  return {
    id: product.id,
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentStock: Number(product.stock ?? 0),
    minStock: 5,
    maxStock: 100,
    sku: `SKU-${product.id}`,
    reorderStatus: getReorderStatus(Number(product.stock ?? 0)),
    updatedAt: Number(product.lastUpdated ?? product.createdAt ?? Date.now()),
  };
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  const products = await fetchAllProducts();
  return products.map(toInventoryItem);
}

export async function getProductInventory(productId: string): Promise<InventoryItem | null> {
  const product = await fetchProductById(productId);
  if (!product) return null;
  return toInventoryItem(product);
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  const allInventory = await getAllInventory();
  return allInventory.filter((item) => item.reorderStatus !== "sufficient");
}

export async function updateProductStock(
  productId: string,
  quantityChange: number,
  reason: string = "Manual update"
): Promise<boolean> {
  const product = await fetchProductById(productId);
  if (!product) return false;

  const currentStock = Number(product.stock ?? 0);
  const newStock = Math.max(0, currentStock + quantityChange);

  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      stock: newStock,
      lastUpdated: serverTimestamp(),
    });

    await logStockChange(productId, product.name, quantityChange, reason, newStock);
    return true;
  } catch (error) {
    console.error("Error updating stock:", error);
    return false;
  }
}

export async function batchUpdateStock(
  updates: Array<{ productId: string; quantity: number; reason: string }>
): Promise<boolean> {
  try {
    for (const update of updates) {
      await updateProductStock(update.productId, update.quantity, update.reason);
    }
    return true;
  } catch (error) {
    console.error("Error batch updating stock:", error);
    return false;
  }
}

async function logStockChange(
  productId: string,
  productName: string,
  quantityChange: number,
  reason: string,
  newStock: number
): Promise<void> {
  try {
    await addDoc(collection(db, "stock_logs"), {
      productId,
      productName,
      quantityChange,
      reason,
      newStock,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging stock change:", error);
  }
}

export async function getStockHistory(productId?: string, limit: number = 50): Promise<any[]> {
  try {
    const stockLogsQuery = productId
      ? query(collection(db, "stock_logs"), where("productId", "==", productId), orderBy("timestamp", "desc"))
      : query(collection(db, "stock_logs"), orderBy("timestamp", "desc"));

    const snapshot = await getDocs(stockLogsQuery);
    return snapshot.docs.slice(0, limit).map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return [];
  }
}

export async function getInventoryStats(): Promise<{
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStock: number;
}> {
  const inventory = await getAllInventory();
  const totalStock = inventory.reduce((sum, item) => sum + item.currentStock, 0);

  return {
    totalProducts: inventory.length,
    totalStock,
    lowStockItems: inventory.filter((item) => item.reorderStatus === "low").length,
    outOfStockItems: inventory.filter((item) => item.reorderStatus === "out_of_stock").length,
    averageStock: inventory.length ? Math.round(totalStock / inventory.length) : 0,
  };
}

function getReorderStatus(stock: number): "sufficient" | "low" | "out_of_stock" {
  if (stock === 0) return "out_of_stock";
  if (stock < 5) return "low";
  return "sufficient";
}

export async function searchInventory(searchQuery: string): Promise<InventoryItem[]> {
  const allInventory = await getAllInventory();
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

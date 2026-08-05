import { db } from "./firebase";
import { collection, doc, getDoc, getDocs, query, where, updateDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { ProductData } from "../data/products";
import * as fs from "fs/promises";
import * as path from "path";

const PRODUCTS_FILE = path.join(process.cwd(), "app", "data", "products.json");
const INVENTORY_COLLECTION = "inventory";

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  sku?: string;
  lastRestocked?: any;
  reorderStatus: "sufficient" | "low" | "out_of_stock";
  updatedAt: any;
}

export interface StockUpdate {
  quantity: number;
  type: "add" | "remove" | "adjustment";
  reason?: string;
  updatedBy?: string;
}

// Get all inventory from local JSON
export async function getAllInventory(): Promise<InventoryItem[]> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const products: ProductData[] = JSON.parse(data);

    return products.map((product) => ({
      id: product.id,
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentStock: product.stock || 0,
      minStock: 5,
      maxStock: 100,
      sku: `SKU-${product.id}`,
      reorderStatus: getReorderStatus(product.stock || 0),
      updatedAt: new Date(),
    }));
  } catch (error) {
    console.error("Error reading inventory:", error);
    return [];
  }
}

// Get single product inventory
export async function getProductInventory(productId: string): Promise<InventoryItem | null> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const products: ProductData[] = JSON.parse(data);
    const product = products.find((p) => p.id === productId);

    if (!product) return null;

    return {
      id: product.id,
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentStock: product.stock || 0,
      minStock: 5,
      maxStock: 100,
      sku: `SKU-${product.id}`,
      reorderStatus: getReorderStatus(product.stock || 0),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error reading inventory:", error);
    return null;
  }
}

// Get low stock items
export async function getLowStockItems(): Promise<InventoryItem[]> {
  const allInventory = await getAllInventory();
  return allInventory.filter((item) => item.reorderStatus !== "sufficient");
}

// Update product stock
export async function updateProductStock(
  productId: string,
  quantityChange: number,
  reason: string = "Manual update"
): Promise<boolean> {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const products: ProductData[] = JSON.parse(data);

    const productIndex = products.findIndex((p) => p.id === productId);
    if (productIndex === -1) return false;

    const currentStock = products[productIndex].stock || 0;
    const newStock = Math.max(0, currentStock + quantityChange);

    products[productIndex].stock = newStock;

    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));

    // Log to Firestore for audit trail
    await logStockChange(productId, products[productIndex].name, quantityChange, reason);

    return true;
  } catch (error) {
    console.error("Error updating stock:", error);
    return false;
  }
}

// Batch update stock
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

// Log stock changes to Firestore for audit trail
async function logStockChange(
  productId: string,
  productName: string,
  quantityChange: number,
  reason: string
): Promise<void> {
  try {
    await addDoc(collection(db, "stock_logs"), {
      productId,
      productName,
      quantityChange,
      reason,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging stock change:", error);
  }
}

// Get stock history
export async function getStockHistory(productId?: string, limit: number = 50): Promise<any[]> {
  try {
    let q;
    if (productId) {
      q = query(
        collection(db, "stock_logs"),
        where("productId", "==", productId)
      );
    } else {
      q = query(collection(db, "stock_logs"));
    }

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return logs.slice(0, limit);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return [];
  }
}

// Get inventory statistics
export async function getInventoryStats(): Promise<{
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStock: number;
}> {
  const inventory = await getAllInventory();

  return {
    totalProducts: inventory.length,
    totalStock: inventory.reduce((sum, item) => sum + item.currentStock, 0),
    lowStockItems: inventory.filter((item) => item.reorderStatus === "low").length,
    outOfStockItems: inventory.filter((item) => item.reorderStatus === "out_of_stock").length,
    averageStock: Math.round(
      inventory.reduce((sum, item) => sum + item.currentStock, 0) / inventory.length
    ),
  };
}

// Helper function to determine reorder status
function getReorderStatus(stock: number): "sufficient" | "low" | "out_of_stock" {
  if (stock === 0) return "out_of_stock";
  if (stock < 5) return "low";
  return "sufficient";
}

// Search inventory
export async function searchInventory(query: string): Promise<InventoryItem[]> {
  const allInventory = await getAllInventory();
  const lowerQuery = query.toLowerCase();

  return allInventory.filter(
    (item) =>
      item.productName.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.sku?.toLowerCase().includes(lowerQuery) ||
      item.productId.toLowerCase().includes(lowerQuery)
  );
}

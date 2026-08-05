import { NextRequest, NextResponse } from "next/server";
import {
  updateProductStock,
  batchUpdateStock,
  getStockHistory,
  searchInventory,
  getInventoryStats,
} from "@/app/lib/inventory";

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (action === "update_stock") {
      const { productId, quantity, reason } = data;
      const success = await updateProductStock(productId, quantity, reason);
      return NextResponse.json({ success, message: "Stock updated" });
    }

    if (action === "batch_update") {
      const { updates } = data;
      const success = await batchUpdateStock(updates);
      return NextResponse.json({ success, message: "Batch update completed" });
    }

    if (action === "get_history") {
      const { productId, limit } = data;
      const history = await getStockHistory(productId, limit || 50);
      return NextResponse.json({ success: true, history });
    }

    if (action === "search") {
      const { query } = data;
      const results = await searchInventory(query);
      return NextResponse.json({ success: true, results });
    }

    if (action === "stats") {
      const stats = await getInventoryStats();
      return NextResponse.json({ success: true, stats });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

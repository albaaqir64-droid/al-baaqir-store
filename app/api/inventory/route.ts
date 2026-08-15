import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import {
  batchUpdateStockAdmin,
  getInventoryStatsAdmin,
  getStockHistoryAdmin,
  searchInventoryAdmin,
  updateProductStockAdmin,
} from "@/app/lib/inventory.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = await readRequestJson(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as { action?: string; data?: Record<string, unknown> };
    const action = String(body.action ?? "").trim();
    const data = body.data && typeof body.data === "object" ? body.data : {};

    if (action === "update_stock") {
      const productId = String(data.productId ?? "").trim();
      const quantity = Number(data.quantity);
      const reason = String(data.reason ?? "Manual update");
      if (!productId || !Number.isFinite(quantity)) {
        return apiError("productId and quantity are required", 400);
      }
      const success = await updateProductStockAdmin(productId, quantity, reason);
      return apiJson({ success, message: success ? "Stock updated" : "Failed to update stock" });
    }

    if (action === "batch_update") {
      const updates = Array.isArray(data.updates) ? data.updates : [];
      const success = await batchUpdateStockAdmin(
        updates.map((item) => {
          const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
          return {
            productId: String(value.productId ?? ""),
            quantity: Number(value.quantity),
            reason: String(value.reason ?? "Batch update"),
          };
        })
      );
      return apiJson({ success, message: success ? "Batch update completed" : "Batch update failed" });
    }

    if (action === "get_history") {
      const productId = data.productId ? String(data.productId) : undefined;
      const limit = Number(data.limit) || 50;
      const history = await getStockHistoryAdmin(productId, limit);
      return apiJson({ success: true, history });
    }

    if (action === "search") {
      const query = String(data.query ?? "");
      const results = await searchInventoryAdmin(query);
      return apiJson({ success: true, results });
    }

    if (action === "stats") {
      const stats = await getInventoryStatsAdmin();
      return apiJson({ success: true, stats });
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    console.error("Inventory API error:", error);
    return apiError(error instanceof Error ? error.message : String(error), 500);
  }
}

import { apiJson } from "@/app/lib/api/jsonRoute";
import { fetchActiveCategories } from "@/app/lib/products.server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await fetchActiveCategories();
    return apiJson(categories);
  } catch (error) {
    console.error("Error in GET /api/categories:", error);
    return apiJson({ error: "Failed to fetch categories" }, 500);
  }
}

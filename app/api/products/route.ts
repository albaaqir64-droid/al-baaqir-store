/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiError, apiJson, readRequestJson } from "@/app/lib/api/jsonRoute";
import { createProduct, deleteProductById, fetchProductsForApi, updateProduct } from "@/app/lib/products.server";

export const runtime = "nodejs";

function formatError(error: unknown) {
  if (error instanceof Error) {
    return { error: error.message, details: error.stack };
  }
  return { error: String(error) };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category")?.trim() || undefined;
    const search = url.searchParams.get("search")?.trim() || undefined;
    const discount = url.searchParams.get("discount") === "true";
    const sort = url.searchParams.get("sort")?.trim() || "newest";

    const products = await fetchProductsForApi({
      category,
      search,
      discount,
      activeOnly: false,
      sort,
    });

    return apiJson(products);
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return apiJson(formatError(error), 500);
  }
}

export async function POST(req: Request) {
  try {
    const parsed = await readRequestJson(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data as any;

    if (!body?.name || !body?.price) {
      return apiError("Product name and price are required", 400);
    }

    const payload = {
      name: String(body.name).trim(),
      category: String(body.category ?? "").trim() || "Uncategorized",
      price: Number(body.price) || 0,
      stock: Number(body.stock) || 0,
      mainImage: String(body.mainImage ?? "").trim(),
      images: Array.isArray(body.images) ? body.images.map((item: any) => String(item ?? "").trim()) : [],
      galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.map((item: any) => String(item ?? "").trim()) : undefined,
      description: String(body.description ?? "").trim(),
      discountPercent: Number(body.discountPercent) || 0,
      active: body.active !== false,
      featured: body.featured === true,
      hsnSac: String(body.hsnSac ?? body.hsn ?? body.sac ?? "").trim() || undefined,
      gstRate: body.gstRate !== undefined && body.gstRate !== "" ? Number(body.gstRate) : undefined,
      sizes: Array.isArray(body.sizes) ? body.sizes : undefined,
      colors: Array.isArray(body.colors) ? body.colors : undefined,
    };

    const createdProduct = await createProduct(payload);
    return apiJson(createdProduct);
  } catch (error) {
    console.error("Unexpected error in POST /api/products:", error);
    return apiJson(formatError(error), 500);
  }
}

export async function PUT(req: Request) {
  try {
    const parsed = await readRequestJson(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data as any;

    if (!body?.id) {
      return apiJson({ success: false, error: "Product id is required" }, 400);
    }

    const payload = {
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      category: body.category !== undefined ? String(body.category).trim() : undefined,
      price: body.price !== undefined ? Number(body.price) || 0 : undefined,
      stock: body.stock !== undefined ? Number(body.stock) || 0 : undefined,
      mainImage: body.mainImage !== undefined ? String(body.mainImage ?? "").trim() : undefined,
      images: Array.isArray(body.images) ? body.images.map((item: any) => String(item ?? "").trim()) : undefined,
      galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.map((item: any) => String(item ?? "").trim()) : undefined,
      description: body.description !== undefined ? String(body.description ?? "").trim() : undefined,
      discountPercent: body.discountPercent !== undefined ? Number(body.discountPercent) || 0 : undefined,
      discount: body.discount !== undefined ? Number(body.discount) || 0 : undefined,
      active: body.active !== undefined ? body.active !== false : undefined,
      featured: body.featured !== undefined ? body.featured === true : undefined,
      hsnSac: body.hsnSac !== undefined ? String(body.hsnSac ?? "").trim() : undefined,
      gstRate: body.gstRate !== undefined && body.gstRate !== "" ? Number(body.gstRate) : undefined,
    };

    await updateProduct(String(body.id), payload as any);
    return apiJson({ success: true });
  } catch (error) {
    console.error("Unexpected error in PUT /api/products:", error);
    return apiJson(formatError(error), 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return apiError("missing id", 400);
    }

    await deleteProductById(id);
    return apiJson({ success: true });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/products:", error);
    return apiJson(formatError(error), 500);
  }
}

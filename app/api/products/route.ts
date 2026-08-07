import { NextResponse } from 'next/server';
import { createProduct, deleteProductById, fetchProducts, updateProduct } from '@/app/lib/products';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category")?.trim() || undefined;
  const search = url.searchParams.get("search")?.trim() || undefined;
  const discount = url.searchParams.get("discount") === "true";
  const sort = url.searchParams.get("sort")?.trim() || "newest";

  let products = await fetchProducts();

  if (category) {
    products = products.filter((product) => product.category === category);
  }

  if (discount) {
    products = products.filter((product) => product.discountPercent > 0);
  }

  if (search) {
    const searchTerm = search.toLowerCase();
    products = products.filter((product) =>
      [product.name, product.category, product.description, product.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }

  if (sort === "price_asc") {
    products = products.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    products = products.sort((a, b) => b.price - a.price);
  } else {
    products = products.sort((a, b) => a.createdAt - b.createdAt);
  }

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.name || !body?.price) {
    return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 });
  }

  const payload = {
    name: String(body.name).trim(),
    category: String(body.category ?? '').trim() || 'Uncategorized',
    price: Number(body.price) || 0,
    stock: Number(body.stock) || 0,
    mainImage: String(body.mainImage ?? '').trim(),
    images: Array.isArray(body.images) ? body.images.map((item: any) => String(item ?? '').trim()) : [],
    galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.map((item: any) => String(item ?? '').trim()) : undefined,
    description: String(body.description ?? '').trim(),
    discountPercent: Number(body.discountPercent) || 0,
    active: body.active !== false,
  };

  try {
    const createdProduct = await createProduct(payload);
    return NextResponse.json(createdProduct);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase error while saving product.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body?.id) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  }

  const payload = {
    name: body.name !== undefined ? String(body.name).trim() : undefined,
    category: body.category !== undefined ? String(body.category).trim() : undefined,
    price: body.price !== undefined ? Number(body.price) || 0 : undefined,
    stock: body.stock !== undefined ? Number(body.stock) || 0 : undefined,
    mainImage: body.mainImage !== undefined ? String(body.mainImage ?? '').trim() : undefined,
    images: Array.isArray(body.images) ? body.images.map((item: any) => String(item ?? '').trim()) : undefined,
    galleryImages: Array.isArray(body.galleryImages) ? body.galleryImages.map((item: any) => String(item ?? '').trim()) : undefined,
    description: body.description !== undefined ? String(body.description ?? '').trim() : undefined,
    discountPercent: body.discountPercent !== undefined ? Number(body.discountPercent) || 0 : undefined,
    discount: body.discount !== undefined ? Number(body.discount) || 0 : undefined,
    active: body.active !== undefined ? body.active !== false : undefined,
  };

  try {
    await updateProduct(String(body.id), payload as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase error while updating product.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'missing id' }, { status: 400 });
  }

  try {
    await deleteProductById(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase error while deleting product.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

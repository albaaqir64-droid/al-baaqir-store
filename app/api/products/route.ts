import { NextResponse } from 'next/server';
import { createProduct, deleteProductById, fetchProducts, updateProduct } from '@/app/lib/products';

export async function GET() {
  const products = await fetchProducts();
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
    description: String(body.description ?? '').trim(),
    discountPercent: Number(body.discountPercent) || 0,
    active: body.active !== false,
  };

  const createdProduct = await createProduct(payload);
  return NextResponse.json(createdProduct);
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
    description: body.description !== undefined ? String(body.description ?? '').trim() : undefined,
    discountPercent: body.discountPercent !== undefined ? Number(body.discountPercent) || 0 : undefined,
    active: body.active !== undefined ? body.active !== false : undefined,
  };
  await updateProduct(String(body.id), payload as any);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'missing id' }, { status: 400 });
  }

  await deleteProductById(id);
  return NextResponse.json({ success: true });
}

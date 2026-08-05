import { NextResponse } from 'next/server';
import { readProducts, writeProducts } from '../../data/products';
import crypto from 'crypto';

export async function GET() {
  const products = await readProducts();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const products = await readProducts();
  // ensure unique id
  if (!body.id) {
    body.id = crypto.randomUUID();
  }
  if (!body.slug && body.name) {
    body.slug = String(body.name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  products.unshift(body);
  await writeProducts(products);
  return NextResponse.json(body);
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === body.id);
  if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 });
  products[idx] = { ...products[idx], ...body };
  await writeProducts(products);
  return NextResponse.json(products[idx]);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  const products = await readProducts();
  const filtered = products.filter((p) => p.id !== id);
  await writeProducts(filtered);
  return NextResponse.json({ success: true });
}

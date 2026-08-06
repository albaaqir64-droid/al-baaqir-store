import fs from 'fs/promises';
import path from 'path';

export type ProductData = {
  id: string;
  slug?: string;
  name: string;
  category: string; // Men, Women, Belts, Bags, New Arrivals, Sale, Kurti, Karachi Suit, Earrings, Jhumka
  price: number; // original price in INR
  images: string[];
  mainImage?: string;
  description: string;
  rating?: number;
  discountPercent?: number;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  active?: boolean;
};

const DATA_FILE = path.join(process.cwd(), 'app', 'data', 'products.json');
const LOCAL_PRODUCT_PLACEHOLDER = '/images/products/placeholder.svg';

function sanitizeProductImages<T extends { mainImage?: string; images?: unknown[] }>(product: T): T {
  const next = { ...product } as typeof product;
  if (next.mainImage && String(next.mainImage).startsWith('https://images.unsplash.com')) {
    next.mainImage = LOCAL_PRODUCT_PLACEHOLDER;
  }
  if (Array.isArray(next.images)) {
    next.images = next.images.map((image) =>
      String(image).startsWith('https://images.unsplash.com') ? LOCAL_PRODUCT_PLACEHOLDER : String(image)
    );
  }
  return next;
}

const CATEGORY_FALLBACKS: Record<string, ProductData[]> = {
  Kurti: [
    {
      id: 'k1',
      name: 'Sadaf Kurti',
      category: 'Kurti',
      price: 9800,
      images: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop'],
      description: 'A graceful everyday kurti with breathable tailoring and soft movement.',
      rating: 4.7,
      stock: 6,
      active: true,
    },
  ],
  'Karachi Suit': [
    {
      id: 'ks1',
      name: 'Sehar Karachi Suit',
      category: 'Karachi Suit',
      price: 14500,
      images: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop'],
      description: 'Classic Karachi suit styling with refined cuts and elegant comfort.',
      rating: 4.8,
      stock: 4,
      active: true,
    },
  ],
  Earrings: [
    {
      id: 'e1',
      name: 'Nazia Drop Earrings',
      category: 'Earrings',
      price: 3600,
      images: ['https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?q=80&w=1200&auto=format&fit=crop'],
      description: 'Statement earrings designed to bring a polished finish to every look.',
      rating: 4.5,
      stock: 8,
      active: true,
    },
  ],
  Jhumka: [
    {
      id: 'j1',
      name: 'Saira Jhumka',
      category: 'Jhumka',
      price: 4200,
      images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab534?q=80&w=1200&auto=format&fit=crop'],
      description: 'Traditional jhumka styling with a luxurious shimmer for festive wear.',
      rating: 4.6,
      stock: 7,
      active: true,
    },
  ],
};

const DEFAULT_PRODUCTS: ProductData[] = [
  { id: "1", name: "Ariella Belt", category: "Belts", price: 8200, images: ["https://images.unsplash.com/photo-1519741490176-cc12f1a6a0d8?q=80&w=1200&auto=format&fit=crop"], description: "Polished buckle with soft calfskin leather.", rating: 4.6, discountPercent: 0, sizes: ["S","M","L"], stock: 12, colors: ["Espresso"], active: true },
  { id: "2", name: "Marconi Tote", category: "Bags", price: 32500, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Structured silhouette for everyday luxury.", rating: 4.7, sizes: ["One Size"], stock: 5, colors: ["Tan"], active: true },
  { id: "3", name: "Dorian Strap", category: "Belts", price: 7950, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Textured belt made to elevate any look.", rating: 4.4, discountPercent: 5, sizes: ["S","M","L"], stock: 8, colors: ["Black"], active: true },
  { id: "4", name: "Nara Crossbody", category: "Bags", price: 28400, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Compact yet roomy for daily essentials.", rating: 4.5, sizes: ["One Size"], stock: 7, colors: ["Olive"], active: true },
  { id: "5", name: "Milan Waist Belt", category: "Belts", price: 10200, images: ["https://images.unsplash.com/photo-1519741490176-cc12f1a6a0d8?q=80&w=1200&auto=format&fit=crop"], description: "Timeless piece with a refined finish.", rating: 4.8, sizes: ["M","L"], stock: 10, colors: ["Black"], active: true },
  { id: "6", name: "Verde Shoulder Bag", category: "Bags", price: 35900, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Versatile and elegant for all occasions.", rating: 4.7, sizes: ["One Size"], stock: 4, colors: ["Green"], active: true },
  { id: "7", name: "Luna Leather Belt", category: "Belts", price: 9150, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Clean lines and premium craftsmanship.", rating: 4.5, sizes: ["S","M","L"], stock: 9, colors: ["Tan"], active: true },
  { id: "8", name: "Ari Crossbody", category: "Bags", price: 27600, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Sleek hardware and soft leather construction.", rating: 4.6, sizes: ["One Size"], stock: 6, colors: ["Black"], active: true },
  { id: "b1", name: "Ariella Belt — Espresso", category: "Belts", price: 8200, images: ["https://images.unsplash.com/photo-1519741490176-cc12f1a6a0d8?q=80&w=1200&auto=format&fit=crop"], description: "Polished buckle with soft calfskin leather.", rating: 4.6, discountPercent: 10, sizes: ["S","M","L"], stock: 5, colors: ["Espresso"], active: true },
  { id: "b2", name: "Milan Waist Belt — Black", category: "Belts", price: 10200, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Timeless piece with a refined finish.", rating: 4.8, sizes: ["M","L"], stock: 3, colors: ["Black"], active: true },
  { id: "b3", name: "Luna Leather Belt — Tan", category: "Belts", price: 9150, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Clean lines and premium craftsmanship.", rating: 4.5, discountPercent: 15, sizes: ["S","M","L"], stock: 2, colors: ["Tan"], active: true },
  { id: "b4", name: "Dorian Strap — Textured", category: "Belts", price: 7950, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Textured belt made to elevate any look.", rating: 4.4, sizes: ["S","M"], stock: 7, colors: ["Brown"], active: true },
  { id: "b5", name: "Verdi Classic", category: "Belts", price: 11300, images: ["https://images.unsplash.com/photo-1519741490176-cc12f1a6a0d8?q=80&w=1200&auto=format&fit=crop"], description: "Hand-stitched edges with signature buckle.", rating: 4.6, sizes: ["M","L"], stock: 6, colors: ["Bordeaux"], active: true },
  { id: "b6", name: "Sarto Slim", category: "Belts", price: 6800, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Minimalist belt for everyday wear.", rating: 4.3, sizes: ["S","M","L"], stock: 15, colors: ["Black"], active: true },
  { id: "bg1", name: "Marconi Tote", category: "Bags", price: 32500, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Structured silhouette for everyday luxury.", rating: 4.7, sizes: ["One Size"], stock: 4, colors: ["Tan"], active: true },
  { id: "bg2", name: "Ari Crossbody", category: "Bags", price: 27600, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Sleek hardware and soft leather construction.", rating: 4.6, discountPercent: 20, sizes: ["One Size"], stock: 2, colors: ["Black"], active: true },
  { id: "bg3", name: "Verde Shoulder Bag", category: "Bags", price: 35900, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Versatile and elegant for all occasions.", rating: 4.7, sizes: ["One Size"], stock: 3, colors: ["Green"], active: true },
  { id: "bg4", name: "Nara Crossbody", category: "Bags", price: 28400, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Compact yet roomy for daily essentials.", rating: 4.5, sizes: ["One Size"], stock: 5, colors: ["Olive"], active: true },
  { id: "bg5", name: "Sienna Satchel", category: "Bags", price: 29100, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Classic silhouette with modern details.", rating: 4.5, stock: 2, colors: ["Sienna"], active: true },
  { id: "bg6", name: "Luxe Clutch", category: "Bags", price: 12900, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Evening staple with refined hardware.", rating: 4.4, discountPercent: 25, stock: 1, colors: ["Gold"], active: true },
  { id: "m1", name: "Milan Waist Belt", category: "Men", price: 10200, images: ["https://images.unsplash.com/photo-1519741490176-cc12f1a6a0d8?q=80&w=1200&auto=format&fit=crop"], description: "Timeless piece with a refined finish.", rating: 4.8, stock: 8, active: true },
  { id: "m2", name: "Verde Shoulder Bag", category: "Men", price: 35900, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Versatile and elegant for all occasions.", rating: 4.7, discountPercent: 15, stock: 4, active: true },
  { id: "m3", name: "Ariella Belt — Espresso", category: "Men", price: 8200, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Polished buckle with soft calfskin leather.", rating: 4.6, stock: 5, active: true },
  { id: "m4", name: "Dorian Strap", category: "Men", price: 7950, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Textured belt made to elevate any look.", rating: 4.4, stock: 7, active: true },
  { id: "w1", name: "Nara Crossbody", category: "Women", price: 28400, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Compact yet roomy for daily essentials.", rating: 4.5, stock: 5, active: true },
  { id: "w2", name: "Ari Crossbody", category: "Women", price: 27600, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Sleek hardware and soft leather construction.", rating: 4.6, discountPercent: 10, stock: 3, active: true },
  { id: "w3", name: "Verde Shoulder Bag", category: "Women", price: 35900, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Versatile and elegant for all occasions.", rating: 4.7, stock: 2, active: true },
  { id: "w4", name: "Siena Tote", category: "Women", price: 31200, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Everyday tote with structured finish.", rating: 4.5, stock: 6, active: true },
  { id: "n1", name: "Ariella Belt", category: "New Arrivals", price: 8200, images: ["https://images.unsplash.com/photo-1519741490176-cc12f1a6a0d8?q=80&w=1200&auto=format&fit=crop"], description: "Polished buckle with soft calfskin leather.", rating: 4.6, stock: 8, active: true },
  { id: "n2", name: "Marconi Tote", category: "New Arrivals", price: 32500, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Structured silhouette for everyday luxury.", rating: 4.7, stock: 3, active: true },
  { id: "n3", name: "Dorian Strap", category: "New Arrivals", price: 7950, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Textured belt made to elevate any look.", rating: 4.4, discountPercent: 5, stock: 4, active: true },
  { id: "n4", name: "Nara Crossbody", category: "New Arrivals", price: 28400, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Compact yet roomy for daily essentials.", rating: 4.5, stock: 2, active: true },
  { id: "s1", name: "Ari Crossbody", category: "Sale", price: 27600, images: ["https://images.unsplash.com/photo-1520975698512-6ee7f2b9b8f6?q=80&w=1200&auto=format&fit=crop"], description: "Sleek hardware and soft leather construction.", rating: 4.6, discountPercent: 30, stock: 2, active: true },
  { id: "s2", name: "Luxe Clutch", category: "Sale", price: 12900, images: ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=1200&auto=format&fit=crop"], description: "Evening staple with refined hardware.", rating: 4.4, discountPercent: 25, stock: 1, active: true },
  { id: "s3", name: "Sarto Slim", category: "Sale", price: 6800, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"], description: "Minimalist belt for everyday wear.", rating: 4.3, discountPercent: 15, stock: 10, active: true },
];

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (e) {
    // write default
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2), 'utf-8');
  }
}

export async function readProducts(): Promise<ProductData[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const products = JSON.parse(raw) as ProductData[];
  return products.map((product) => sanitizeProductImages(product));
}

export async function writeProducts(products: ProductData[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
}

export async function findProductByIdAsync(id: string): Promise<ProductData | undefined> {
  const products = await readProducts();
  return products.find((p) => p.id === id || p.slug === id);
}

export async function getProductsByCategory(category: string): Promise<ProductData[]> {
  const products = await readProducts();
  const match = products.filter((p) => p.category.toLowerCase() === category.toLowerCase() && p.active !== false);

  if (match.length > 0) {
    return match.map((product) => sanitizeProductImages(product));
  }

  return (CATEGORY_FALLBACKS[category] ?? []).filter((p) => p.active !== false).map((product) => sanitizeProductImages(product));
}


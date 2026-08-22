/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ProductRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  discountPercent: number;
  discount: number;
  active: boolean;
  description: string;
  mainImage: string;
  images: string[];
  galleryImages: string[];
  slug: string;
  createdAt: any;
  lastUpdated: any;
  sizes?: string[];
  colors?: string[];
  variantStock?: Record<string, number>;
  featured: boolean;
  rating?: number;
  hsnSac?: string;
  gstRate?: number;
}

export type ProductSavePayload = Omit<
  ProductRecord,
  "id" | "slug" | "createdAt" | "lastUpdated" | "galleryImages" | "images" | "discount" | "discountPercent"
> & {
  galleryImages?: string[];
  images?: string[];
  discount?: number;
  discountPercent?: number;
};

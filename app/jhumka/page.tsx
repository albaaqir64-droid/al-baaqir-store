/* eslint-disable @typescript-eslint/no-explicit-any */

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { fetchProductsByCategory } from "../lib/products";

function toCard(product: any) {
  const price = Number(product.price) || 0;
  const discountPercent = Number(product.discountPercent) || 0;
  const finalPrice = discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : price;

  return {
    id: product.id,
    name: product.name,
    price: `₹${finalPrice.toLocaleString('en-IN')}`,
    originalPriceNum: price,
    discountPercent: discountPercent > 0 ? discountPercent : undefined,
    image: product.mainImage ?? product.images?.[0] ?? '',
    description: product.description,
    discount: discountPercent > 0 ? `${discountPercent}%` : undefined,
  };
}

export default async function Page() {
  const data = await fetchProductsByCategory('Jhumka');
  const products = data.map(toCard);

  return (
    <div className="min-h-screen brand-page text-brand-dark">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-green">Jhumka</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-brand-dark">Traditional jhumkas with a luxurious finish</h1>
          <p className="mt-3 text-lg text-brand-teal max-w-2xl">Discover festive-ready jewelry crafted to elevate your signature look.</p>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-brand-light bg-white/50 text-brand-teal">
            <p>No products found in this category.</p>
          </div>
        )}

        <div className="mt-20 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-teal hover:text-brand-green transition-colors"
          >
            <span>←</span> Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

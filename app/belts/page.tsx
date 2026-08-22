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
  const data = await fetchProductsByCategory('Belts');
  const products = data.map(toCard);
  return (
    <div className="min-h-screen brand-page text-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-500">Belts</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">Premium belts crafted with detail</h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl">Shop refined leather belts in a variety of finishes and buckles.</p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <label className="text-sm font-medium text-slate-500">Sort by:</label>
            <select className="rounded-full border border-emerald-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none transition-colors">
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-[32px] border border-emerald-100 bg-white/50 p-8 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-950">Filters</h3>

              <div className="mt-8 space-y-8 text-sm">
                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-900 text-[11px]">Material</p>
                  <div className="mt-4 flex flex-col gap-3 text-slate-600">
                    <label className="flex items-center gap-3 cursor-pointer hover:text-emerald-600 transition-colors">
                      <input type="checkbox" className="h-4 w-4 rounded border-emerald-200 text-emerald-500 focus:ring-emerald-500" />
                      Calfskin
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:text-emerald-600 transition-colors">
                      <input type="checkbox" className="h-4 w-4 rounded border-emerald-200 text-emerald-500 focus:ring-emerald-500" />
                      Full-grain
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:text-emerald-600 transition-colors">
                      <input type="checkbox" className="h-4 w-4 rounded border-emerald-200 text-emerald-500 focus:ring-emerald-500" />
                      Suede
                    </label>
                  </div>
                </div>

                <div>
                  <p className="font-bold uppercase tracking-wider text-slate-900 text-[11px]">Color</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="h-8 w-8 rounded-full border-2 border-white bg-black ring-1 ring-slate-200 hover:ring-emerald-500 transition-all" aria-label="Black" />
                    <button className="h-8 w-8 rounded-full border-2 border-white bg-[#8B4513] ring-1 ring-slate-200 hover:ring-emerald-500 transition-all" aria-label="Brown" />
                    <button className="h-8 w-8 rounded-full border-2 border-white bg-[#D2B48C] ring-1 ring-slate-200 hover:ring-emerald-500 transition-all" aria-label="Tan" />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {products.length > 0 ? (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-emerald-100 bg-white/50 text-slate-500">
                <p>No products found in this category.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
          >
            <span>←</span> Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

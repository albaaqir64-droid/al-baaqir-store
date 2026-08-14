/* eslint-disable @typescript-eslint/no-explicit-any */

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { fetchProductsByCategory } from "../lib/products";

function toCard(product: any) {
  return {
    id: product.id,
    name: product.name,
    price: `₹${product.price.toLocaleString('en-IN')}`,
    image: product.mainImage ?? product.images?.[0] ?? '',
    description: product.description,
    discount: product.discountPercent ? `${product.discountPercent}%` : undefined,
  };
}

export default async function Page() {
  const data = await fetchProductsByCategory('Sale');
  const products = data.map(toCard);
  return (
    <div className="min-h-screen brand-page text-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald">Sale</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sale — limited time offers</h1>
            <p className="mt-3 text-sm text-slate-600">Shop discounted belts and bags while stocks last.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Sort:</label>
            <select className="rounded-full border border-emerald-200 px-4 py-2">
              <option>Featured</option>
              <option>Discount: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-800">Discount</p>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="flex items-center gap-2"><input type="checkbox" /> 10% or more</label>
                    <label className="flex items-center gap-2"><input type="checkbox" /> 20% or more</label>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/">← Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

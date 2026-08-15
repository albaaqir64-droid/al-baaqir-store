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
        <div className="mb-8 flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald">Belts</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Premium belts crafted with detail</h1>
            <p className="mt-3 text-sm text-slate-600">Shop refined leather belts in a variety of finishes and buckles.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Sort:</label>
            <select className="rounded-full border border-emerald-200 px-4 py-2">
              <option>Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-800">Material</p>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="flex items-center gap-2"><input type="checkbox" /> Calfskin</label>
                    <label className="flex items-center gap-2"><input type="checkbox" /> Full-grain</label>
                    <label className="flex items-center gap-2"><input type="checkbox" /> Suede</label>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-slate-800">Color</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button className="h-8 w-8 rounded-full border border-emerald-200 bg-black" aria-label="Black" />
                    <button className="h-8 w-8 rounded-full border border-emerald-200 bg-amber-700" aria-label="Brown" />
                    <button className="h-8 w-8 rounded-full border border-emerald-200 bg-slate-200" aria-label="Tan" />
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
          <Link href="/" className="text-sm text-slate-600">← Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

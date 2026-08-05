"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ProductRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export default function Page() {
  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState<ProductRecord[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      const response = await fetch("/api/products");
      const products = (await response.json()) as ProductRecord[];

      if (!ignore) {
        setAllProducts(products);
      }
    }

    loadProducts();
    return () => {
      ignore = true;
    };
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allProducts.filter((product) => product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q) || product.category.toLowerCase().includes(q));
  }, [allProducts, query]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-3xl font-semibold">Search</h1>
      <p className="mt-4 text-slate-600">Find products by name, category, or description.</p>

      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search belts, bags, new arrivals..." className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10" />
      </div>

      <div className="mt-6 space-y-3">
        {query.trim() === "" ? (
          <p className="text-slate-600">Type a term to search the catalog.</p>
        ) : results.length === 0 ? (
          <p className="text-slate-600">No matching products found.</p>
        ) : (
          results.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="block rounded-2xl border border-gray-200 bg-white px-4 py-3 text-slate-900 shadow-sm hover:bg-slate-50">
              {product.name}
            </Link>
          ))
        )}
      </div>

      <p className="mt-6"><Link href="/">← Back to Home</Link></p>
    </main>
  );
}

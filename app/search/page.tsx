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
  const [results, setResults] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}`);
      const products = (await response.json()) as ProductRecord[];
      if (!ignore) {
        setResults(products);
        setLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const content = useMemo(() => {
    if (!query.trim()) {
      return <p className="text-slate-600">Type a term to search the catalog.</p>;
    }

    if (loading) {
      return <p className="text-slate-600">Searching products…</p>;
    }

    if (results.length === 0) {
      return <p className="text-slate-600">No matching products found.</p>;
    }

    return results.map((product) => (
      <Link key={product.id} href={`/product/${product.id}`} className="block rounded-2xl border border-gray-200 bg-white px-4 py-3 text-slate-900 shadow-sm hover:bg-slate-50">
        {product.name}
      </Link>
    ));
  }, [loading, query, results]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-3xl font-semibold">Search</h1>
      <p className="mt-4 text-slate-600">Find products by name, category, or description.</p>

      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search belts, bags, new arrivals..."
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-emerald/70 focus:ring-2 focus:ring-emerald/10"
        />
      </div>

      <div className="mt-6 space-y-3">{content}</div>

      <p className="mt-6"><Link href="/">← Back to Home</Link></p>
    </main>
  );
}

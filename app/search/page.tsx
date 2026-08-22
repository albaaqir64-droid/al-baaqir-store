"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readApiJson } from "../lib/api/client";

type ProductRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
};

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    setLoading(true);
    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query.trim())}`);
      const parsed = await readApiJson<ProductRecord[]>(response);
      if (!ignore) {
        setResults(parsed.ok && Array.isArray(parsed.data) ? parsed.data : []);
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
      <Link key={product.id} href={`/product/${product.id}`} className="block rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 shadow-sm hover:bg-slate-50">
        {product.name}
      </Link>
    ));
  }, [loading, query, results]);

  return (
    <div className="min-h-screen brand-page selection:bg-emerald-400 selection:text-slate-900">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-500">Discover</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">Search</h1>
          <p className="mt-3 text-lg text-slate-600">Find exactly what you&apos;re looking for in our curated catalog.</p>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories, essentials..."
            className="w-full rounded-[32px] border border-emerald-100 bg-white px-8 py-6 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 shadow-sm"
            autoFocus
          />
          {loading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
        </div>

        <div className="mt-12 space-y-4">
          {!query.trim() ? (
            <div className="rounded-[32px] bg-white/50 p-12 text-center border border-emerald-50 backdrop-blur-sm">
              <p className="text-slate-500 font-medium tracking-wide">Start typing to explore Al Baaqir.</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="rounded-[32px] bg-white/50 p-12 text-center border border-emerald-50 backdrop-blur-sm">
              <p className="text-slate-500 font-medium tracking-wide">No results found for &ldquo;{query}&rdquo;.</p>
            </div>
          ) : (
            results.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group flex items-center justify-between rounded-[24px] border border-emerald-100 bg-white p-6 transition-all hover:shadow-xl hover:shadow-orange-500/10 hover:border-emerald-500"
              >
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-emerald-500">
                    {product.category}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 transition-all group-hover:bg-orange-500 group-hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

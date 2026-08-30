"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readApiJson } from "../lib/api/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { sanitizeText } from "../lib/utils";

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

  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="mb-12">
          <div className="eyebrow">Search</div>
          <h1 className="text-[34px] md:text-[42px] serif font-medium mt-2">Find your story</h1>
          <p className="mt-4 text-[#777]">Explore our curated catalog of Indian luxury essentials.</p>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories..."
            className="w-full border border-[#ccc] bg-white px-6 py-6 text-xl focus:outline-none focus:border-[#111] transition-all placeholder:text-[#aaa]"
            autoFocus
          />
          {loading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
            </div>
          )}
        </div>

        <div className="mt-12 space-y-4">
          {!query.trim() ? (
            <div className="border border-[#e8e2d9] bg-white p-20 text-center">
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#aaa]">Start typing to explore</p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="border border-[#e8e2d9] bg-white p-20 text-center">
              <p className="text-[12px] font-bold uppercase tracking-widest text-[#aaa]">No results found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            results.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group flex items-center justify-between border border-[#e8e2d9] bg-white p-8 transition-all hover:border-[#111] hover:shadow-lg"
              >
                <div>
                  <h3 className="text-[22px] serif font-medium text-[#151515] group-hover:text-brand-gold transition-colors">
                    {sanitizeText(product.name)}
                  </h3>
                  <p className="mt-1 eyebrow text-[9px]">
                    {product.category}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center border border-[#111] text-[#111] transition-all group-hover:bg-[#111] group-hover:text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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

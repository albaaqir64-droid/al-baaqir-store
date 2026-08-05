"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWishlistItems, loadWishlistItems, removeWishlistItem } from "../lib/wishlist";

export default function Page() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof loadWishlistItems>>>([]);

  useEffect(() => {
    async function loadItems() {
      const loaded = await loadWishlistItems();
      setItems(loaded);
    }

    const update = () => setItems(getWishlistItems());
    loadItems();
    window.addEventListener("albaaqir-wishlist-updated", update);
    return () => window.removeEventListener("albaaqir-wishlist-updated", update);
  }, []);

  function removeItem(id: string) {
    setItems(removeWishlistItem(id));
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-3xl font-semibold">Wishlist</h1>
      <p className="mt-4 text-slate-600">Saved products you want to revisit later.</p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-8 text-slate-600 shadow-sm">
          Your wishlist is empty.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
                <div>
                  <Link href={item.productUrl} className="text-lg font-semibold text-slate-950 hover:underline">{item.name}</Link>
                  <p className="mt-1 text-sm text-slate-600">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.price)}</p>
                </div>
              </div>
              <button type="button" onClick={() => removeItem(item.id)} className="rounded-full border border-rose-500 px-4 py-2 text-sm font-semibold text-rose-600">Remove</button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6"><Link href="/">← Back to Home</Link></p>
    </main>
  );
}

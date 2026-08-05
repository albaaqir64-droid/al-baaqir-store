"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "../lib/cart";
import { isWishlisted, toggleWishlistItem } from "../lib/wishlist";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  description?: string;
  discount?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [wish, setWish] = useState(false);

  useEffect(() => {
    setWish(isWishlisted(product.id));
  }, [product.id]);

  function goToProduct() {
    router.push(`/product/${product.id}`);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={(e) => {
        const tgt = e.target as HTMLElement;
        if (tgt.closest('button') || tgt.tagName === 'A' || tgt.closest('a')) return;
        goToProduct();
      }}
      onKeyDown={(e) => {
        // Enter or Space navigates
        if (e.key === 'Enter' || e.key === ' ') goToProduct();
      }}
      className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
    >
      <div className="relative h-64 overflow-hidden bg-gray-100 sm:h-72">
        <img src={product.image} alt={product.name} className="absolute inset-0 h-full w-full img-cover transition duration-500 group-hover:scale-105" />
        {product.discount && (
          <div className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-white">{product.discount}</div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              <span className="underline-offset-2 hover:underline">{product.name}</span>
            </h3>
            {product.description && <p className="mt-2 text-sm text-slate-600">{product.description}</p>}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextWishlist = toggleWishlistItem({
                id: product.id,
                name: product.name,
                price: Number.parseFloat(product.price.replace(/[^\d.]/g, "")) || 0,
                image: product.image,
                productUrl: `/product/${product.id}`,
              });
              setWish(nextWishlist.some((item) => item.id === product.id));
            }}
            aria-pressed={wish}
            className="rounded-full border border-gray-200 bg-white p-2 text-slate-700 hover:bg-gray-50"
            title="Add to wishlist"
          >
            {wish ? '♥' : '♡'}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-lg font-semibold text-slate-950">{product.price}</span>
          <div className="flex items-center gap-3">
            <Link
              href={`/product/${product.id}`}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
              View
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addCartItem(
                  {
                    id: product.id,
                    name: product.name,
                    price: Number.parseFloat(product.price.replace(/[^\d.]/g, "")) || 0,
                    image: product.image,
                    productUrl: `/product/${product.id}`,
                  },
                  1
                );
                router.push('/cart');
              }}
              className="rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "../lib/cart";
import { isWishlisted, toggleWishlistItem } from "../lib/wishlist";
import { formatCurrency, sanitizeText } from "../lib/utils";

type Product = {
  id: string;
  name: string;
  price: string;
  originalPriceNum?: number;
  discountPercent?: number;
  image: string;
  description?: string;
  discount?: string;
  hsnSac?: string;
  gstRate?: number;
};

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [wish, setWish] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        if (e.key === 'Enter' || e.key === ' ') goToProduct();
      }}
      className="group relative overflow-hidden rounded-[32px] bg-white transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]"
    >
      {/* Image Container - Fixed 1:1 Aspect Ratio */}
      <div className="relative aspect-square overflow-hidden bg-[#F5F5F7]">
        <Image
          src={product.image || '/images/products/placeholder.svg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          onError={(event) => {
            const target = event.target as HTMLImageElement;
            target.src = '/images/products/placeholder.svg';
          }}
          loading="lazy"
        />

        {/* Brand Discount Pill */}
        {product.discount && (
          <div className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-900 uppercase shadow-sm">
            {product.discount} OFF
          </div>
        )}

        {/* Wishlist Button Overlay */}
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
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white ${
            wish ? 'text-rose-500' : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={wish ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
        </button>
      </div>

      <div className="p-6">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {product.hsnSac || 'Collection'}
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 leading-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
              {sanitizeText(product.description)}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              {product.price}
            </span>
            {product.originalPriceNum && product.discountPercent && (
              <span className="text-xs font-medium text-slate-400 line-through">
                {formatCurrency(product.originalPriceNum)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const priceNum = Number.parseFloat(product.price.replace(/[^\d.]/g, "")) || 0;
              addCartItem({
                id: product.id,
                name: product.name,
                price: priceNum,
                originalPrice: product.originalPriceNum,
                discountPercent: product.discountPercent,
                image: product.image,
                productUrl: `/product/${product.id}`,
                hsnSac: product.hsnSac,
                gstRate: product.gstRate,
              }, 1);
              router.push('/cart');
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-900 transition-all duration-300 hover:bg-orange-500 hover:text-white hover:scale-110 active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </article>
  );
}

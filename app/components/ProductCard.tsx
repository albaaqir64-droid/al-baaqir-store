"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "../lib/cart";
import { isWishlisted, toggleWishlistItem } from "../lib/wishlist";
import { formatCurrency, sanitizeText } from "../lib/utils";

import { useAuth } from "../hooks/useAuth";

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
  const { user } = useAuth();
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
      className="luxury-card group relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[1/1.05] overflow-hidden bg-[#eee] flex items-center justify-center">
         <Image
          src={product.image || '/images/products/placeholder.svg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(event) => {
            const target = event.target as HTMLImageElement;
            target.src = '/images/products/placeholder.svg';
          }}
          loading="lazy"
        />

        {/* Status Badge */}
        <div className="absolute left-[10px] top-[10px] bg-[#111] text-white px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider">
          {product.discount ? `${product.discount} OFF` : 'NEW'}
        </div>

        {/* Wishlist Button */}
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
          className={`absolute right-[10px] top-[10px] flex h-8 w-8 items-center justify-center border transition-colors ${
            wish ? 'text-rose-500 bg-white border-white' : 'text-[#111] bg-white/90 border-transparent hover:text-brand-gold'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wish ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
        </button>
      </div>

      <div className="p-[15px]">
        <small className="text-[#888] uppercase text-[10px] tracking-widest font-bold">
          {product.hsnSac || 'Collection'}
        </small>
        <h3 className="serif text-[19px] font-medium my-2 text-[#111]">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-[#111]">
            {product.price}
          </span>
          {product.originalPriceNum && product.discountPercent && (
            <span className="text-[#aaa] line-through text-sm font-normal">
              {formatCurrency(product.originalPriceNum)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!user || user.isAnonymous) {
              const currentPath = window.location.pathname + window.location.search;
              router.push(`/account/login?callback=${encodeURIComponent(currentPath)}`);
              return;
            }
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
          className="w-full mt-3 py-[11px] bg-[#111] text-white text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#333]"
        >
          ADD TO BAG
        </button>
      </div>
    </article>
  );
}

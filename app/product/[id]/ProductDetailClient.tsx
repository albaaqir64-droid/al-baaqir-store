"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "../../lib/cart";
import { fetchPincodeLocation, PincodeLocation } from "../../lib/pincode";
import { toggleWishlistItem, isWishlisted } from "../../lib/wishlist";
import type { ProductRecord } from "../../lib/productTypes";
import { formatCurrency, sanitizeText } from "../../lib/utils";
import { Toast } from "../../components/Toast";

export default function ProductDetailClient({ product }: { product: ProductRecord }) {
  const router = useRouter();

  // 1. All Base Data and State
  const allImages = Array.from(new Set([product.mainImage ?? product.images?.[0], ...(product.images ?? [])].filter(Boolean)));
  const discountedPrice = product.discountPercent ? Math.round(product.price * (1 - product.discountPercent / 100)) : product.price;

  const [mainIndex, setMainIndex] = useState(0);
  const [size, setSize] = useState<string | null>(product.sizes?.[0] ?? null);
  const [color, setColor] = useState<string | null>(product.colors?.[0] ?? null);
  const [qty, setQty] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [pincodeOk, setPincodeOk] = useState<boolean | null>(null);
  const [pincodeLocation, setPincodeLocation] = useState<PincodeLocation | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("success");
  const [wishlisted, setWishlisted] = useState(isWishlisted(product.id));

  // 2. Lightbox State and Handlers
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % allImages.length);
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, allImages.length]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLightboxOpen]);

  // 3. Helper Functions
  function seededReviewsCount(id: string | undefined) {
    if (!id) return 20;
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (Math.abs(h) % 200) + 20;
  }


  async function checkPincode() {
    setPincodeLoading(true);
    setPincodeError(null);
    setPincodeOk(null);
    setPincodeLocation(null);

    try {
      const location = await fetchPincodeLocation(pincode);
      setPincodeLocation(location);
      setPincodeOk(true);
      setPincodeError(null);
    } catch (error) {
      setPincodeOk(false);
      setPincodeLocation(null);
      setPincodeError(error instanceof Error ? error.message : "Unable to check pincode.");
    } finally {
      setPincodeLoading(false);
    }
  }

  const getVariantStock = () => {
    if (!product.variantStock) return product.stock;

    let key = "";
    if (size && color) key = `${size}_${color}`;
    else if (size) key = `size_${size}`;
    else if (color) key = `color_${color}`;

    if (key && product.variantStock[key] !== undefined) {
      return product.variantStock[key];
    }
    return product.stock;
  };

  const currentStock = getVariantStock();

  return (
    <div className="grid gap-16 lg:grid-cols-2">
      {/* Left Side: Images */}
      <div className="space-y-6">
        <div
          className="relative aspect-square overflow-hidden rounded-[40px] bg-emerald-50 cursor-zoom-in group border border-emerald-100"
          onClick={() => openLightbox(mainIndex)}
        >
          <img
            src={allImages[mainIndex] || '/images/products/placeholder.svg'}
            alt={product.name}
            loading="eager"
            decoding="sync"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(event) => { (event.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
          />
          {product.discountPercent && (
            <div className="absolute left-8 top-8 rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-bold tracking-widest text-slate-900 uppercase shadow-sm">
              {product.discountPercent}% OFF
            </div>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((img, i) => (
            <button
              key={String(i)}
              onClick={() => { setMainIndex(i); }}
              className={`relative aspect-square w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-emerald-50 border transition-all ${
                i === mainIndex ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2' : 'border-emerald-100 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img || '/images/products/placeholder.svg'}
                alt={`${product.name} ${i + 1}`}
                className="h-full w-full object-cover"
                onError={(event) => { (event.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Right Side: Product Details */}
      <div className="flex flex-col">
        <div className="mb-8">
          <p className="text-[13px] font-bold uppercase tracking-[0.3em] text-emerald-600 mb-4">
            {product.category}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-tight">
            {sanitizeText(product.name)}
          </h1>

          <div className="mt-6 flex items-baseline gap-4">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {formatCurrency(discountedPrice)}
            </span>
            {product.discountPercent && (
              <span className="text-lg font-medium text-slate-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-emerald-700">MRP inclusive of all taxes</p>
        </div>

        {/* Selection Options */}
        <div className="space-y-8">
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[13px] font-bold uppercase tracking-widest text-slate-900">Select Size</h4>
                <button className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors">Size Guide</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded-2xl border py-4 text-sm font-bold transition-all ${
                      size === s
                        ? 'border-emerald-500 bg-emerald-500 text-slate-900 shadow-sm'
                        : 'border-emerald-100 text-slate-600 hover:border-emerald-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-widest text-slate-900 mb-4">Select Color</h4>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${
                      color === c ? "border-emerald-500 ring-2 ring-emerald-500/20 ring-offset-2" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4 pt-4">
            <button
              onClick={() => {
                addCartItem({
                  id: product.id,
                  name: product.name,
                  price: discountedPrice,
                  originalPrice: product.price,
                  discountPercent: product.discountPercent,
                  image: product.mainImage ?? product.images?.[0] ?? '',
                  productUrl: `/product/${product.id}`,
                  hsnSac: product.hsnSac,
                  gstRate: product.gstRate,
                  stock: currentStock,
                  selectedSize: size ?? undefined,
                  selectedColor: color ?? undefined,
                }, qty);
                router.push('/cart');
              }}
              disabled={currentStock < 1}
              className="w-full rounded-full bg-emerald-500 py-5 text-[15px] font-bold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              {currentStock < 1 ? 'Out of Stock' : 'Add to Bag'}
            </button>

            <button
              onClick={() => {
                const nextWishlist = toggleWishlistItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.mainImage ?? product.images?.[0] ?? '',
                  productUrl: `/product/${product.id}`,
                });
                const nowWishlisted = nextWishlist.some((item) => item.id === product.id);
                setWishlisted(nowWishlisted);
              }}
              className="w-full rounded-full border border-emerald-200 py-5 text-[15px] font-bold text-slate-900 transition-all hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98]"
            >
              {wishlisted ? '♥ In Wishlist' : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>

        {/* Delivery Check */}
        <div className="mt-12 rounded-[32px] bg-emerald-50 p-8 border border-emerald-100">
          <h4 className="text-[13px] font-bold uppercase tracking-widest text-slate-900 mb-6">Delivery Details</h4>
          <div className="flex gap-2">
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter Pincode"
              className="flex-1 rounded-2xl border border-emerald-100 bg-white px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
            <button
              onClick={() => void checkPincode()}
              disabled={pincodeLoading}
              className="rounded-2xl bg-emerald-500 px-8 py-4 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-emerald-600 hover:text-white disabled:opacity-50"
            >
              Check
            </button>
          </div>
          {pincodeOk !== null && (
            <div className={`mt-4 text-sm font-medium ${pincodeOk ? 'text-emerald-600' : 'text-rose-600'}`}>
              {pincodeOk ? `Fast delivery available to ${pincodeLocation?.city}` : pincodeError}
            </div>
          )}
        </div>

        {/* Description & Details */}
        <div className="mt-12 space-y-8 border-t border-slate-100 pt-12">
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-widest text-slate-900 mb-4">Product Description</h4>
            <p className="text-[15px] leading-relaxed text-slate-500 whitespace-pre-wrap">
              {sanitizeText(product.description || '')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-widest text-slate-900 mb-2">Ref. Number</h4>
              <p className="text-sm text-slate-500">{product.hsnSac || 'AB-2026-001'}</p>
            </div>
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-widest text-slate-900 mb-2">Material</h4>
              <p className="text-sm text-slate-500">Premium Handcrafted Leather</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Image Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-8 right-8 z-50 rounded-full bg-white/10 p-4 text-white hover:bg-white/20 transition-all backdrop-blur-md"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-8 z-50 rounded-full bg-white/10 p-4 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                onClick={showPrev}
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-8 z-50 rounded-full bg-white/10 p-4 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                onClick={showNext}
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative h-full w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Preload adjacent images */}
            <div className="hidden">
              {allImages.map((img, idx) => (
                <img key={idx} src={img} alt="preload" />
              ))}
            </div>
            <img
              src={allImages[lightboxIndex]}
              alt={`${product.name} - image ${lightboxIndex + 1}`}
              className="max-h-full max-w-full object-contain shadow-2xl select-none"
              loading="eager"
              decoding="async"
            />

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white/70 text-sm py-4">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

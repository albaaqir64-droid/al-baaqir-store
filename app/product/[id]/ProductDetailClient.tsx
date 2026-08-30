"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "../../lib/cart";
import { fetchPincodeLocation, PincodeLocation } from "../../lib/pincode";
import { toggleWishlistItem, isWishlisted } from "../../lib/wishlist";
import type { ProductRecord } from "../../lib/productTypes";
import { formatCurrency, sanitizeText } from "../../lib/utils";
import { Toast } from "../../components/Toast";

import { useAuth } from "../../hooks/useAuth";

export default function ProductDetailClient({ product }: { product: ProductRecord }) {
  const router = useRouter();
  const { user } = useAuth();

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
    <div className="grid gap-12 lg:grid-cols-2 max-w-[1200px] mx-auto px-5">
      {/* Left Side: Images */}
      <div className="space-y-4">
        <div
          className="relative aspect-square overflow-hidden bg-[#eee] cursor-zoom-in group border border-[#e8e2d9]"
          onClick={() => openLightbox(mainIndex)}
        >
          <img
            src={allImages[mainIndex] || '/images/products/placeholder.svg'}
            alt={product.name}
            loading="eager"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => { (event.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
          />
          {product.discountPercent && (
            <div className="absolute left-[10px] top-[10px] bg-[#111] text-white px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider">
              {product.discountPercent}% OFF
            </div>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((img, i) => (
            <button
              key={String(i)}
              onClick={() => { setMainIndex(i); }}
              className={`relative aspect-square w-20 flex-shrink-0 bg-[#eee] border transition-all ${
                i === mainIndex ? 'border-[#111]' : 'border-transparent opacity-60 hover:opacity-100'
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
        <div className="mb-6">
          <div className="eyebrow mb-2">{product.category}</div>
          <h1 className="text-[34px] md:text-[42px] serif font-medium leading-[1.1] text-[#151515]">
            {sanitizeText(product.name)}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-[24px] font-bold text-[#151515]">
              {formatCurrency(discountedPrice)}
            </span>
            {product.discountPercent && (
              <span className="text-[18px] text-[#aaa] line-through font-normal">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] font-bold text-[#888] uppercase tracking-widest">MRP inclusive of all taxes</p>
        </div>

        {/* Selection Options */}
        <div className="space-y-6">
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#151515] mb-3">Select Size</h4>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[50px] px-4 py-3 text-[12px] font-bold border transition-all ${
                      size === s
                        ? 'border-[#111] bg-[#111] text-white'
                        : 'border-[#ccc] text-[#151515] hover:border-[#111]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t border-[#e8e2d9]">
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
                  dimensions: product.dimensions,
                  weight: product.weight,
                }, qty);
                router.push('/cart');
              }}
              disabled={currentStock < 1}
              className="w-full bg-[#111] text-white py-4 text-[12px] font-bold uppercase tracking-widest transition-colors hover:bg-[#333] disabled:opacity-50"
            >
              {currentStock < 1 ? 'Out of Stock' : 'ADD TO BAG'}
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
              className="w-full border border-[#111] text-[#111] py-4 text-[12px] font-bold uppercase tracking-widest hover:bg-[#faf8f4] transition-colors"
            >
              {wishlisted ? '♥ In Wishlist' : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>

        {/* Delivery Check */}
        <div className="mt-8 p-6 border border-[#e8e2d9] bg-white">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#151515] mb-4">Delivery Details</h4>
          <div className="flex gap-2">
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter Pincode"
              className="flex-1 border border-[#ccc] px-4 py-3 text-sm focus:outline-none focus:border-[#111]"
            />
            <button
              onClick={() => void checkPincode()}
              disabled={pincodeLoading}
              className="bg-[#111] text-white px-6 py-3 text-[12px] font-bold uppercase tracking-widest hover:bg-[#333]"
            >
              Check
            </button>
          </div>
          {pincodeOk !== null && (
            <div className={`mt-3 text-[12px] font-bold uppercase tracking-widest ${pincodeOk ? 'text-brand-green' : 'text-rose-600'}`}>
              {pincodeOk ? `Fast delivery available to ${pincodeLocation?.city}` : pincodeError}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-8 space-y-6 pt-8 border-t border-[#e8e2d9]">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#151515] mb-3">Product Description</h4>
            <p className="text-[14px] leading-relaxed text-[#777] whitespace-pre-wrap">
              {sanitizeText(product.description || '')}
            </p>
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

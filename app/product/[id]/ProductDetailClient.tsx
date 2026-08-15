"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "../../lib/cart";
import { fetchPincodeLocation, PincodeLocation } from "../../lib/pincode";
import { toggleWishlistItem, isWishlisted } from "../../lib/wishlist";
import type { ProductRecord } from "../../lib/productTypes";
import { Toast } from "../../components/Toast";

export default function ProductDetailClient({ product }: { product: ProductRecord }) {
  const router = useRouter();

  // 1. All Base Data and State
  const allImages = Array.from(new Set([product.mainImage ?? product.images?.[0], ...(product.images ?? [])].filter(Boolean)));
  const discountedPrice = product.discountPercent ? Math.round(product.price * (1 - product.discountPercent / 100)) : product.price;

  const [mainIndex, setMainIndex] = useState(0);
  const [size, setSize] = useState<string | null>(product.sizes?.[0] ?? null);
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

  function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
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

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Side: Images */}
        <div>
          <div className="rounded-3xl border border-emerald-200 overflow-hidden bg-emerald-50 cursor-zoom-in" onClick={() => openLightbox(mainIndex)}>
            <img
              src={allImages[mainIndex] || '/images/products/placeholder.svg'}
              alt={product.name}
              onError={(event) => { (event.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
              className="w-full h-[420px] object-cover"
            />
          </div>

          <div className="mt-4 flex gap-3">
            {allImages.map((img, i) => (
              <button key={String(i)} onClick={() => { setMainIndex(i); openLightbox(i); }} className={`h-20 w-20 overflow-hidden rounded-xl border ${i === mainIndex ? 'border-emerald' : 'border-emerald-200'}`}>
                <img
                  src={img || '/images/products/placeholder.svg'}
                  alt={`${product.name} ${i + 1}`}
                  onError={(event) => { (event.target as HTMLImageElement).src = '/images/products/placeholder.svg'; }}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center text-amber-500">{Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill={i < Math.round(product.rating ?? 0) ? 'currentColor' : 'none'} stroke="currentColor"><path d="M12 .587l3.668 7.431L23.4 9.75l-5.7 5.566L19.335 24 12 19.897 4.665 24l1.635-8.684L.6 9.75l7.732-1.732z"/></svg>
            ))}</div>
            <div className="text-sm text-slate-600">{product.rating ?? '—'} · {seededReviewsCount(product.id)} reviews</div>
          </div>

          <div className="mt-4 flex items-end gap-4">
            <div>
              <div className="text-2xl font-semibold text-slate-950">{formatINR(discountedPrice)}</div>
              {product.discountPercent ? (
                <div className="text-sm text-slate-500"><span className="line-through mr-2">{formatINR(product.price)}</span><span className="text-gold font-semibold">{product.discountPercent}% off</span></div>
              ) : (
                <div className="text-sm text-slate-500">{formatINR(product.price)}</div>
              )}
            </div>
            <div className="ml-auto text-sm text-slate-600">Inclusive of all taxes</div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-900">Size</h4>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.sizes?.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`rounded-md border px-3 py-2 text-sm ${size === s ? 'border-emerald bg-emerald text-white' : 'border-emerald-200 text-slate-700'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-10 w-10 rounded-md border border-emerald-200">−</button>
              <div className="w-12 text-center">{qty}</div>
              <button onClick={() => setQty((q) => Math.min(Math.max(0, product.stock), q + 1))} disabled={product.stock < 1} className="h-10 w-10 rounded-md border border-emerald-200 disabled:opacity-50">+</button>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  addCartItem({
                    id: product.id,
                    name: product.name,
                    price: product.discountPercent ? Math.round(product.price * (1 - product.discountPercent / 100)) : product.price,
                    originalPrice: product.price,
                    discountPercent: product.discountPercent,
                    image: product.mainImage ?? product.images?.[0] ?? '',
                    productUrl: `/product/${product.id}`,
                    hsnSac: product.hsnSac,
                    gstRate: product.gstRate,
                    stock: product.stock
                  }, qty);
                  setToastVariant("success");
                  setToastMessage("Added to cart successfully.");
                  window.setTimeout(() => setToastMessage(null), 2200);
                }}
                disabled={product.stock < 1}
                className="rounded-full bg-emerald px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
              >
                Add to Cart
              </button>
              <button
                onClick={() => {
                  addCartItem({
                    id: product.id,
                    name: product.name,
                    price: product.discountPercent ? Math.round(product.price * (1 - product.discountPercent / 100)) : product.price,
                    originalPrice: product.price,
                    discountPercent: product.discountPercent,
                    image: product.mainImage ?? product.images?.[0] ?? '',
                    productUrl: `/product/${product.id}`,
                    hsnSac: product.hsnSac,
                    gstRate: product.gstRate,
                    stock: product.stock
                  }, qty);
                  router.push('/checkout');
                }}
                disabled={product.stock < 1}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200 disabled:opacity-50"
              >
                Buy Now
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
                  setToastVariant("success");
                  setToastMessage(nowWishlisted ? "Added to wishlist." : "Removed from wishlist.");
                  window.setTimeout(() => setToastMessage(null), 2200);
                }}
                className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
              >
                {wishlisted ? '♥' : '♡'} Wishlist
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-slate-600">Check delivery to pincode</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value);
                    setPincodeError(null);
                    setPincodeOk(null);
                    setPincodeLocation(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void checkPincode();
                    }
                  }}
                  placeholder="Enter pincode"
                  className="flex-1 rounded-md border border-emerald-200 px-3 py-2"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => void checkPincode()}
                  className="rounded-md bg-emerald px-4 py-2 text-emerald-900 transition hover:bg-emerald-600 hover:text-white"
                  disabled={pincodeLoading}
                >
                  {pincodeLoading ? "Checking…" : "Check"}
                </button>
              </div>
              {pincodeOk !== null && (
                <div className={`mt-2 rounded-lg px-3 py-2 text-sm ${pincodeOk ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                  {pincodeOk ? (
                    <>
                      Delivery available in {pincodeLocation?.city}, {pincodeLocation?.state}
                    </>
                  ) : (
                    pincodeError
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-slate-600">Cash on Delivery</p>
              <p className="mt-2 text-sm text-slate-700">Available for select pincodes. Additional charges may apply.</p>
            </div>
          </div>

          {toastMessage && <Toast message={toastMessage} variant={toastVariant} />}
          <div className="mt-6 space-y-3">
            <div>
              <h4 className="text-sm font-medium">Return Policy</h4>
              <p className="mt-1 text-sm text-slate-600">7-day returns on unused items with tags. See our full policy for exclusions.</p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Product details</h4>
              <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
                <li>Material: Premium leather</li>
                <li>Made in: India</li>
                <li>Care: Wipe clean with a dry cloth</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description Section - Now Below the Top Section */}
      <div className="mt-16 border-t border-slate-100 pt-10">
        <h3 className="text-xl font-semibold text-slate-950">Description</h3>
        <p className="mt-6 text-slate-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
      </div>

      {/* Full-Screen Image Lightbox */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition shadow-lg"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition md:left-10 shadow-lg"
                onClick={showPrev}
                aria-label="Previous image"
              >
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 z-50 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition md:right-10 shadow-lg"
                onClick={showNext}
                aria-label="Next image"
              >
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="relative h-full w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={allImages[lightboxIndex]}
              alt={`${product.name} - image ${lightboxIndex + 1}`}
              className="max-h-full max-w-full object-contain shadow-2xl select-none"
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

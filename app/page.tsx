import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import Newsletter from "./components/Newsletter";
import Link from "next/link";
import { fetchNewArrivals, fetchProducts } from "./lib/products";
import { formatCurrency } from "./lib/utils";

const categories = [
  {
    title: "Belts",
    subtitle: "Mirror-polished buckles, rich leather finishes.",
    category: "Belts",
    href: "/belts",
  },
  {
    title: "Bags",
    subtitle: "Luxury silhouettes made for every occasion.",
    category: "Bags",
    href: "/bags",
  },
  {
    title: "Kurti",
    subtitle: "Easy elegance with refined everyday tailoring.",
    category: "Kurti",
    href: "/kurti",
  },
  {
    title: "Karachi Suit",
    subtitle: "Classic silhouettes with polished festive energy.",
    category: "Karachi Suit",
    href: "/karachi-suit",
  },
  {
    title: "Earrings",
    subtitle: "Subtle shine and expressive details.",
    category: "Earrings",
    href: "/earrings",
  },
  {
    title: "Jhumka",
    subtitle: "Traditional charm with contemporary flair.",
    category: "Jhumka",
    href: "/jhumka",
  },
];

function getProductImage(product: { mainImage?: string; images?: string[]; galleryImages?: string[] }) {
  return product.mainImage || product.images?.[0] || product.galleryImages?.[0] || "";
}

export default async function Home() {
  const newArrivals = await fetchNewArrivals(4);
  const activeProducts = await fetchProducts();

  // Filter only products marked as featured in the admin panel
  const featuredProducts = activeProducts.filter(p => p.featured).slice(0, 4);

  const categoryProducts = new Map(
    categories.map((category) => {
      const products = activeProducts
        .filter((product) => product.category.trim().toLowerCase() === category.category.toLowerCase())
        .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.rating ?? 0) - (a.rating ?? 0));
      return [category.category, products[0]];
    })
  );

  const activeCategoryList = categories.filter(cat => categoryProducts.get(cat.category));

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-slate-900">
      <Header />

      <main>
        {/* Premium Luxury Hero Section */}
        <section className="relative flex w-full min-h-[500px] h-[600px] sm:h-[700px] lg:h-[800px] items-center overflow-hidden bg-[#0a0a0a]">
          {/* Background Image - Using a standard img tag with absolute positioning */}
          <img
            src="/images/hero-banner.png"
            alt="Al Baaqir Luxury Watch Banner"
            className="absolute inset-0 z-0 h-full w-full object-cover object-center"
            style={{ opacity: 1, visibility: 'visible' }}
          />

          {/* Cinematic Overlays for Text Readability */}
          {/* Subtle gradient from left to ensure text is readable without obscuring the image details */}
          <div className="absolute inset-0 z-[1] bg-black/30" />
          <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-black/40 to-transparent hidden md:block" />
          <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
            <div className="max-w-3xl text-left">
              <span className="mb-4 inline-block text-[13px] font-bold uppercase tracking-[0.4em] text-emerald-400 animate-in fade-in slide-in-from-left-4 duration-1000">
                Premium Precision. Timeless Elegance.
              </span>

              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-left-6 duration-1000 fill-mode-both">
                DEFINE YOUR <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-400">STYLE.</span>
              </h1>

              <p className="mt-8 max-w-lg text-base sm:text-lg leading-relaxed text-slate-200 animate-in fade-in slide-in-from-left-8 duration-1000 fill-mode-both">
                Crafted for those who value every second. Discover the Al Baaqir watch collection—where luxury meets precision.
              </p>

              <div className="mt-12 flex flex-wrap items-center gap-8 animate-in fade-in slide-in-from-left-10 duration-1000 fill-mode-both">
                <Link
                  href="/watches"
                  className="rounded-full bg-emerald-500 px-8 py-4 sm:px-10 sm:py-5 text-[14px] sm:text-[15px] font-bold text-slate-900 transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20"
                >
                  SHOP NOW
                </Link>

                <div className="hidden sm:flex items-center gap-4 text-slate-400 text-sm font-medium">
                  <div className="h-px w-8 bg-slate-700" />
                  Free Shipping on All Orders
                </div>
              </div>

              {/* Luxury Feature Indicators */}
              <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 opacity-70 animate-in fade-in duration-1000 delay-500">
                 <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Premium Quality
                 </div>
                 <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Accurate Timing
                 </div>
                 <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Genuine Leather
                 </div>
                 <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Water Resistant
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories - Sleek Grid */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Shop by Category</h2>
              <p className="mt-4 text-lg text-slate-500">Find exactly what you&apos;re looking for.</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {activeCategoryList.map((category) => {
                const product = categoryProducts.get(category.category);
                return (
                  <Link
                    key={category.title}
                    href={category.href}
                    className="group relative aspect-[4/5] overflow-hidden rounded-[32px] bg-emerald-50"
                  >
                    {product && getProductImage(product) && (
                      <img
                        src={getProductImage(product)}
                        alt={category.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 p-8 flex flex-col justify-end">
                      <h3 className="text-2xl font-bold text-white">{category.title}</h3>
                      <p className="mt-2 text-sm text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        {category.subtitle}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Collection - Brand Themed */}
        <section className="bg-emerald-50/50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">Selected</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Curated Essentials</h2>
              </div>
              <Link href="/featured" className="text-[15px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                View All Featured Items →
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.discountPercent
                      ? formatCurrency(Math.round(Number(product.price || 0) * (1 - Number(product.discountPercent || 0) / 100)))
                      : formatCurrency(Number(product.price || 0)),
                    originalPriceNum: product.price,
                    discountPercent: product.discountPercent,
                    image: getProductImage(product),
                    description: product.description,
                    discount: product.discountPercent ? `${product.discountPercent}%` : undefined,
                    hsnSac: product.hsnSac,
                    gstRate: product.gstRate,
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Brand Philosophy - Apple Style Typography */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-tight">
              Quality you can feel. <br />
              Craftsmanship you can trust.
            </h2>
            <p className="mt-12 text-xl leading-relaxed text-slate-500">
              At Al Baaqir, we believe that luxury is found in the details. Our commitment to premium materials and artisan finishing ensures that every piece isn&apos;t just an accessory—it&apos;s a companion for life.
            </p>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-12">
              <div>
                <div className="text-3xl font-bold text-slate-900">100%</div>
                <div className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">Genuine Leather</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">Artisan</div>
                <div className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">Handcrafted</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">Lifetime</div>
                <div className="mt-2 text-sm font-medium uppercase tracking-widest text-slate-400">Durability</div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="rounded-[40px] bg-emerald-950 p-8 sm:p-16 text-emerald-50">
            <Newsletter />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

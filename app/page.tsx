import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import Newsletter from "./components/Newsletter";
import Link from "next/link";
import Image from "next/image";
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
  const newArrivals = await fetchNewArrivals(8);
  const activeProducts = await fetchProducts();

  // Filter products marked as featured
  const featuredProducts = activeProducts.filter(p => p.featured);
  // Get all active products for the shop section
  const allShopProducts = activeProducts.slice(0, 12);

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
    <div className="min-h-screen bg-brand-off-white text-brand-dark font-sans selection:bg-brand-gold selection:text-white">
      <Header />

      <main>
        {/* Luxury Hero Section */}
        <section className="max-w-[1200px] mx-auto px-5 py-6 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-[25px] items-center">
          <div>
            <div className="eyebrow mb-4">The new Indian lifestyle</div>
            <h1 className="text-[clamp(40px,7vw,88px)] leading-[0.9] serif my-[18px]">
              Carry your<br /><i>story.</i>
            </h1>
            <p className="text-[#777] leading-[1.8] max-w-[520px] mb-8 text-[15px] md:text-base">
              Premium everyday bags and accessories with Indian character, modern utility and a clean luxury feel.
            </p>
            <Link href="/#shop" className="luxury-button inline-block uppercase text-[12px]">
              SHOP COLLECTION
            </Link>
          </div>
          <div className="h-[350px] md:h-[530px] rounded-[5px] bg-[#f0ede8] relative overflow-hidden group border border-brand-line">
            <Image
              src="/images/hero banner .png"
              alt="AL BAAQIR Luxury Collection"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500" />
            <div className="absolute bottom-[25px] w-full text-center text-white/70 text-[17px] tracking-[0.3em] font-bold serif drop-shadow-lg">AL BAAQIR</div>
          </div>
        </section>

        {/* Collection Section */}
        <section className="max-w-[1200px] mx-auto px-5 py-8 md:py-12" id="shop">
          <div className="flex justify-between items-end mb-8 md:mb-10">
            <div>
              <div className="eyebrow">Curated for you</div>
              <h2 className="text-[32px] md:text-[42px] serif mt-2 font-medium">New collection</h2>
            </div>
            <p className="text-[#777] hidden sm:block">Style × Utility × Character</p>
          </div>

          <div className="grid gap-[17px] grid-cols-2 lg:grid-cols-4">
            {allShopProducts.map((product) => (
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
        </section>

        {/* Features Section */}
        <section className="max-w-[1200px] mx-auto px-5 py-12" id="story">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
            <div className="bg-[#171717] text-white p-8">
              <b className="block text-2xl serif mb-2 font-medium">01 — Indian soul</b>
              <span className="text-[#bbb] text-[13px] leading-relaxed">Prints, textures and details inspired by India, reimagined for modern wardrobes.</span>
            </div>
            <div className="bg-[#171717] text-white p-8">
              <b className="block text-2xl serif mb-2 font-medium">02 — Built for life</b>
              <span className="text-[#bbb] text-[13px] leading-relaxed">Thoughtful compartments, strong materials and everyday functionality.</span>
            </div>
            <div className="bg-[#171717] text-white p-8">
              <b className="block text-2xl serif mb-2 font-medium">03 — Premium experience</b>
              <span className="text-[#bbb] text-[13px] leading-relaxed">Fast browsing, cart, checkout and Shiprocket tracking in one clean experience.</span>
            </div>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="max-w-[1200px] mx-auto px-5 py-12">
          <div className="bg-[#d9c5a6] p-10 md:p-[45px] flex flex-col md:flex-row justify-between items-center gap-5">
            <div>
              <h2 className="text-[34px] md:text-[42px] serif mb-2 font-medium">10% off your first order.</h2>
              <div className="text-brand-dark/70">Join the AL BAAQIR list for launches and offers.</div>
            </div>
            <button className="luxury-button uppercase text-[12px] min-w-[150px]">JOIN NOW</button>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-5 py-12">
          <div className="bg-[#111] p-8 md:p-16 text-white text-center">
            <Newsletter />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

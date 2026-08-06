import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import Newsletter from "./components/Newsletter";
import Link from "next/link";

type Product = { id: string; name: string; price: string; image: string; description: string };

const categories = [
  {
    title: "Belts",
    subtitle: "Mirror-polished buckles, rich leather finishes.",
    image: "/images/categories/belts.svg",
  },
  {
    title: "Bags",
    subtitle: "Luxury silhouettes made for every occasion.",
    image: "/images/categories/bags.svg",
  },
  {
    title: "Kurti",
    subtitle: "Easy elegance with refined everyday tailoring.",
    image: "/images/categories/kurti.svg",
  },
  {
    title: "Karachi Suit",
    subtitle: "Classic silhouettes with polished festive energy.",
    image: "/images/categories/karachi-suit.svg",
  },
  {
    title: "Earrings",
    subtitle: "Subtle shine and expressive details.",
    image: "/images/categories/earrings.svg",
  },
  {
    title: "Jhumka",
    subtitle: "Traditional charm with contemporary flair.",
    image: "/images/categories/jhumka.svg",
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh designs for the modern wardrobe.",
    image: "/images/categories/new-arrivals.svg",
  },
  {
    title: "Sale",
    subtitle: "Exclusive pieces at elegant prices.",
    image: "/images/categories/sale.svg",
  },
];

const newArrivals: Product[] = [
  { id: "1", name: "Ariella Belt", price: "₹8,200", image: "/images/products/placeholder.svg", description: "Polished buckle with soft calfskin leather." },
  { id: "2", name: "Marconi Tote", price: "₹32,500", image: "/images/products/placeholder.svg", description: "Structured silhouette for everyday luxury." },
  { id: "3", name: "Dorian Strap", price: "₹7,950", image: "/images/products/placeholder.svg", description: "Textured belt made to elevate any look." },
  { id: "4", name: "Nara Crossbody", price: "₹28,400", image: "/images/products/placeholder.svg", description: "Compact yet roomy for daily essentials." },
];

const bestSellers: Product[] = [
  { id: "5", name: "Milan Waist Belt", price: "₹10,200", image: "/images/products/placeholder.svg", description: "Timeless piece with a refined finish." },
  { id: "6", name: "Verde Shoulder Bag", price: "₹35,900", image: "/images/products/placeholder.svg", description: "Versatile and elegant for all occasions." },
  { id: "7", name: "Luna Leather Belt", price: "₹9,150", image: "/images/products/placeholder.svg", description: "Clean lines and premium craftsmanship." },
  { id: "8", name: "Ari Crossbody", price: "₹27,600", image: "/images/products/placeholder.svg", description: "Sleek hardware and soft leather construction." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <main>
        <section className="relative bg-emerald-950/5">
          <div className="mx-auto max-w-[1200px] px-6 py-12 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">New season premium drops</p>
                <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight text-slate-950">Al Baaqir</h1>
                <p className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight text-slate-950">Premium belts and bags for refined style.</p>
                <p className="max-w-xl text-base leading-8 text-slate-700">Discover leather essentials crafted with precision and rich finishes, designed to elevate every outfit with subtle luxury.</p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/belts" className="inline-flex items-center justify-center rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-200 transition hover:bg-emerald-600">Shop Belts</Link>
                  <Link href="/bags" className="inline-flex items-center justify-center rounded-full border border-emerald px-6 py-3 text-sm font-semibold text-emerald transition hover:bg-emerald-50">Shop Bags</Link>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="relative overflow-hidden rounded-[32px] border border-gray-200 bg-gray-100" style={{ minWidth: '320px', maxWidth: '500px' }}>
                  <div className="relative h-[300px] sm:h-[380px] lg:h-[420px]">
                    <img src="/images/categories/hero.svg" alt="Premium leather belt" className="absolute inset-0 h-full w-full img-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="max-w-7xl mx-auto px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald">Shop by Category</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Explore belts, bags, and premium essentials.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const href = category.title === 'Belts'
                ? '/belts'
                : category.title === 'Bags'
                  ? '/bags'
                  : category.title === 'Kurti'
                    ? '/kurti'
                    : category.title === 'Karachi Suit'
                      ? '/karachi-suit'
                      : category.title === 'Earrings'
                        ? '/earrings'
                        : category.title === 'Jhumka'
                          ? '/jhumka'
                          : category.title === 'New Arrivals'
                            ? '/new-arrivals'
                            : '/sale';
              return (
                <Link key={category.title} href={href} className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-56 overflow-hidden bg-gray-100">
                    <img src={category.image} alt={category.title} className="h-full w-full img-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-950">{category.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{category.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="new-arrivals" className="max-w-7xl mx-auto px-6 py-16 bg-emerald-50">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald">New Arrivals</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Fresh leather goods for the season.</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-600">Shop the latest belt and bag styles with premium finishes and modern silhouettes.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section id="best-sellers" className="max-w-7xl mx-auto px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald">Best Sellers</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">Customer favorites, refined for every wardrobe.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 bg-slate-950 text-white rounded-[32px] border border-white/10">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Why Choose Al Baaqir</p>
              <h2 className="text-3xl font-semibold">Exclusive leather goods built to last.</h2>
              <p className="text-sm leading-7 text-slate-300">From premium leather sourcing to careful handcraftsmanship, every piece is designed for enduring style and everyday luxury.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Handmade</p>
                <p className="mt-3 text-lg font-semibold">Artisan finish</p>
                <p className="mt-2 text-sm text-slate-300">Skilled artisans create thoughtful details across every piece.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Materials</p>
                <p className="mt-3 text-lg font-semibold">Premium leather</p>
                <p className="mt-2 text-sm text-slate-300">Only the finest leather and hardware meet our standards.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16">
          <Newsletter />
        </section>
      </main>

      <Footer />
    </div>
  );
}

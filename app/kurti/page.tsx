import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { fetchProductsByCategory } from "../lib/products";

function toCard(product: any) {
  return {
    id: product.id,
    name: product.name,
    price: `₹${product.price.toLocaleString('en-IN')}`,
    image: product.mainImage ?? product.images?.[0] ?? '',
    description: product.description,
    discount: product.discountPercent ? `${product.discountPercent}%` : undefined,
  };
}

export default async function Page() {
  const data = await fetchProductsByCategory('Kurti');
  const products = data.map(toCard);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald">Kurti</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Elegant kurtis for modern everyday style</h1>
          <p className="mt-3 text-sm text-slate-600">Discover breathable tailoring and graceful silhouettes that blend comfort with polish.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-sm text-slate-600">← Back to Home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

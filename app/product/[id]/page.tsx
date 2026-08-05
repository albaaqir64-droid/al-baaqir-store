import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductDetailClient from "./ProductDetailClient";
import { findProductByIdAsync } from "../../data/products";

type Props = {
  params: { id: string | string[] } | Promise<{ id: string | string[] }>;
};

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const idValue = resolvedParams?.id;
  const id = Array.isArray(idValue) ? idValue[0] : idValue;
  const product = await findProductByIdAsync(id ?? "");

  if (!product) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-4 text-slate-600">No product matches ID <strong>{id}</strong>.</p>
        <p className="mt-6"><a href="/">← Back to Home</a></p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <ProductDetailClient product={product} />
      </main>

      <Footer />
    </div>
  );
}

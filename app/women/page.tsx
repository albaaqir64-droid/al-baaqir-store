import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../lib/products";
import type { ProductRecord } from "../lib/productTypes";
import { NAVIGATION_GROUPS, formatCurrency } from "../lib/utils";

function toCard(product: ProductRecord) {
  const price = Number(product.price) || 0;
  const discountPercent = Number(product.discountPercent) || 0;
  const finalPrice = discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : price;

  return {
    id: product.id,
    name: product.name,
    price: formatCurrency(finalPrice),
    originalPriceNum: price,
    discountPercent: discountPercent > 0 ? discountPercent : undefined,
    image: product.mainImage ?? product.images?.[0] ?? '',
    description: product.description,
    discount: discountPercent > 0 ? `${discountPercent}%` : undefined,
    hsnSac: product.hsnSac,
    gstRate: product.gstRate,
  };
}

export default async function Page() {
  const allProducts = await fetchProducts(true);
  const womenCategories = NAVIGATION_GROUPS.find(g => g.label === "Women")?.categories || [];

  const data = allProducts.filter(p => {
    const gender = (p.gender || "").trim().toLowerCase();
    const isWomenGender = gender === "women" || gender === "unisex";

    const category = (p.category || "").trim().toLowerCase();
    const isWomenCategory = womenCategories.some(c => c.toLowerCase() === category);

    return isWomenGender || isWomenCategory;
  });

  const products = data.map(toCard);
  return (
    <div className="min-h-screen bg-[#faf8f4] text-[#151515]">
      <Header />

      <main className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="mb-12">
          <div className="eyebrow">Collection</div>
          <h1 className="text-[34px] md:text-[42px] serif font-medium mt-2">Women&apos;s elegance</h1>
          <p className="mt-4 text-[#777] max-w-[600px]">Handcrafted accessories that blend traditional Indian soul with contemporary luxury.</p>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-[17px] grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="border border-[#e8e2d9] bg-white p-20 text-center">
            <p className="text-[#aaa] text-[12px] font-bold uppercase tracking-widest">No products found</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

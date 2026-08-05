"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import AdminGuard from "../components/AdminGuard";
import { fetchOrders, OrderRecord } from "../lib/orders";
import { createProduct, deleteProductById, fetchProducts as fetchProductsFromFirestore, updateProduct } from "../lib/products";

const CATEGORY_OPTIONS = ["Men", "Women", "Belts", "Bags", "Kurti", "Karachi Suit", "Earrings", "Jhumka", "New Arrivals", "Sale"];

type ProductForm = {
  id?: string;
  name: string;
  category: string;
  price: string;
  stock: string;
  discountPercent: string;
  active: boolean;
  description: string;
  mainImage: string;
  gallery: string[];
};

const initialForm: ProductForm = {
  name: "",
  category: "Men",
  price: "0",
  stock: "0",
  discountPercent: "0",
  active: true,
  description: "",
  mainImage: "",
  gallery: [],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.category, product.slug, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [products, searchQuery]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total ?? 0), 0),
    [orders]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );

  const totalProducts = products.length;
  const totalOrders = orders.length;

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  async function loadDashboard() {
    setLoading(true);
    await Promise.all([loadProducts(), loadOrders()]);
    setLoading(false);
  }

  async function loadProducts() {
    try {
      const data = await fetchProductsFromFirestore();
      setProducts(data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
    }
  }

  async function loadOrders() {
    const data = await fetchOrders();
    setOrders(data || []);
  }

  function resetForm() {
    setForm(initialForm);
    setErrors({});
  }

  function openAddProduct() {
    resetForm();
    setDialogOpen(true);
  }

  function editProduct(product: any) {
    setForm({
      id: product.id,
      name: product.name || "",
      category: product.category || "Men",
      price: String(product.price ?? 0),
      stock: String(product.stock ?? 0),
      discountPercent: String(product.discountPercent ?? 0),
      active: product.active !== false,
      description: product.description || "",
      mainImage: product.mainImage || "",
      gallery: Array.isArray(product.images) ? product.images : [],
    });
    setDialogOpen(true);
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Product name is required.";
    if (!form.category.trim()) nextErrors.category = "Category is required.";
    if (Number(form.price) < 0) nextErrors.price = "Price cannot be negative.";
    if (Number(form.stock) < 0) nextErrors.stock = "Stock cannot be negative.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSaveProduct(event: FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        id: form.id,
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        discountPercent: Number(form.discountPercent) || 0,
        active: form.active,
        description: form.description.trim(),
        mainImage: form.mainImage,
        images: form.gallery,
      };
      if (form.id) {
        await updateProduct(form.id, {
          name: payload.name,
          category: payload.category,
          price: payload.price,
          stock: payload.stock,
          discountPercent: payload.discountPercent,
          active: payload.active,
          description: payload.description,
          mainImage: payload.mainImage,
          images: payload.images,
        });
        setToastType("success");
        setToastMessage("Product updated successfully.");
      } else {
        await createProduct({
          name: payload.name,
          category: payload.category,
          price: payload.price,
          stock: payload.stock,
          discountPercent: payload.discountPercent,
          active: payload.active,
          description: payload.description,
          mainImage: payload.mainImage,
          images: payload.images,
        });
        setToastType("success");
        setToastMessage("Product added successfully.");
      }
      await loadProducts();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      setToastType("error");
      setToastMessage("Unable to save product. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteProduct) return;
    setDeleting(true);
    setToastMessage("");
    await fetch(`/api/products?id=${encodeURIComponent(deleteProduct.id)}`, { method: "DELETE" });
    setDeleteProduct(null);
    await loadProducts();
    setDeleting(false);
    setToastType("success");
    setToastMessage("Product deleted successfully.");
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const readers = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Invalid file result"));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((images) => {
      setForm((current) => ({
        ...current,
        mainImage: current.mainImage || images[0],
        gallery: [...current.gallery, ...images],
      }));
    });
  }

  function handleDrag(event: DragEvent<HTMLDivElement>, active: boolean) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(active);
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto grid min-h-screen max-w-[1900px] grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-emerald/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-3xl bg-emerald-500 text-2xl font-semibold text-slate-950 shadow-inner shadow-emerald/20">AB</div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Al Baaqir</p>
                <h2 className="text-2xl font-semibold text-white">Admin HQ</h2>
              </div>
            </div>

            <nav className="mt-10 space-y-2 text-slate-300">
              <button className="flex w-full items-center justify-between rounded-3xl border border-emerald/20 bg-emerald-500/10 px-4 py-3 text-left text-white shadow-sm transition hover:border-emerald/40 hover:bg-emerald-500/15">
                <span>Dashboard</span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-emerald-200">Live</span>
              </button>
              <button className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-left text-slate-300 transition hover:border-emerald/30 hover:bg-slate-900/80">
                Orders
              </button>
            </nav>

            <div className="mt-10 rounded-[28px] border border-slate-800 bg-slate-900 p-5 shadow-lg">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Team</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-lg font-semibold text-slate-950">AL</div>
                <div>
                  <p className="font-semibold text-white">Aaliya</p>
                  <p className="text-sm text-slate-500">Store manager</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm md:flex md:items-center md:justify-between md:gap-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Dashboard</p>
                <h1 className="text-4xl font-semibold text-white">Premium store analytics</h1>
                <p className="max-w-2xl text-slate-400">Manage inventory, track sales, and update product listings with a premium admin experience.</p>
              </div>
              <div className="space-y-3 sm:flex sm:items-center sm:gap-3">
                <div className="relative w-full max-w-sm">
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products, categories..."
                    className="w-full rounded-full border border-slate-700 bg-slate-950/90 px-5 py-3 text-sm text-white outline-none transition focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                  />
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950 px-5 py-3">
                  <p className="text-sm text-slate-500">Admin</p>
                  <p className="font-semibold text-white">Aasiya</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total Products", value: totalProducts, icon: "📦", accent: "bg-emerald-500/15" },
                { label: "Total Orders", value: totalOrders, icon: "🛒", accent: "bg-gold/15" },
                { label: "Revenue", value: formatCurrency(totalRevenue), icon: "₹", accent: "bg-emerald-500/15" },
                { label: "Pending Orders", value: pendingOrders, icon: "⏳", accent: "bg-rose-500/10" },
              ].map((card) => (
                <div key={card.label} className="rounded-[28px] border border-slate-800 bg-slate-900 px-6 py-5 shadow-xl shadow-emerald/5 transition hover:-translate-y-1 hover:shadow-emerald/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                    </div>
                    <div className={`${card.accent} grid h-14 w-14 place-items-center rounded-3xl text-2xl`}>{card.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/30">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Product catalog</h2>
                  <p className="mt-2 text-slate-400">Add, preview, and manage your inventory with a premium product grid.</p>
                </div>
                <button
                  onClick={openAddProduct}
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
                >
                  + Add Product
                </button>
              </div>

              <div className="mt-6 overflow-x-auto rounded-[28px] border border-slate-800 bg-slate-950/90">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-200">
                  <thead className="bg-slate-950/90 text-slate-400">
                    <tr>
                      {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((header) => (
                        <th key={header} className="px-5 py-4 font-semibold uppercase tracking-[0.16em]">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-500">Loading products...</td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">No products match your search.</td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="transition hover:bg-slate-900/80">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-slate-800">
                                {product.mainImage ? (
                                  <img src={product.mainImage} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-2xl">📦</span>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{product.name}</p>
                                <p className="text-xs text-slate-500">{product.slug || 'no slug'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-300">{product.category}</td>
                          <td className="px-5 py-4 text-slate-200">{formatCurrency(product.price)}</td>
                          <td className="px-5 py-4 text-slate-300">{product.stock}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                              {product.active ? 'Live' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => editProduct(product)}
                                className="rounded-full border border-emerald-400 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                              >Edit</button>
                              <button
                                onClick={() => setDeleteProduct(product)}
                                className="rounded-full border border-rose-500 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                              >Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {dialogOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm">
            <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-slate-950/80">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Product editor</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{form.id ? "Edit product" : "Add new product"}</h2>
                </div>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                >Close</button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-200">Name</span>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                        placeholder="Product name"
                      />
                      {errors.name && <p className="mt-2 text-sm text-rose-500">{errors.name}</p>}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-200">Category</span>
                      <select
                        value={form.category}
                        onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                        className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-200">Price</span>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                        className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                      />
                      {errors.price && <p className="mt-2 text-sm text-rose-500">{errors.price}</p>}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-200">Stock</span>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                        className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                      />
                      {errors.stock && <p className="mt-2 text-sm text-rose-500">{errors.stock}</p>}
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-200">Discount %</span>
                      <input
                        type="number"
                        value={form.discountPercent}
                        onChange={(event) => setForm((current) => ({ ...current, discountPercent: event.target.value }))}
                        className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-200">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      rows={5}
                      className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                      placeholder="Write a short product description"
                    />
                  </label>

                  <div className="flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <input
                      id="active"
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                      className="h-5 w-5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald/50"
                    />
                    <label htmlFor="active" className="text-sm text-slate-200">Active listing</label>
                  </div>
                </div>

                <div className="space-y-5">
                  <div
                    className={`group relative rounded-[28px] border-2 border-dashed ${dragActive ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-700 bg-slate-950'} p-6 text-center transition`}
                    onDragEnter={(event) => handleDrag(event, true)}
                    onDragLeave={(event) => handleDrag(event, false)}
                    onDragOver={(event) => handleDrag(event, true)}
                    onDrop={(event) => {
                      handleDrag(event, false);
                      handleFiles(event.dataTransfer.files);
                    }}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => handleFiles(event.target.files)}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500 text-2xl text-slate-950 transition group-hover:scale-105">
                        +
                      </div>
                      <p className="text-lg font-semibold text-white">Drag & drop files here</p>
                      <p className="mt-2 text-sm text-slate-500">or browse from your device</p>
                    </label>
                  </div>

                  <div className="rounded-[28px] border border-slate-800 bg-slate-950 p-5 shadow-inner shadow-slate-950/20">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Preview</p>
                    <div className="mt-4 space-y-4">
                      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                        {form.mainImage ? (
                          <img src={form.mainImage} alt="Main preview" className="h-44 w-full rounded-3xl object-cover" />
                        ) : (
                          <div className="flex h-44 items-center justify-center rounded-3xl bg-slate-800 text-slate-500">No main image selected</div>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {form.gallery.length ? (
                          form.gallery.slice(0, 3).map((image, index) => (
                            <div key={index} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
                              <img src={image} alt={`Gallery ${index + 1}`} className="h-24 w-full object-cover" />
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-6 text-center text-slate-500">Add gallery images for quick previews.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full rounded-full px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${form.id ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-sky-500 shadow-sky-500/20 hover:bg-sky-400'}`}
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </span>
                    ) : form.id ? "Save changes" : "Add product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[32px] border border-slate-800 bg-slate-950 p-6 text-center shadow-2xl shadow-slate-950/80">
              <p className="text-sm uppercase tracking-[0.3em] text-rose-300">Confirm deletion</p>
              <h3 className="mt-4 text-2xl font-semibold text-white">Delete {deleteProduct.name}?</h3>
              <p className="mt-3 text-slate-400">This action cannot be undone. The product will be removed from the storefront.</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setDeleteProduct(null)}
                  className="rounded-full border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
                >Cancel</button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleting}
                >
                  {deleting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete product"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}

"use client";

import AdminGuard from "../../components/AdminGuard";
import { useEffect, useState } from "react";

type ProductForm = {
  id?: string;
  name: string;
  category: string;
  price: string;
  mainImage: string;
  images: string[];
  description: string;
  stock: string;
  discountPercent: string;
  active: boolean;
};

const CATEGORIES = ["Men", "Women", "Belts", "Bags", "Kurti", "Karachi Suit", "Earrings", "Jhumka", "New Arrivals", "Sale"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>({ name: "", category: "Belts", price: "0", mainImage: "", images: [], description: "", stock: "0", discountPercent: "0", active: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  function updateField<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function handleFilesChange(files: FileList | null) {
    if (!files) return;
    const imagePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Invalid file result'));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });
    const images = await Promise.all(imagePromises);
    setForm((s) => ({ ...s, images }));
  }

  async function handleMainFileChange(file: File | null) {
    if (!file) return;
    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Invalid file result'));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setForm((s) => ({ ...s, mainImage: src }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      name: form.name,
      category: form.category,
      price: Number(form.price || 0),
      mainImage: form.mainImage,
      images: form.images,
      description: form.description,
      stock: Number(form.stock || 0),
      discountPercent: Number(form.discountPercent || 0),
      active: form.active,
    };

    if (editingId) {
      payload.id = editingId;
      await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }

    setForm({ name: "", category: "Belts", price: "0", mainImage: "", images: [], description: "", stock: "0", discountPercent: "0", active: true });
    setEditingId(null);
    await fetchProducts();
  }

  function startEdit(p: any) {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      category: p.category || 'Belts',
      price: String(p.price || 0),
      mainImage: p.mainImage || '',
      images: p.images || [],
      description: p.description || '',
      stock: String(p.stock || 0),
      discountPercent: String(p.discountPercent || 0),
      active: p.active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete product?')) return;
    await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await fetchProducts();
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-white text-slate-900">
        <header className="border-b bg-emerald/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin — Products</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select className="mt-1 w-full rounded border px-3 py-2" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Price (INR)</label>
            <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.price} onChange={(e) => updateField('price', e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium">Stock</label>
            <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Main / Cover Image</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full text-sm"
              onChange={(e) => handleMainFileChange(e.target.files?.[0] ?? null)}
            />
            {form.mainImage && (
              <div className="mt-4">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 w-48">
                  <img src={form.mainImage} alt="Main preview" className="h-36 w-full object-cover" />
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Product Gallery Images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-1 w-full text-sm"
              onChange={(e) => handleFilesChange(e.target.files)}
            />
            {form.images.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {form.images.map((src, index) => (
                  <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <img src={src} alt={`Preview ${index + 1}`} className="h-32 w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Description</label>
            <textarea className="mt-1 w-full rounded border px-3 py-2" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">Discount %</label>
            <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.discountPercent} onChange={(e) => updateField('discountPercent', e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={form.active} onChange={(e) => updateField('active', e.target.checked)} />
            <label htmlFor="active" className="text-sm">Active</label>
          </div>

          <div className="md:col-span-2">
            <button className="w-full rounded-xl bg-emerald px-6 py-3 text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald-600" type="submit">
              Save Product
            </button>
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            {editingId && <button type="button" className="rounded border px-3 py-2" onClick={() => { setEditingId(null); setForm({ name: "", category: "Belts", price: "0", mainImage: "", images: [], description: "", stock: "0", discountPercent: "0", active: true }); }}>Cancel</button>}
          </div>
        </form>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Products</h2>
          {loading ? <p className="mt-4">Loading…</p> : (
            <div className="mt-4 grid gap-4">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 rounded border p-3">
                  <div className="flex items-center gap-4">
                    <img src={p.mainImage} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-slate-500">₹{p.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={() => startEdit(p)}>Edit</button>
                    <button type="button" className="rounded-full border border-rose-500 px-4 py-2 text-sm text-rose-600" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </main>
      </div>
    </AdminGuard>
  );
}

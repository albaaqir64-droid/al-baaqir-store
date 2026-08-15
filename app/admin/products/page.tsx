"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import AdminGuard from "../../components/AdminGuard";
import { readApiJson } from "../../lib/api/client";
import { FormEvent, useEffect, useState } from "react";
import type { ProductRecord } from "../../lib/productTypes";

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
  featured: boolean;
  hsnSac: string;
  gstRate: string;
};

const CATEGORIES = [
  "Belts",
  "Bags",
  "Kurti",
  "Shirts",
  "T-Shirts",
  "Jeans",
  "Women",
  "Men",
  "Other",
];

const initialForm: ProductForm = {
  name: "",
  category: "Belts",
  price: "0",
  mainImage: "",
  images: [],
  description: "",
  stock: "0",
  discountPercent: "0",
  active: true,
  featured: false,
  hsnSac: "",
  gstRate: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const parsed = await readApiJson<ProductRecord[]>(res);
      if (!parsed.ok) {
        throw new Error(parsed.error || 'Unable to load products.');
      }
      setProducts(Array.isArray(parsed.data) ? parsed.data : []);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => {
    void fetchProducts();
  }, []);

  useEffect(() => {
    if (!statusMessage && !errorMessage) return;
    const timer = window.setTimeout(() => {
      setStatusMessage(null);
      setErrorMessage(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [statusMessage, errorMessage]);

  function updateField<K extends keyof ProductForm>(k: K, v: ProductForm[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
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

  function handleRemoveImage(index: number) {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== index) }));
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || 'Other',
      price: Number(form.price || 0),
      mainImage: form.mainImage,
      images: form.images,
      description: form.description.trim(),
      stock: Number(form.stock || 0),
      discountPercent: Number(form.discountPercent || 0),
      active: form.active,
      featured: form.featured,
      hsnSac: form.hsnSac.trim(),
      gstRate: form.gstRate === "" ? undefined : Number(form.gstRate),
    };

    if (!payload.name) {
      setErrorMessage('Product name is required.');
      setSaving(false);
      return;
    }

    if (payload.price <= 0) {
      setErrorMessage('Product price must be greater than zero.');
      setSaving(false);
      return;
    }

    if (!payload.category) {
      setErrorMessage('Product category is required.');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const parsed = await readApiJson<{ error?: string }>(response);
      if (!parsed.ok) {
        throw new Error(parsed.error || 'Unable to save product.');
      }

      setStatusMessage(editingId ? 'Product updated successfully.' : 'Product added successfully.');
      resetForm();
      await fetchProducts();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: ProductRecord) {
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
      featured: p.featured === true,
      hsnSac: p.hsnSac || '',
      gstRate: p.gstRate === undefined ? '' : String(p.gstRate),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete product?')) return;
    try {
      const response = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const parsed = await readApiJson<{ error?: string }>(response);
      if (!parsed.ok) {
        throw new Error(parsed.error || 'Unable to delete product.');
      }
      setStatusMessage('Product deleted successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete product.');
    } finally {
      await fetchProducts();
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen brand-page text-slate-900">
        <header className="border-b bg-emerald/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin — Products</h1>
        </div>
      </header>

      <main className="admin-theme mx-auto max-w-7xl bg-emerald-50 px-6 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin — Products</h1>
            <p className="text-sm text-slate-600">Create, edit, and manage your store inventory.</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center rounded-xl bg-emerald px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald-600"
          >
            Add new product
          </button>
        </div>

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

          <div>
            <label className="block text-sm font-medium">HSN / SAC (optional)</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={form.hsnSac} onChange={(e) => updateField('hsnSac', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium">GST rate % (optional, price inclusive)</label>
            <input type="number" min="0" step="0.01" className="mt-1 w-full rounded border px-3 py-2" value={form.gstRate} onChange={(e) => updateField('gstRate', e.target.value)} />
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
                  <div key={index} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <img src={src} alt={`Preview ${index + 1}`} className="h-32 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-white"
                    >
                      Remove
                    </button>
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

          <div className="flex items-center gap-2">
            <input id="featured" type="checkbox" checked={form.featured} onChange={(e) => updateField('featured', e.target.checked)} />
            <label htmlFor="featured" className="text-sm">Featured</label>
          </div>

          <div className="md:col-span-2">
            <button className="w-full rounded-xl bg-emerald px-6 py-3 text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald-600 disabled:opacity-60" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            {editingId && (
              <button
                type="button"
                className="rounded border px-3 py-2"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Products</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {statusMessage && <span className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-900">{statusMessage}</span>}
              {errorMessage && <span className="rounded-full bg-rose-50 px-4 py-2 text-rose-900">{errorMessage}</span>}
            </div>
          </div>
          {loading ? <p className="mt-4">Loading…</p> : (
            <div className="mt-4 grid gap-4">
              {products.map((p: ProductRecord) => (
                <div key={p.id} className="flex items-center justify-between gap-4 rounded border p-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                      {p.mainImage ? (
                        <img src={p.mainImage} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  Package,
  Tag,
  Info,
  Truck,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { readApiJson } from "../../../../lib/api/client";
import type { ProductRecord } from "../../../../lib/productTypes";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    discountPercent: "0",
    description: "",
    mainImage: "",
    images: [""] as string[],
    active: true,
    featured: false,
    hsnSac: "",
    gstRate: "12",
    gender: "Unisex",
    weight: "",
    dimensions: {
      length: "",
      breadth: "",
      height: "",
    }
  });

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products`);
        const parsed = await readApiJson<ProductRecord[]>(res);
        if (parsed.ok && Array.isArray(parsed.data)) {
          const product = parsed.data.find(p => p.id === id);
          if (product) {
            setFormData({
              name: product.name || "",
              category: product.category || "",
              price: String(product.price || ""),
              stock: String(product.stock || "0"),
              discountPercent: String(product.discountPercent || "0"),
              description: product.description || "",
              mainImage: product.mainImage || "",
              images: product.images && product.images.length > 0 ? product.images : [""],
              active: product.active !== false,
              featured: product.featured === true,
              hsnSac: product.hsnSac || "",
              gstRate: String(product.gstRate || "12"),
              gender: product.gender || "Unisex",
              weight: String(product.weight || ""),
              dimensions: {
                length: String(product.dimensions?.length || ""),
                breadth: String(product.dimensions?.breadth || ""),
                height: String(product.dimensions?.height || ""),
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void fetchProduct();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ""] });
  };

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        id,
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        discountPercent: Number(formData.discountPercent),
        gstRate: Number(formData.gstRate),
        weight: formData.weight ? Number(formData.weight) : undefined,
        dimensions: {
          length: Number(formData.dimensions.length),
          breadth: Number(formData.dimensions.breadth),
          height: Number(formData.dimensions.height),
        },
        images: formData.images.filter(img => img.trim() !== "")
      };

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await readApiJson(res);
      if (parsed.ok) {
        router.push("/admin/products");
      } else {
        alert("Failed to update product: " + (parsed.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("An error occurred while updating the product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
            <p className="text-slate-500 text-sm mt-1">Update product details and stock information.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Info size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Basic Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Premium Silk Scarf"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the luxury, materials, and craftsmanship..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none transition-all"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Fragrance">Fragrance</option>
                    <option value="Home Decor">Home Decor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none transition-all"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <ImageIcon size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Product Media</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Image URL</label>
                <div className="flex gap-4">
                  <div className="h-24 w-24 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {formData.mainImage ? (
                      <img src={formData.mainImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-200" size={32} />
                    )}
                  </div>
                  <input
                    type="text"
                    name="mainImage"
                    value={formData.mainImage}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm self-center focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gallery Images</label>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="text-[10px] font-bold text-slate-900 flex items-center gap-1 hover:underline"
                  >
                    <Plus size={12} /> Add More
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="h-16 w-16 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center transition-all group-focus-within:border-slate-300">
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="text-slate-200" size={24} />
                        )}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => handleImageChange(idx, e.target.value)}
                          placeholder="Gallery image URL..."
                          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm self-center focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageField(idx)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl self-center transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Truck size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Shipping & Logistics</h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="0.5"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Length (cm)</label>
                <input
                  type="number"
                  name="dimensions.length"
                  value={formData.dimensions.length}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Breadth (cm)</label>
                <input
                  type="number"
                  name="dimensions.breadth"
                  value={formData.dimensions.breadth}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Height (cm)</label>
                <input
                  type="number"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  placeholder="10"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Tag size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Pricing & Inventory</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discount (%)</label>
                <input
                  type="number"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Layers size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Tax & Compliance</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HSN/SAC Code</label>
                <input
                  type="text"
                  name="hsnSac"
                  value={formData.hsnSac}
                  onChange={handleChange}
                  placeholder="e.g. 6214"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GST Rate (%)</label>
                <select
                  name="gstRate"
                  value={formData.gstRate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none transition-all"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-slate-400" />
              <h2 className="font-bold text-slate-900">Visibility</h2>
            </div>
            <div className="p-6 space-y-4">
               <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Active Listing</span>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
               </label>
               <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-bold text-slate-700">Featured Product</span>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
               </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

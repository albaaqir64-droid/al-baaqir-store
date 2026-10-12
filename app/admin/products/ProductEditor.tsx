"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { Check, ChevronLeft, ImagePlus, LoaderCircle, MoveDown, MoveUp, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { storage } from "../../lib/firebase";
import { adminFetch } from "../../lib/adminFetch";
import { readApiJson } from "../../lib/api/client";
import type { ProductRecord } from "../../lib/productTypes";

type ImageItem = { url: string; path?: string; progress?: number };
type Variant = { size: string; color: string; sku: string; stock: string; price: string };
const input = "w-full rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export default function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [primary, setPrimary] = useState(0);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [fields, setFields] = useState<Record<string, string | boolean>>({ name: "", sku: "", slug: "", category: "", subcategory: "", description: "", specifications: "", material: "", price: "", mrp: "", discountPercent: "0", stock: "0", lowStockThreshold: "5", hsnSac: "", gstRate: "", taxMode: "inclusive", gender: "Unisex", weight: "", length: "", breadth: "", height: "", active: true, featured: false });
  const set = (key: string, value: string | boolean) => setFields(old => ({ ...old, [key]: value }));
  const price = Number(fields.price) || 0, mrp = Number(fields.mrp) || 0;
  const discount = useMemo(() => mrp > price && mrp ? Math.round((mrp - price) * 100 / mrp) : Number(fields.discountPercent) || 0, [mrp, price, fields.discountPercent]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const response = await adminFetch("/api/products");
        const result = await readApiJson<ProductRecord[]>(response);
        if (!result.ok || !result.data) throw new Error(result.error || "Could not load product");
        const product = result.data.find(item => item.id === id);
        if (!product) throw new Error("Product not found");
        const data = product as ProductRecord & Record<string, unknown>;
        setFields(old => ({ ...old, ...Object.fromEntries(Object.entries({ name: data.name, sku: data.sku, slug: data.slug, category: data.category, subcategory: data.subcategory, description: data.description, specifications: data.specifications, material: data.material, price: data.price, mrp: data.mrp, discountPercent: data.discountPercent, stock: data.stock, lowStockThreshold: data.lowStockThreshold, hsnSac: data.hsnSac, gstRate: data.gstRate, taxMode: data.taxMode || "inclusive", gender: data.gender, weight: data.weight, length: data.dimensions?.length, breadth: data.dimensions?.breadth, height: data.dimensions?.height, active: data.active, featured: data.featured }).map(([key, value]) => [key, value == null ? old[key] : String(value)])), active: data.active !== false, featured: data.featured === true }));
        const urls = [...new Set([data.mainImage, ...(data.galleryImages || data.images || [])].filter(Boolean))] as string[];
        setImages(urls.map(url => ({ url })));
        setVariants(Array.isArray(data.variants) ? data.variants.map(v => ({ size: v.size || "", color: v.color || "", sku: v.sku || "", stock: String(v.stock ?? 0), price: String(v.price ?? "") })) : []);
      } catch (e) { setError(e instanceof Error ? e.message : "Could not load product"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function uploadFiles(files: FileList | null) {
    setError("");
    if (!files) return;
    const chosen = Array.from(files);
    if (chosen.some(file => !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 8 * 1024 * 1024)) { setError("Choose JPG, PNG, WebP or AVIF images under 8 MB each."); return; }
    for (const file of chosen) {
      const path = `products/${id || "new"}/${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const item: ImageItem = { url: URL.createObjectURL(file), path, progress: 0 };
      setImages(old => [...old, item]);
      try {
        const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type });
        await new Promise<void>((resolve, reject) => task.on("state_changed", s => setImages(old => old.map(img => img.path === path ? { ...img, progress: Math.round(100 * s.bytesTransferred / s.totalBytes) } : img)), reject, resolve));
        const url = await getDownloadURL(task.snapshot.ref);
        setImages(old => old.map(img => img.path === path ? { ...img, url, progress: undefined } : img));
      } catch (e) { setImages(old => old.filter(img => img.path !== path)); setError(e instanceof Error ? `Image upload failed: ${e.message}` : "Image upload failed. Check admin access and Storage configuration."); }
    }
  }
  async function removeImage(index: number) {
    const image = images[index];
    if (image?.path) try { await deleteObject(ref(storage, image.path)); } catch { /* An already removed upload does not block editing. */ }
    setImages(old => old.filter((_, i) => i !== index));
    setPrimary(old => index === old ? 0 : index < old ? old - 1 : old);
  }
  function moveImage(index: number, by: number) {
    const target = index + by; if (target < 0 || target >= images.length) return;
    setImages(old => { const next = [...old]; [next[index], next[target]] = [next[target], next[index]]; return next; });
    if (primary === index) setPrimary(target); else if (primary === target) setPrimary(index);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      if (images.some(image => image.progress !== undefined)) throw new Error("Wait for all image uploads to finish.");
      if (fields.gstRate !== "" && (!Number.isFinite(Number(fields.gstRate)) || Number(fields.gstRate) < 0 || Number(fields.gstRate) > 100)) throw new Error("Enter a valid GST rate from 0 to 100, or leave it blank if unverified.");
      if (fields.hsnSac && !/^[A-Za-z0-9]{4,8}$/.test(String(fields.hsnSac))) throw new Error("HSN/SAC must be 4 to 8 letters or digits.");
      if (Number(fields.price) < 0 || Number(fields.stock) < 0 || Number(fields.mrp || 0) < 0) throw new Error("Price, MRP and stock cannot be negative.");
      const imageUrls = images.map(image => image.url).filter(url => url.startsWith("https://"));
      const primaryImage = images[primary]?.url?.startsWith("https://") ? images[primary].url : imageUrls[0] || "";
      const normalizedVariants = variants.map(v => ({ ...v, stock: Number(v.stock), price: v.price === "" ? null : Number(v.price) }));
      if (normalizedVariants.some(v => !Number.isInteger(v.stock) || v.stock < 0 || (v.price !== null && (v.price < 0 || !Number.isFinite(v.price))))) throw new Error("Variant stock and prices must be valid non-negative numbers.");
      const payload = { ...(id ? { id } : {}), ...fields, price: Number(fields.price), mrp: fields.mrp === "" ? null : Number(fields.mrp), stock: normalizedVariants.length ? normalizedVariants.reduce((sum, v) => sum + v.stock, 0) : Number(fields.stock), lowStockThreshold: Number(fields.lowStockThreshold) || 0, discountPercent: discount, gstRate: fields.gstRate === "" ? null : Number(fields.gstRate), hsnSac: String(fields.hsnSac || "").trim(), weight: fields.weight === "" ? null : Number(fields.weight), dimensions: { length: fields.length === "" ? null : Number(fields.length), breadth: fields.breadth === "" ? null : Number(fields.breadth), height: fields.height === "" ? null : Number(fields.height) }, images: imageUrls.filter(url => url !== primaryImage), galleryImages: imageUrls.filter(url => url !== primaryImage), mainImage: primaryImage, variants: normalizedVariants };
      const response = await adminFetch("/api/products", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await readApiJson(response); if (!result.ok) throw new Error(result.error || "Save failed");
      setMessage("Product saved successfully."); router.push("/admin/products"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save product"); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="p-12 text-center text-emerald-800"><LoaderCircle className="mx-auto animate-spin"/>Loading product…</div>;
  const textField = (key: string, title: string, type = "text", required = false) => <label className="block" key={key}><span className={label}>{title}{required ? " *" : ""}</span><input className={input} required={required} type={type} value={String(fields[key] ?? "")} onChange={e => set(key, e.target.value)} /></label>;
  const section = (title: string, children: React.ReactNode) => <section className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6"><h2 className="border-b border-amber-200 pb-3 text-lg font-bold text-emerald-950">{title}</h2>{children}</section>;
  return <form onSubmit={submit} className="mx-auto max-w-6xl space-y-5 pb-12 text-slate-800">
    <header className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Link href="/admin/products" className="rounded-xl border p-2 text-emerald-900"><ChevronLeft/></Link><div><h1 className="text-2xl font-bold text-emerald-950">{id ? "Edit product" : "Add product"}</h1><p className="text-sm text-slate-500">Catalog, pricing, tax and inventory</p></div></div><button disabled={saving} className="flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"><Save size={17}/>{saving ? "Saving…" : "Save product"}</button></header>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-900">{message}</p>}{error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}
    {section("Product information", <><div className="grid gap-4 sm:grid-cols-2">{textField("name", "Product name", "text", true)}{textField("sku", "Unique SKU / code", "text", true)}{textField("slug", "Slug (auto generated if blank)")}{textField("category", "Category", "text", true)}{textField("subcategory", "Subcategory")}{textField("gender", "Audience")}{textField("material", "Material")}</div><label className="block"><span className={label}>Full description</span><textarea className={input} rows={4} value={String(fields.description)} onChange={e => set("description", e.target.value)}/></label><label className="block"><span className={label}>Specifications (one per line)</span><textarea className={input} rows={3} value={String(fields.specifications)} onChange={e => set("specifications", e.target.value)}/></label></>)}
    {section("Product images", <><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-sm font-semibold text-emerald-900"><ImagePlus/>Choose images (JPG, PNG, WebP, AVIF · max 8 MB each)<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={e => { void uploadFiles(e.target.files); e.currentTarget.value = ""; }}/></label><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((image, index) => <div key={image.path || image.url} className="overflow-hidden rounded-xl border border-emerald-100"><img src={image.url} alt="Product preview" className="aspect-square w-full object-cover"/><div className="space-y-2 p-2"><button type="button" onClick={() => setPrimary(index)} className={`w-full rounded-lg px-2 py-1 text-xs ${index === primary ? "bg-amber-100 text-amber-900" : "bg-slate-50"}`}>{index === primary ? <><Check size={13} className="mr-1 inline"/>Primary image</> : "Set as primary"}</button>{image.progress !== undefined && <progress className="w-full accent-emerald-700" value={image.progress} max="100"/>}<div className="flex justify-between"><button type="button" aria-label="Move image earlier" onClick={() => moveImage(index, -1)}><MoveUp size={16}/></button><button type="button" aria-label="Move image later" onClick={() => moveImage(index, 1)}><MoveDown size={16}/></button><button type="button" aria-label="Remove image" onClick={() => void removeImage(index)} className="text-rose-600"><Trash2 size={16}/></button></div></div></div>)}</div></>)}
    {section("Pricing and tax", <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{textField("mrp", "MRP (₹)", "number")}{textField("price", "Selling price (₹)", "number", true)}<label><span className={label}>Discount</span><p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-900">{discount}%</p></label>{textField("hsnSac", "HSN / SAC")}{textField("gstRate", "GST rate (%) · leave blank if unverified", "number")}<label><span className={label}>Tax mode</span><select className={input} value={String(fields.taxMode)} onChange={e => set("taxMode", e.target.value)}><option value="inclusive">Inclusive</option><option value="exclusive">Exclusive</option></select></label></div><p className="text-xs text-slate-500">No GST rate is preselected. Existing invoice calculations remain tax-inclusive.</p></>)}
    {section("Inventory and variants", <><div className="grid gap-4 sm:grid-cols-3">{textField("stock", "Stock quantity", "number", true)}{textField("lowStockThreshold", "Low stock threshold", "number")}</div><div className="space-y-3">{variants.map((v, i) => <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-emerald-50 p-3 sm:grid-cols-5"><input aria-label="Size" placeholder="Size" className={input} value={v.size} onChange={e => setVariants(a => a.map((x,n) => n===i?{...x,size:e.target.value}:x))}/><input aria-label="Colour" placeholder="Colour" className={input} value={v.color} onChange={e => setVariants(a => a.map((x,n) => n===i?{...x,color:e.target.value}:x))}/><input aria-label="Variant SKU" placeholder="Variant SKU" className={input} value={v.sku} onChange={e => setVariants(a => a.map((x,n) => n===i?{...x,sku:e.target.value}:x))}/><input aria-label="Variant stock" placeholder="Stock" type="number" min="0" className={input} value={v.stock} onChange={e => setVariants(a => a.map((x,n) => n===i?{...x,stock:e.target.value}:x))}/><div className="flex gap-1"><input aria-label="Variant price" placeholder="Price optional" type="number" min="0" className={input} value={v.price} onChange={e => setVariants(a => a.map((x,n) => n===i?{...x,price:e.target.value}:x))}/><button type="button" onClick={() => setVariants(a => a.filter((_,n)=>n!==i))}><Trash2 size={17}/></button></div></div>)}<button type="button" className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-900" onClick={() => setVariants(a => [...a, {size:"",color:"",sku:"",stock:"0",price:""}])}>+ Add size/colour variant</button></div><p className="text-xs text-slate-500">Sizes and variants are optional; bags and accessories can use product-level stock.</p></>)}
    {section("Shipping and visibility", <><div className="grid gap-4 sm:grid-cols-4">{textField("weight", "Weight (kg)", "number")}{textField("length", "Length (cm)", "number")}{textField("breadth", "Width (cm)", "number")}{textField("height", "Height (cm)", "number")}</div><div className="flex flex-wrap gap-6"><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(fields.active)} onChange={e => set("active", e.target.checked)}/>Active</label><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(fields.featured)} onChange={e => set("featured", e.target.checked)}/>Featured</label></div></>)}
    <footer className="flex justify-end gap-3"><Link href="/admin/products" className="rounded-xl border border-slate-200 px-5 py-3">Cancel</Link><button disabled={saving} className="rounded-xl bg-emerald-800 px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save product"}</button></footer>
  </form>;
}

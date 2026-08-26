"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import AdminGuard from "../../components/AdminGuard";
import { readApiJson } from "../../lib/api/client";
import { FormEvent, useEffect, useState } from "react";
import type { ProductRecord } from "../../lib/productTypes";
import { storage, auth } from "../../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

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
  gender: string;
  hsnSac: string;
  gstRate: string;
  sizes: string[];
  colors: string[];
  variantStock: Record<string, string>;
};

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
const PREDEFINED_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Green", hex: "#008000" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Grey", hex: "#808080" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Beige", hex: "#F5F5DC" },
];

const CATEGORIES = [
  "Belts",
  "Bags",
  "Kurti",
  "Karachi Suit",
  "Earrings",
  "Jhumka",
  "Shirts",
  "T-Shirts",
  "Jeans",
  "Watches",
  "Women",
  "Men",
  "Other",
];

const GENDERS = ["Men", "Women", "Unisex"];

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
  gender: "Unisex",
  hsnSac: "",
  gstRate: "",
  sizes: [],
  colors: [],
  variantStock: {},
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Track files to be uploaded with their preview URLs
  const [mainImageFile, setMainImageFile] = useState<{ file: File; blob: string } | null>(null);
  const [galleryImageFiles, setGalleryImageFiles] = useState<{ file: File; blob: string }[]>([]);

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
    setMainImageFile(null);
    setGalleryImageFiles([]);
  }

  async function handleFilesChange(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).map(file => {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 5MB).`);
        return null;
      }
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`);
        return null;
      }
      return {
        file,
        blob: URL.createObjectURL(file)
      };
    }).filter((f): f is { file: File; blob: string } => f !== null);

    setGalleryImageFiles((prev) => [...prev, ...newFiles]);
    setForm((s) => ({ ...s, images: [...s.images, ...newFiles.map(f => f.blob)] }));
  }

  function handleRemoveImage(index: number) {
    const imageUrl = form.images[index];

    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
      setGalleryImageFiles(prev => prev.filter(f => f.blob !== imageUrl));
    }

    setForm((s) => ({
      ...s,
      images: s.images.filter((_, i) => i !== index)
    }));
  }

  async function handleMainFileChange(file: File | null) {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Main image is too large (max 5MB).");
      return;
    }

    // Revoke old blob if exists
    if (mainImageFile) {
      URL.revokeObjectURL(mainImageFile.blob);
    }

    const blob = URL.createObjectURL(file);
    setMainImageFile({ file, blob });
    setForm((s) => ({ ...s, mainImage: blob }));
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    console.log(`DEBUG: Starting upload process for: ${path}`);

    try {
      // 1. Ensure Firebase Auth is fully ready
      let currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("DEBUG: No user found, attempting anonymous sign-in...");
        const cred = await signInAnonymously(auth);
        currentUser = cred.user;
      }

      // 2. CRITICAL: Refresh token and wait for it to be active
      // This ensures the Storage SDK has the latest authentication context
      const token = await currentUser.getIdToken(true);
      console.log("DEBUG: Auth token refreshed successfully. UID:", currentUser.uid);

      // 3. Log Bucket Info
      const currentBucket = storage.app.options.storageBucket;
      console.log("DEBUG: Target Storage Bucket:", currentBucket);

      const storageRef = ref(storage, path);

      // 4. Perform the upload
      console.log("DEBUG: Uploading bytes...");
      const snapshot = await uploadBytes(storageRef, file);

      console.log("DEBUG: uploadBytes success. Fetching download URL...");
      const url = await getDownloadURL(snapshot.ref);

      console.log(`DEBUG: Upload completed! URL: ${url}`);
      return url;
    } catch (error: any) {
      console.error("DEBUG: STORAGE UPLOAD FAILED!", {
        errorCode: error.code,
        errorMessage: error.message,
        bucket: storage.app.options.storageBucket,
        uid: auth.currentUser?.uid
      });

      if (error.code === 'storage/unauthorized') {
        throw new Error(`Permission Denied (storage/unauthorized).
        1. Please ensure your Anonymous Auth is Enabled in Firebase Console.
        2. Verify that Storage Rules allow write for authenticated users.
        3. UID is: ${auth.currentUser?.uid}`);
      }
      throw error;
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setSaving(true);

    try {
      // 0. Ensure Firebase Auth is ready
      console.log("DEBUG: Checking Firebase Auth status before submission...");

      // Wait for auth to initialize
      let currentUser = auth.currentUser;

      if (!currentUser) {
        console.log("DEBUG: No user found, waiting for auth state to stabilize...");
        // Wait up to 3 seconds for onAuthStateChanged
        await new Promise<void>((resolve) => {
          const unsub = onAuthStateChanged(auth, (user) => {
            currentUser = user;
            unsub();
            resolve();
          });
          setTimeout(resolve, 3000);
        });
      }

      if (!currentUser) {
        console.log("DEBUG: Still no user, attempting explicit anonymous sign-in...");
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          console.log("DEBUG: Anonymous sign-in success, UID:", currentUser.uid);
          // Wait for token to propagate to Storage service
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (authErr: any) {
          console.error("DEBUG: Auth error during submission:", authErr);
          if (authErr.code === 'auth/operation-not-allowed') {
             throw new Error("Anonymous sign-in is not enabled in Firebase Console.");
          }
          throw authErr;
        }
      }

      if (currentUser) {
        console.log("DEBUG: Proceeding with authenticated user:", currentUser.uid);
        await currentUser.getIdToken(true);
      } else {
        throw new Error("Failed to authenticate with Firebase. Storage upload will not be permitted.");
      }

      console.log("DEBUG: Firebase Project Config:", {
        projectId: storage.app.options.projectId,
        bucket: storage.app.options.storageBucket
      });

      // Helper to ensure we only send clean URLs to the API
      const processImage = async (src: string, label: string): Promise<string> => {
        if (!src) return "";
        if (src.startsWith("http") || src.startsWith("gs://")) return src;

        console.log(`Processing image for ${label}...`);

        // 1. Try to find the File object in our state (most efficient)
        const match = [mainImageFile, ...galleryImageFiles].find(f => f?.blob === src);
        if (match) {
          console.log(`Uploading ${label} from File object...`);
          const path = `products/${label}_${Date.now()}_${match.file.name.replace(/\s+/g, '_')}`;
          return await uploadFile(match.file, path);
        }

        // 2. If it's a blob: or data: URL but no File object, fetch and upload
        if (src.startsWith("blob:") || src.startsWith("data:")) {
          console.log(`Uploading ${label} from ${src.startsWith("blob:") ? "Blob" : "Data"} URL...`);
          const res = await fetch(src);
          const blob = await res.blob();
          const ext = blob.type.split("/")[1] || "jpg";
          const path = `products/${label}_${Date.now()}.${ext}`;
          const file = new File([blob], `image.${ext}`, { type: blob.type });
          return await uploadFile(file, path);
        }

        // 3. Last resort check for base64
        if (src.length > 2000) {
          throw new Error(`Field ${label} contains raw image data but failed to upload. Please re-select the image.`);
        }

        return src;
      };

      const finalMainImage = await processImage(form.mainImage, "main");
      const finalImages = await Promise.all(
        form.images.map((img, idx) => processImage(img, `gallery_${idx}`))
      );

      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || 'Other',
        price: Number(form.price || 0),
        mainImage: finalMainImage,
        images: finalImages,
        galleryImages: finalImages, // Keep both for backward compatibility
        description: form.description.trim(),
        stock: Number(form.stock || 0),
        discountPercent: Number(form.discountPercent || 0),
        active: form.active,
        featured: form.featured,
        gender: form.gender,
        hsnSac: form.hsnSac.trim(),
        gstRate: form.gstRate === "" ? undefined : Number(form.gstRate),
        sizes: form.sizes,
        colors: form.colors,
        variantStock: Object.fromEntries(
          Object.entries(form.variantStock)
            .map(([key, val]) => [key, Number(val) || 0] as [string, number])
            .filter(([, val]) => val > 0)
        ),
      };

      if (!payload.name) throw new Error('Product name is required.');
      if (payload.price <= 0) throw new Error('Product price must be greater than zero.');

      // FINAL PROTECTION: Verify no large data escaped into the payload
      const jsonBody = JSON.stringify(editingId ? { id: editingId, ...payload } : payload);
      console.log("DEBUG: Final Request Body Size:", jsonBody.length, "bytes");

      if (jsonBody.length > 500000) { // 0.5MB limit for the metadata JSON
        throw new Error("Payload still too large. One or more images failed to upload to storage and are being sent as raw data.");
      }

      const response = await fetch('/api/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonBody,
      });

      const parsed = await readApiJson<{ error?: string }>(response);
      if (!parsed.ok) {
        throw new Error(parsed.error || 'Unable to save product.');
      }

      setStatusMessage(editingId ? 'Product updated successfully.' : 'Product added successfully.');
      resetForm();
      await fetchProducts();
    } catch (error) {
      console.error("Save error:", error);
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
      gender: p.gender || 'Unisex',
      hsnSac: p.hsnSac || '',
      gstRate: p.gstRate === undefined ? '' : String(p.gstRate),
      sizes: p.sizes || [],
      colors: p.colors || [],
      variantStock: Object.fromEntries(
        Object.entries(p.variantStock || {}).map(([k, v]) => [k, String(v)])
      ),
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
      <div className="min-h-screen brand-page text-brand-dark bg-brand-off-white">
        <header className="border-b bg-brand-dark px-6 py-6 text-white shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-widest">Admin — Inventory</h1>
              <p className="text-sm text-brand-light">Manage and update your luxury product collection.</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-full bg-brand-green px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-teal"
            >
              Add new product
            </button>
          </div>
        </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 rounded-[32px] border border-brand-light bg-white p-8 shadow-xl">
          <h2 className="text-xl font-bold text-brand-dark mb-6 uppercase tracking-wider border-b border-brand-light pb-4">
            {editingId ? 'Edit Product' : 'Create New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Product Name</label>
              <input className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Category</label>
              <select className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Gender</label>
                <select className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Base Price (₹)</label>
                <input type="number" className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.price} onChange={(e) => updateField('price', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Stock Qty</label>
                <input type="number" className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Discount %</label>
                <input type="number" className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.discountPercent} onChange={(e) => updateField('discountPercent', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">HSN / SAC</label>
                <input className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.hsnSac} onChange={(e) => updateField('hsnSac', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">GST Rate %</label>
                <input type="number" min="0" step="0.01" className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" value={form.gstRate} onChange={(e) => updateField('gstRate', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-6 py-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-brand-light text-brand-teal focus:ring-brand-teal" checked={form.active} onChange={(e) => updateField('active', e.target.checked)} />
                <span className="text-sm font-bold text-brand-dark uppercase tracking-wider">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-brand-light text-brand-teal focus:ring-brand-teal" checked={form.featured} onChange={(e) => updateField('featured', e.target.checked)} />
                <span className="text-sm font-bold text-brand-dark uppercase tracking-wider">Featured</span>
              </label>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Main Product Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-teal file:text-white hover:file:bg-brand-dark transition"
                    onChange={(e) => handleMainFileChange(e.target.files?.[0] ?? null)}
                  />
                  {form.mainImage && (
                    <div className="h-24 w-24 overflow-hidden rounded-xl border border-brand-light shadow-md">
                      <img src={form.mainImage} alt="Main preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Gallery Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-teal file:text-white hover:file:bg-brand-dark transition"
                  onChange={(e) => handleFilesChange(e.target.files)}
                />
                {form.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-8">
                    {form.images.map((src, index) => (
                      <div key={index} className="relative group aspect-square overflow-hidden rounded-xl border border-brand-light shadow-sm">
                        <img src={src} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute inset-0 flex items-center justify-center bg-brand-dark/60 text-white opacity-0 group-hover:opacity-100 transition duration-200"
                        >
                          <span className="text-xs font-bold uppercase">Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider mb-2">Product Description</label>
              <textarea className="w-full rounded-xl border border-brand-light bg-brand-off-white px-4 py-3 text-brand-dark outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20" rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </div>

            <div className="md:col-span-2 grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider">Available Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => (
                    <label key={size} className={`flex items-center justify-center px-4 py-2 rounded-full border text-xs font-bold uppercase cursor-pointer transition ${
                      form.sizes.includes(size) ? 'bg-brand-teal text-white border-brand-teal shadow-md' : 'bg-white text-brand-teal border-brand-light hover:border-brand-teal'
                    }`}>
                      <input type="checkbox" className="hidden" checked={form.sizes.includes(size)} onChange={(e) => e.target.checked ? updateField('sizes', [...form.sizes, size]) : updateField('sizes', form.sizes.filter(s => s !== size))} />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-brand-teal uppercase tracking-wider">Available Colors</label>
                <div className="flex flex-wrap gap-3">
                  {PREDEFINED_COLORS.map((color) => (
                    <label key={color.name} className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-brand-light cursor-pointer shadow-sm transition ${
                      form.colors.includes(color.hex) ? 'ring-2 ring-brand-teal ring-offset-2 scale-110' : 'hover:scale-105'
                    }`} style={{ backgroundColor: color.hex }} title={color.name}>
                      <input type="checkbox" className="hidden" checked={form.colors.includes(color.hex)} onChange={(e) => e.target.checked ? updateField('colors', [...form.colors, color.hex]) : updateField('colors', form.colors.filter(c => c !== color.hex))} />
                      {form.colors.includes(color.hex) && <span className={`text-xs ${['#FFFFFF', '#FFFF00', '#F5F5DC'].includes(color.hex) ? 'text-brand-dark' : 'text-white'}`}>✓</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {(form.sizes.length > 0 || form.colors.length > 0) && (
              <div className="md:col-span-2 rounded-[28px] border border-brand-light bg-brand-off-white p-6 shadow-inner">
                <h3 className="mb-4 text-sm font-bold text-brand-dark uppercase tracking-widest border-b border-brand-light pb-2">Variant Stock (Detailed)</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* ... same variant stock logic ... */}
                  {form.sizes.length > 0 && form.colors.length > 0 ? (
                    form.sizes.map(size => (
                      form.colors.map(colorHex => {
                        const colorName = PREDEFINED_COLORS.find(c => c.hex === colorHex)?.name || colorHex;
                        const key = `${size}_${colorHex}`;
                        return (
                          <div key={key} className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-teal uppercase">{size} / {colorName}</label>
                            <input type="number" className="w-full rounded-lg border border-brand-light bg-white px-3 py-2 text-xs" value={form.variantStock[key] || ""} onChange={(e) => updateField('variantStock', { ...form.variantStock, [key]: e.target.value })} />
                          </div>
                        );
                      })
                    ))
                  ) : form.sizes.length > 0 ? (
                    form.sizes.map(size => {
                      const key = `size_${size}`;
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] font-bold text-brand-teal uppercase">Size: {size}</label>
                          <input type="number" className="w-full rounded-lg border border-brand-light bg-white px-3 py-2 text-xs" value={form.variantStock[key] || ""} onChange={(e) => updateField('variantStock', { ...form.variantStock, [key]: e.target.value })} />
                        </div>
                      );
                    })
                  ) : (
                    form.colors.map(colorHex => {
                      const colorName = PREDEFINED_COLORS.find(c => c.hex === colorHex)?.name || colorHex;
                      const key = `color_${colorHex}`;
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] font-bold text-brand-teal uppercase">Color: {colorName}</label>
                          <input type="number" className="w-full rounded-lg border border-brand-light bg-white px-3 py-2 text-xs" value={form.variantStock[key] || ""} onChange={(e) => updateField('variantStock', { ...form.variantStock, [key]: e.target.value })} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="md:col-span-2 pt-6 flex flex-col gap-4 sm:flex-row">
              <button className="flex-1 rounded-full bg-brand-dark px-8 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-brand-teal disabled:opacity-50" type="submit" disabled={saving}>
                {saving ? 'Synchronizing with Database...' : (editingId ? 'Update Premium Product' : 'List New Product')}
              </button>
              {editingId && (
                <button type="button" className="rounded-full border border-brand-light bg-white px-8 py-4 text-sm font-bold text-brand-dark transition hover:bg-brand-off-white" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <section>
          <div className="mb-6 flex items-center justify-between border-b border-brand-light pb-4">
            <h2 className="text-xl font-bold text-brand-dark uppercase tracking-wider">Current Inventory ({products.length})</h2>
            <div className="flex gap-4">
              {statusMessage && <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700 border border-green-200">{statusMessage}</span>}
              {errorMessage && <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700 border border-red-200">{errorMessage}</span>}
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] rounded-3xl bg-brand-light/20 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((p: ProductRecord) => (
                <div key={p.id} className="group relative rounded-3xl border border-brand-light bg-white p-3 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="aspect-square w-full overflow-hidden rounded-2xl bg-brand-off-white">
                    {p.mainImage ? (
                      <img src={p.mainImage} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">📦</div>
                    )}
                  </div>
                  <div className="mt-4 space-y-1 px-1">
                    <p className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">{p.category}</p>
                    <h3 className="truncate font-bold text-brand-dark">{p.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-brand-green">₹{p.price}</p>
                      <p className="text-[10px] text-brand-teal">Qty: {p.stock}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="flex-1 rounded-full bg-brand-teal py-2 text-[10px] font-bold text-white transition hover:bg-brand-dark" onClick={() => startEdit(p)}>EDIT</button>
                    <button type="button" className="flex-1 rounded-full border border-red-200 py-2 text-[10px] font-bold text-red-500 transition hover:bg-red-50" onClick={() => handleDelete(p.id)}>DELETE</button>
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

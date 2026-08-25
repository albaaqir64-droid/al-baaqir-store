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
            <label className="block text-sm font-medium">Gender</label>
            <select className="mt-1 w-full rounded border px-3 py-2" value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
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

          <div>
            <label className="block text-sm font-medium mb-2">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((size) => (
                <label key={size} className={`flex items-center justify-center px-3 py-1 rounded-full border text-sm cursor-pointer transition ${
                  form.sizes.includes(size) ? 'bg-emerald text-white border-emerald' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald'
                }`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.sizes.includes(size)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField('sizes', [...form.sizes, size]);
                      } else {
                        updateField('sizes', form.sizes.filter(s => s !== size));
                      }
                    }}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Available Colors</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_COLORS.map((color) => (
                <label key={color.name} className={`group relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 cursor-pointer transition ${
                  form.colors.includes(color.hex) ? 'ring-2 ring-emerald ring-offset-2' : ''
                }`} style={{ backgroundColor: color.hex }} title={color.name}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.colors.includes(color.hex)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateField('colors', [...form.colors, color.hex]);
                      } else {
                        updateField('colors', form.colors.filter(c => c !== color.hex));
                      }
                    }}
                  />
                  {form.colors.includes(color.hex) && (
                    <span className={`text-[10px] ${color.hex === '#FFFFFF' || color.hex === '#FFFF00' || color.hex === '#F5F5DC' ? 'text-black' : 'text-white'}`}>✓</span>
                  )}
                </label>
              ))}
            </div>
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

          {(form.sizes.length > 0 || form.colors.length > 0) && (
            <div className="md:col-span-2 rounded-xl border border-emerald/20 bg-white p-4">
              <h3 className="mb-3 font-semibold text-emerald-900">Variant Inventory Management</h3>
              <p className="mb-4 text-xs text-slate-500">Set specific stock for each combination. If left empty or 0, the main "Stock" field above will be used as fallback.</p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {form.sizes.length > 0 && form.colors.length > 0 ? (
                  form.sizes.map(size => (
                    form.colors.map(colorHex => {
                      const colorName = PREDEFINED_COLORS.find(c => c.hex === colorHex)?.name || colorHex;
                      const key = `${size}_${colorHex}`;
                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600">{size} / {colorName}</label>
                          <input
                            type="number"
                            placeholder="Qty"
                            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                            value={form.variantStock[key] || ""}
                            onChange={(e) => {
                              const next = { ...form.variantStock, [key]: e.target.value };
                              updateField('variantStock', next);
                            }}
                          />
                        </div>
                      );
                    })
                  ))
                ) : form.sizes.length > 0 ? (
                  form.sizes.map(size => {
                    const key = `size_${size}`;
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">Size: {size}</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                          value={form.variantStock[key] || ""}
                          onChange={(e) => {
                            const next = { ...form.variantStock, [key]: e.target.value };
                            updateField('variantStock', next);
                          }}
                        />
                      </div>
                    );
                  })
                ) : (
                  form.colors.map(colorHex => {
                    const colorName = PREDEFINED_COLORS.find(c => c.hex === colorHex)?.name || colorHex;
                    const key = `color_${colorHex}`;
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600">Color: {colorName}</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm"
                          value={form.variantStock[key] || ""}
                          onChange={(e) => {
                            const next = { ...form.variantStock, [key]: e.target.value };
                            updateField('variantStock', next);
                          }}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

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

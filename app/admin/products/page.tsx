"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Package,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  ArrowUpRight
} from "lucide-react";
import { readApiJson } from "../../lib/api/client";
import type { ProductRecord } from "../../lib/productTypes";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const parsed = await readApiJson<ProductRecord[]>(res);
      if (parsed.ok) {
        setProducts(Array.isArray(parsed.data) ? parsed.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const parsed = await readApiJson<{ success: boolean }>(res);
      if (parsed.ok && parsed.data?.success) {
        void fetchProducts();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error("Delete product error:", error);
      alert("Error deleting product");
    }
  }

  useEffect(() => {
    void fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.id || '').includes(search);
      const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats);
  }, [products]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.active !== false).length;
    const lowStock = products.filter(p => (Number(p.stock) || 0) < 5).length;
    const outOfStock = products.filter(p => (Number(p.stock) || 0) === 0).length;
    return { total, active, lowStock, outOfStock };
  }, [products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your store's luxury collection and stock.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchProducts()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/admin/products/new" className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            <Plus size={18} />
            Add New Product
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ProductStatCard label="Total Items" count={stats.total} icon={Package} color="slate" />
        <ProductStatCard label="Active" count={stats.active} icon={CheckCircle2} color="emerald" />
        <ProductStatCard label="Low Stock" count={stats.lowStock} icon={AlertCircle} color="amber" alert={stats.lowStock > 0} />
        <ProductStatCard label="Out of Stock" count={stats.outOfStock} icon={XCircle} color="rose" alert={stats.outOfStock > 0} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU, category..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none transition-all"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-6"><div className="h-12 bg-slate-100 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : pagedProducts.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">No products found.</td></tr>
              ) : (
                pagedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                          {p.mainImage ? <img src={p.mainImage} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-full w-full p-3 text-slate-200" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{p.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">ID: {p.id?.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{p.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">₹{p.price?.toLocaleString()}</span>
                        {Number(p.discountPercent) > 0 && <span className="text-[10px] font-bold text-emerald-600">-{p.discountPercent}%</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className={`text-sm font-bold ${Number(p.stock) < 5 ? 'text-amber-600' : 'text-slate-900'}`}>{p.stock}</span>
                         {Number(p.stock) < 5 && <TrendingDown size={14} className="text-amber-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {p.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Link href={`/admin/products/edit/${p.id}`} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200">
                           <Edit3 size={18} />
                         </Link>
                         <button
                            onClick={() => deleteProduct(p.id!)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                         >
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-500">Page {page} of {Math.ceil(filteredProducts.length / PAGE_SIZE) || 1}</p>
           <div className="flex gap-2">
             <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
             >
               <ChevronLeft size={18} />
             </button>
             <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * PAGE_SIZE >= filteredProducts.length}
                className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors"
             >
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function ProductStatCard({ label, count, icon: Icon, color, alert }: any) {
  const colors: any = {
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className={`bg-white rounded-2xl border ${alert ? "border-rose-200 shadow-rose-50" : "border-slate-200"} p-5 shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{count}</p>
        </div>
      </div>
    </div>
  );
}

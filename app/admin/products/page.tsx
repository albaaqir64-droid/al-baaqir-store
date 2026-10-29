'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminIdToken } from '@/app/lib/auth';
import { adminFetch } from '@/app/lib/adminFetch';
import { readApiJson } from '@/app/lib/api/client';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  mainImage?: string;
  images?: string[];
  galleryImages?: string[];
  description?: string;
}

async function loadProducts(): Promise<Product[]> {
  const response = await adminFetch('/api/admin/products');
  const result = await readApiJson<Product[]>(response);
  if (!result.ok || !Array.isArray(result.data)) {
    throw new Error(result.error || 'The products API returned an invalid response.');
  }
  return result.data;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'men',
    image: '',
    description: ''
  });

  const fetchProducts = useCallback(async () => {
    try {
      const data = await loadProducts();
      setError('');
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setError(error instanceof Error ? error.message : 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadProducts()
      .then((data) => {
        if (!active) return;
        setError('');
        setProducts(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Error fetching products:', error);
        setProducts([]);
        setError(error instanceof Error ? error.message : 'Could not load products.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getAdminIdToken();

    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price)
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ name: '', price: '', category: 'men', image: '', description: '' });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = await getAdminIdToken();
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      image: product.mainImage || product.image || product.galleryImages?.[0] || product.images?.[0] || '',
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: '', category: 'men', image: '', description: '' });
            setIsModalOpen(true);
          }}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          Add Product
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm border group relative">
            <div className="aspect-square relative mb-4">
              {(product.mainImage || product.image || product.galleryImages?.[0] || product.images?.[0]) ? (
                <Image
                  src={(product.mainImage || product.image || product.galleryImages?.[0] || product.images?.[0]) ?? ''}
                  alt={product.name}
                  fill
                  className="object-cover rounded"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded bg-gray-100 text-sm text-gray-500">
                  No image available
                </div>
              )}
            </div>
            <h3 className="font-bold">{product.name}</h3>
            <p className="text-gray-600">₹{product.price}</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest">{product.category}</p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => openEditModal(product)}
                className="flex-1 bg-gray-100 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="flex-1 bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full border p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border p-2 rounded"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="karachi-suit">Karachi Suit</option>
                    <option value="kurti">Kurti</option>
                    <option value="bags">Bags</option>
                    <option value="belts">Belts</option>
                    <option value="jhumka">Jhumka</option>
                    <option value="earrings">Earrings</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border p-2 rounded h-24"
                ></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black text-white py-2 rounded"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

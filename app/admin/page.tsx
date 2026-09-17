'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/app/lib/firebase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const ordersRes = await fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const productsRes = await fetch('/api/admin/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const orders = await ordersRes.json();
        const products = await productsRes.json();

        const revenue = orders.reduce((acc: number, order: any) =>
          order.status !== 'cancelled' ? acc + order.total : acc, 0);

        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o: any) => o.status === 'pending').length,
          totalRevenue: revenue,
          totalProducts: products.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Orders</p>
          <p className="text-3xl font-bold mt-1">{stats.totalOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Pending Orders</p>
          <p className="text-3xl font-bold mt-1 text-orange-600">{stats.pendingOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Products</p>
          <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
        </div>
      </div>

      <div className="bg-black text-white p-8 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Welcome to Al Baaqir Admin</h3>
        <p className="text-gray-400">Manage your luxury lifestyle brand with ease. Monitor sales, update your collection, and track customer inquiries all in one place.</p>
      </div>
    </div>
  );
}

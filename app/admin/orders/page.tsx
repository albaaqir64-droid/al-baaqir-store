'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/app/lib/adminFetch';
import { readApiJson } from '@/app/lib/api/client';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  items: unknown[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

async function loadOrders(): Promise<Order[]> {
  const response = await adminFetch('/api/admin/orders');
  const result = await readApiJson<Order[]>(response);
  if (!result.ok || !Array.isArray(result.data)) {
    throw new Error(result.error || 'The orders API returned an invalid response.');
  }
  return result.data;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await loadOrders();
      setError('');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setError(error instanceof Error ? error.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadOrders()
      .then((data) => {
        if (!active) return;
        setError('');
        setOrders(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Error fetching orders:', error);
        setOrders([]);
        setError(error instanceof Error ? error.message : 'Could not load orders.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await readApiJson(response);
      if (!result.ok) throw new Error(result.error || 'Could not update order status.');
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error instanceof Error ? error.message : 'Could not update order status.');
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orders</h2>
      {error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full overflow-hidden rounded-lg border bg-white">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">#{order.id.slice(0, 8)}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.name}</div>
                  <div className="text-sm text-gray-500">{order.phone}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">₹{order.total}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <select
                    value={order.status}
                    onChange={(event) => void updateStatus(order.id, event.target.value as OrderStatus)}
                    className="rounded border p-1 text-xs"
                    aria-label={`Update status for order ${order.id}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {!error && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

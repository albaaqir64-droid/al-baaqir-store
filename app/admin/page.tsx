'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CircleAlert,
  Clock3,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { adminFetch } from '@/app/lib/adminFetch';
import { readApiJson } from '@/app/lib/api/client';

interface DashboardOrder {
  id: string;
  name?: string;
  customerName?: string;
  phone?: string;
  total?: number;
  status?: string;
  createdAt?: unknown;
  shipping?: { name?: string };
}

interface DashboardData {
  orders: DashboardOrder[];
  products: { id: string }[];
}

async function loadDashboardData(): Promise<DashboardData> {
  const [ordersResponse, productsResponse] = await Promise.all([
    adminFetch('/api/admin/orders'),
    adminFetch('/api/admin/products'),
  ]);
  const [ordersResult, productsResult] = await Promise.all([
    readApiJson<DashboardOrder[]>(ordersResponse),
    readApiJson<{ id: string }[]>(productsResponse),
  ]);

  if (!ordersResult.ok || !Array.isArray(ordersResult.data)) {
    throw new Error(ordersResult.error || 'Could not load orders for the dashboard.');
  }
  if (!productsResult.ok || !Array.isArray(productsResult.data)) {
    throw new Error(productsResult.error || 'Could not load products for the dashboard.');
  }

  return { orders: ordersResult.data, products: productsResult.data };
}

function formatOrderDate(value: unknown) {
  let date: Date;
  if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else if (value && typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
    date = new Date(value.seconds * 1000);
  } else {
    return 'Date unavailable';
  }

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

const quickLinks = [
  { label: 'Add a product', detail: 'Grow your catalog', href: '/admin/products/new', icon: Plus, tone: 'bg-amber-50 text-amber-800' },
  { label: 'Manage inventory', detail: 'Review stock levels', href: '/admin/inventory', icon: Boxes, tone: 'bg-sky-50 text-sky-800' },
  { label: 'View analytics', detail: 'Explore store activity', href: '/admin/analytics', icon: BarChart3, tone: 'bg-violet-50 text-violet-800' },
];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadDashboardData();
      setData(result);
      setError('');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadDashboardData()
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Could not load dashboard data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const orders = data?.orders ?? [];
  const activeOrders = orders.filter((order) => order.status !== 'cancelled');
  const revenue = activeOrders.reduce((total, order) => {
    const amount = Number(order.total);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const processingOrders = orders.filter((order) => ['processing', 'confirmed', 'packed'].includes(order.status || '')).length;
  const shippedOrders = orders.filter((order) => ['shipped', 'out_for_delivery'].includes(order.status || '')).length;
  const recentOrders = orders.slice(0, 5);
  const statusCounts = [
    { label: 'Pending', count: pendingOrders, color: 'bg-amber-500' },
    { label: 'Processing', count: processingOrders, color: 'bg-sky-500' },
    { label: 'Shipped', count: shippedOrders, color: 'bg-violet-500' },
    { label: 'Delivered', count: orders.filter((order) => order.status === 'delivered').length, color: 'bg-emerald-500' },
  ];

  const metrics = [
    {
      label: 'Total revenue',
      value: formatCurrency(revenue),
      helper: 'From non-cancelled orders',
      icon: IndianRupee,
      iconTone: 'bg-emerald-50 text-emerald-800',
      trend: 'All time',
      trendIcon: ArrowUpRight,
    },
    {
      label: 'Total orders',
      value: orders.length.toLocaleString('en-IN'),
      helper: 'Orders placed in your store',
      icon: ShoppingBag,
      iconTone: 'bg-sky-50 text-sky-800',
      trend: 'All time',
      trendIcon: ArrowUpRight,
    },
    {
      label: 'Needs attention',
      value: pendingOrders.toLocaleString('en-IN'),
      helper: 'Pending orders to review',
      icon: CircleAlert,
      iconTone: 'bg-amber-50 text-amber-800',
      trend: pendingOrders > 0 ? 'Review now' : 'All caught up',
      trendIcon: pendingOrders > 0 ? ArrowUpRight : ArrowDownRight,
    },
    {
      label: 'Active products',
      value: (data?.products.length ?? 0).toLocaleString('en-IN'),
      helper: 'Products in your catalog',
      icon: Package,
      iconTone: 'bg-violet-50 text-violet-800',
      trend: 'View catalog',
      trendIcon: ArrowUpRight,
    },
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] bg-emerald-950 px-6 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-10 -top-32 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
              <Sparkles size={13} className="text-amber-300" />
              Your store at a glance
            </span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/75">
              Keep your orders moving, your catalog fresh, and your customers coming back.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-xs font-bold text-emerald-950 shadow-lg shadow-black/10 transition hover:bg-amber-200"
          >
            <Plus size={16} />
            Add product
          </Link>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} className="font-semibold underline underline-offset-4">
            Try again
          </button>
        </div>
      )}

      <section aria-label="Store metrics" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trendIcon;
          return (
            <article key={metric.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconTone}`}>
                  <Icon size={19} strokeWidth={1.8} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                  <TrendIcon size={12} />
                  {metric.trend}
                </span>
              </div>
              <p className="mt-5 text-xs font-medium text-slate-500">{metric.label}</p>
              <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900">
                {loading && !data ? <span className="inline-block h-7 w-24 animate-pulse rounded-md bg-slate-100" /> : metric.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{metric.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent orders</h3>
              <p className="mt-1 text-[11px] text-slate-500">The latest activity from your store</p>
            </div>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950">
              All orders <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-5 py-3 sm:px-6">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right sm:px-6">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && !data ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 5 }, (_, cell) => (
                        <td key={cell} className="px-5 py-4 sm:px-6"><span className="block h-3 w-16 animate-pulse rounded bg-slate-100" /></td>
                      ))}
                    </tr>
                  ))
                ) : recentOrders.length > 0 ? recentOrders.map((order) => {
                  const status = order.status || 'pending';
                  const statusStyle = status === 'delivered'
                    ? 'bg-emerald-50 text-emerald-800'
                    : status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700'
                      : status === 'pending'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-sky-50 text-sky-800';

                  return (
                    <tr key={order.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-xs font-semibold text-slate-800 sm:px-6">#{order.id.slice(0, 8)}</td>
                      <td className="max-w-40 truncate px-5 py-4 text-xs text-slate-600">{order.customerName || order.name || order.shipping?.name || 'Guest customer'}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatOrderDate(order.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusStyle}`}>
                          {status.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold text-slate-800 sm:px-6">
                        {formatCurrency(Number(order.total) || 0)}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <ShoppingBag size={18} />
                      </span>
                      <p className="mt-3 text-xs font-semibold text-slate-700">No orders just yet</p>
                      <p className="mt-1 text-[11px] text-slate-500">New orders will show up here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-5">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Order pipeline</h3>
                <p className="mt-1 text-[11px] text-slate-500">A quick look at fulfillment</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Truck size={17} />
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {statusCounts.map((status) => {
                const percentage = orders.length ? (status.count / orders.length) * 100 : 0;
                return (
                  <div key={status.label}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-slate-600">{status.label}</span>
                      <span className="font-semibold text-slate-800">{loading && !data ? '—' : status.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${status.color}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/orders" className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900">
              Open order management <ArrowRight size={15} />
            </Link>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
                <p className="mt-1 text-[11px] text-slate-500">Shortcuts to everyday tasks</p>
              </div>
              <Clock3 size={17} className="text-slate-400" />
            </div>
            <div className="space-y-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-slate-100 hover:bg-slate-50">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-slate-800">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">{item.detail}</span>
                    </span>
                    <ArrowRight size={14} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                  </Link>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

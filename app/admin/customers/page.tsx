"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  ShoppingBag,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  UserPlus,
  RefreshCw
} from "lucide-react";
import { fetchCustomers, CustomerRecord } from "../../lib/customers";
import { fetchOrders } from "../../lib/orders";

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [page, setPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, ordersData] = await Promise.all([
        fetchCustomers(100),
        fetchOrders()
      ]);

      // Enhance user data with order stats
      const enhanced = usersData.map(user => {
        const userOrders = ordersData.filter(o => o.customerId === user.id);
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        return {
          ...user,
          totalOrders: userOrders.length,
          totalSpent: totalSpent,
          lastOrderDate: userOrders.length > 0 ?
            (userOrders[0].createdAt?.toDate ?
              new Date(userOrders[0].createdAt.toDate()).toLocaleDateString() :
              "Recent") : "-"
        };
      });

      setCustomers(enhanced);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    );
  }, [customers, search]);

  const getStatus = (c: CustomerRecord) => {
    if ((c.totalOrders || 0) > 3) return { label: 'VIP', color: 'bg-purple-100 text-purple-700' };
    if ((c.totalOrders || 0) > 0) return { label: 'Active', color: 'bg-emerald-100 text-emerald-700' };
    return { label: 'New', color: 'bg-blue-100 text-blue-700' };
  };

  const exportCustomers = () => {
    if (filteredCustomers.length === 0) return;

    const headers = ["Name", "Email", "Phone", "Status", "Total Orders", "Total Spent", "Last Order"];
    const rows = filteredCustomers.map(c => {
      const status = getStatus(c);
      return [
        c.name,
        c.email,
        c.phone || '',
        status.label,
        c.totalOrders || 0,
        c.totalSpent || 0,
        c.lastOrderDate || ''
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(value => {
        const str = String(value ?? "");
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `baaqir-customers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage your customer database and purchase history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={exportCustomers}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filteredCustomers.length} Customers Found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Orders</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Spent</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6"><div className="h-10 bg-slate-50 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No customers found.</td></tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const status = getStatus(customer);
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{customer.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{customer.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <ShoppingBag size={14} className="text-slate-400" />
                          {customer.totalOrders}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">₹{customer.totalSpent?.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-500">Page {page} of 1</p>
           <div className="flex gap-2">
             <button disabled className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors">
               <ChevronLeft size={18} />
             </button>
             <button disabled className="p-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:bg-slate-50 transition-colors">
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

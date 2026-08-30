"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Download,
  Eye,
  Printer,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar
} from "lucide-react";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");

  const invoices = [
    { id: "INV-2024-001", orderId: "ORD-9921", customer: "Rahul Sharma", date: "2024-03-22", amount: 12500, status: "paid" },
    { id: "INV-2024-002", orderId: "ORD-9918", customer: "Priya Patel", date: "2024-03-21", amount: 4800, status: "paid" },
    { id: "INV-2024-003", orderId: "ORD-9915", customer: "Amit Singh", date: "2024-03-21", amount: 2100, status: "pending" },
    { id: "INV-2024-004", orderId: "ORD-9910", customer: "Sneha Reddy", date: "2024-03-20", amount: 24000, status: "paid" },
    { id: "INV-2024-005", orderId: "ORD-9905", customer: "Vikram Malhotra", date: "2024-03-19", amount: 15600, status: "cancelled" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">Manage, download, and track GST-compliant invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={18} />
            March 2024
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            <Download size={18} />
            Bulk Export
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
              placeholder="Search by invoice # or order ID..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">
              <Filter size={18} />
              Filter Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Invoice</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <FileText size={16} />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-slate-900">{inv.id}</span>
                         <span className="text-[10px] text-slate-400 font-bold">{inv.date}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-slate-600">
                    {inv.orderId}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {inv.customer}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">
                    ₹{inv.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200">
                         <Eye size={16} />
                       </button>
                       <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200">
                         <Download size={16} />
                       </button>
                       <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200">
                         <Printer size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
           <p className="text-xs font-bold text-slate-500">Showing 5 of 128 invoices</p>
           <div className="flex gap-2">
             <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronLeft size={18} /></button>
             <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50"><ChevronRight size={18} /></button>
           </div>
        </div>
      </div>
    </div>
  );
}

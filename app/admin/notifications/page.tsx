"use client";

import { useState } from "react";
import {
  Bell,
  ShoppingBag,
  AlertCircle,
  Package,
  CheckCircle2,
  Clock,
  MoreVertical,
  Search,
  Trash2,
  Check
} from "lucide-react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");

  const notifications = [
    {
      id: 1,
      type: "order",
      title: "New Order Received",
      message: "Order #ORD-9921 from Rahul Sharma for ₹12,500 is pending confirmation.",
      time: "2 minutes ago",
      read: false,
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-50"
    },
    {
      id: 2,
      type: "stock",
      title: "Low Stock Alert",
      message: "Premium Silk Scarf (Midnight Blue) has only 3 units left in stock.",
      time: "1 hour ago",
      read: false,
      icon: Package,
      color: "text-amber-600 bg-amber-50"
    },
    {
      id: 3,
      type: "shipping",
      title: "Shiprocket Sync Error",
      message: "Failed to sync Order #ORD-9905 to Shiprocket. Please retry manually.",
      time: "3 hours ago",
      read: true,
      icon: AlertCircle,
      color: "text-rose-600 bg-rose-50"
    },
    {
      id: 4,
      type: "system",
      title: "Payout Successful",
      message: "A payout of ₹84,200 has been processed to your bank account.",
      time: "Yesterday",
      read: true,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      id: 5,
      type: "order",
      title: "Return Requested",
      message: "Priya Patel has requested a return for Order #ORD-9880.",
      time: "2 days ago",
      read: true,
      icon: Clock,
      color: "text-indigo-600 bg-indigo-50"
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">Stay updated with your store's latest activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Check size={18} />
            Mark all as read
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-100 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors shadow-sm">
            <Trash2 size={18} />
            Clear all
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['all', 'orders', 'stock', 'shipping', 'system'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-50">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors relative group ${!n.read ? 'bg-slate-50/30' : ''}`}
              >
                {!n.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900"></div>
                )}

                <div className={`h-12 w-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${n.color}`}>
                  <Icon size={24} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`text-sm font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                     <button className="text-xs font-bold text-slate-900 hover:underline">View Details</button>
                     {!n.read && <button className="text-xs font-bold text-slate-400 hover:text-slate-900">Mark as read</button>}
                  </div>
                </div>

                <button className="p-2 text-slate-300 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                   <MoreVertical size={18} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-6 text-center border-t border-slate-50">
           <button className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
             View older notifications
           </button>
        </div>
      </div>
    </div>
  );
}

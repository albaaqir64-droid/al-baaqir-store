"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Truck,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    subItems: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "New", href: "/admin/orders?status=pending" },
      { label: "Ready to Ship", href: "/admin/orders?status=packed" },
      { label: "Shipped", href: "/admin/orders?status=shipped" },
    ]
  },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Shipping", href: "/admin/shipping", icon: Truck },
  { label: "Invoices", href: "/admin/invoices", icon: FileText },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

const SECONDARY_MENU = [
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 -translate-x-full">
      <div className="p-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">Baaqir Lifestyle</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Seller Panel</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        <nav className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <div key={item.label} className="space-y-1">
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"} />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                  {item.subItems && <ChevronRight size={14} className={isActive ? "text-white/50" : "text-slate-300"} />}
                </Link>
              </div>
            );
          })}
        </nav>

        <nav className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Support</p>
          {SECONDARY_MENU.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-50">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200">
          <LogOut size={20} />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
}

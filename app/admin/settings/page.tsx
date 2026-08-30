"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Lock,
  Truck,
  CreditCard,
  Store,
  Save,
  Globe,
  Mail,
  Smartphone
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const TABS = [
    { id: "general", label: "Store Info", icon: Store },
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your store preferences, account details, and integrations.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <aside className="lg:w-64 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Store Profile</h2>
                  <p className="text-xs text-slate-500 mt-1">This information will be displayed on your storefront and invoices.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Store Name</label>
                      <input type="text" defaultValue="Baaqir Lifestyle" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Store Email</label>
                      <input type="email" defaultValue="hello@albaaqir.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                    <textarea rows={3} defaultValue="Modern luxury clothing for the discerning individual." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Business Address</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Address Line</label>
                    <input type="text" defaultValue="123 Luxury Lane, Business District" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">City</label>
                      <input type="text" defaultValue="Mumbai" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">State</label>
                      <input type="text" defaultValue="Maharashtra" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PIN Code</label>
                      <input type="text" defaultValue="400001" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Order Alerts</h2>
                  <p className="text-xs text-slate-500 mt-1">Control how you get notified about new activity.</p>
                </div>
                <div className="p-6 space-y-6">
                  <NotificationToggle
                    title="New Order"
                    desc="Get notified as soon as a customer places an order."
                    email={true}
                    push={true}
                  />
                  <NotificationToggle
                    title="Order Cancelled"
                    desc="Alert when an order is cancelled by the user."
                    email={true}
                    push={false}
                  />
                  <NotificationToggle
                    title="Out of Stock"
                    desc="Receive alerts when products are low on inventory."
                    email={true}
                    push={true}
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === "shipping" && (
             <div className="space-y-6">
               <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900">Shiprocket Integration</h2>
                  <p className="text-xs text-slate-500 mt-1">API credentials for logistics automation.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Email</label>
                    <input type="email" defaultValue="logistics@albaaqir.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Token</label>
                    <input type="password" value="••••••••••••••••••••••••" readOnly className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                  </div>
                  <div className="mt-4 p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-white">
                           <Globe size={16} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-900">Connected to Shiprocket</p>
                           <p className="text-[10px] text-sky-700 font-semibold">Automatic sync enabled</p>
                        </div>
                     </div>
                     <button className="text-xs font-bold text-sky-600 hover:underline">Refresh Token</button>
                  </div>
                </div>
              </section>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({ title, desc, email, push }: any) {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-slate-50 last:pb-0 last:border-0">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm">{desc}</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Mail size={16} className={email ? "text-indigo-500" : "text-slate-300"} />
          <input type="checkbox" defaultChecked={email} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
        </div>
        <div className="flex items-center gap-2">
          <Smartphone size={16} className={push ? "text-indigo-500" : "text-slate-300"} />
          <input type="checkbox" defaultChecked={push} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
        </div>
      </div>
    </div>
  );
}

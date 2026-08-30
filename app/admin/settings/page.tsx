"use client";

import { useState, useEffect } from "react";
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
  Smartphone,
  History,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { readApiJson } from "../../lib/api/client";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const TABS = [
    { id: "general", label: "Store Info", icon: Store },
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "logs", label: "Webhook Logs", icon: History },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
  ];

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/webhook-logs");
      const parsed = await readApiJson<{ logs: any[] }>(res);
      if (parsed.ok && parsed.data) setLogs(parsed.data.logs);
    } catch (err) {
      console.error("Logs fetch failed:", err);
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab]);

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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Webhook URL (Production)</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value="https://albaaqir.com/api/shiprocket/webhook" className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none transition-all" />
                      <button
                        onClick={() => navigator.clipboard.writeText("https://albaaqir.com/api/shiprocket/webhook")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Configure this in Shiprocket Panel → Settings → API → Webhooks</p>
                  </div>
                  <div className="space-y-2 pt-2">
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

          {activeTab === "logs" && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">Shiprocket Webhook History</h2>
                    <p className="text-xs text-slate-500 mt-1">Real-time status updates received from Shiprocket.</p>
                  </div>
                  <button
                    onClick={fetchLogs}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
                    disabled={loadingLogs}
                  >
                    <History size={18} className={loadingLogs ? "animate-spin" : ""} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shiprocket Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Result</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                            {loadingLogs ? "Loading events..." : "No webhook events recorded yet."}
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-xs font-medium text-slate-900">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-900">#{log.channelOrderId || log.shiprocketOrderId || "N/A"}</p>
                              <p className="text-[10px] text-slate-400">{log.awb || "No AWB"}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                log.currentStatus?.includes('delivered') ? 'bg-emerald-50 text-emerald-600' :
                                log.currentStatus?.includes('rto') || log.currentStatus?.includes('cancel') || log.currentStatus?.includes('return') ? 'bg-rose-50 text-rose-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                {log.currentStatus || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {log.status === "SUCCESS" ? (
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                ) : (
                                  <AlertCircle size={14} className={log.status === "DUPLICATE" ? "text-amber-500" : "text-rose-500"} />
                                )}
                                <span className="text-[10px] font-bold text-slate-600">{log.status}</span>
                              </div>
                              {log.restockDone && (
                                <p className="text-[9px] text-emerald-600 font-bold mt-0.5">Inventory Restocked</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => alert(JSON.stringify(log.payload, null, 2))}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-900"
                              >
                                Raw Data
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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

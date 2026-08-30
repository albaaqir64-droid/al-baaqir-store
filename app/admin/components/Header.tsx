"use client";

import {
  Search,
  Bell,
  User,
  Menu,
  ChevronDown,
  Globe
} from "lucide-react";

export default function Header() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-8 flex-1">
        <button className="lg:hidden text-slate-600">
          <Menu size={24} />
        </button>

        <div className="max-w-md w-full relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search orders, products, customers..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-colors relative">
          <Globe size={20} />
        </button>

        <button className="h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

        <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none">Md Munna</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter font-semibold">Administrator</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <User size={20} />
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
}

"use client";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AdminGuard from "../components/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}

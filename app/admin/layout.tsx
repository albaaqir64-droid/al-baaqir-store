'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Verify admin status via our API
          const token = await user.getIdToken();
          const response = await fetch('/api/admin/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();
          if (data.isAdmin) {
            setIsAdmin(true);
          } else {
            router.push('/admin/login');
          }
        } catch (error) {
          console.error('Error verifying admin:', error);
          router.push('/admin/login');
        }
      } else if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black text-white p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-widest uppercase">Al Baaqir</h1>
          <p className="text-gray-400 text-xs">Admin Dashboard</p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/admin"
            className={`block px-4 py-2 rounded transition-colors ${pathname === '/admin' ? 'bg-white text-black' : 'hover:bg-gray-800'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className={`block px-4 py-2 rounded transition-colors ${pathname.includes('/products') ? 'bg-white text-black' : 'hover:bg-gray-800'}`}
          >
            Products
          </Link>
          <Link
            href="/admin/orders"
            className={`block px-4 py-2 rounded transition-colors ${pathname.includes('/orders') ? 'bg-white text-black' : 'hover:bg-gray-800'}`}
          >
            Orders
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded text-red-400 hover:bg-red-900/20 transition-colors mt-8"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

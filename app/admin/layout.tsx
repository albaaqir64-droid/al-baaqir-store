'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  BarChart3,
  Bell,
  Boxes,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { auth } from '@/app/lib/firebase';

const navigation = [
  {
    label: 'Workspace',
    links: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Inventory', href: '/admin/inventory', icon: Boxes },
    ],
  },
  {
    label: 'Manage',
    links: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Shipping', href: '/admin/shipping', icon: Truck },
      { label: 'Invoices', href: '/admin/invoices', icon: FileText },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Preferences',
    links: [
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

function getPageTitle(pathname: string) {
  const links = navigation.flatMap((section) => section.links);
  return links.find((link) => link.href === pathname)?.label
    ?? links.find((link) => link.href !== '/admin' && pathname.startsWith(`${link.href}/`))?.label
    ?? 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser || currentUser.uid !== user.uid) {
            throw new Error('Signed-in Firebase user changed during admin verification.');
          }

          await currentUser.getIdToken(true);
          const idTokenResult = await currentUser.getIdTokenResult(true);
          if (idTokenResult.claims.admin !== true) {
            setIsAdmin(false);
            if (pathname !== '/admin/login') router.push('/admin/login');
            setLoading(false);
            return;
          }

          const response = await fetch('/api/admin/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idTokenResult.token }),
          });
          const data = await response.json();

          if (data.isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            router.push('/admin/login');
          }
        } catch (error) {
          console.error('Error verifying admin:', error);
          setIsAdmin(false);
          router.push('/admin/login');
        }
      } else {
        setIsAdmin(false);
        if (pathname !== '/admin/login') router.push('/admin/login');
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900 text-lg font-bold text-white shadow-lg shadow-emerald-950/15">
            B
          </div>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-800" />
          </div>
          <span className="text-xs font-medium tracking-wide text-slate-500">Preparing your workspace</span>
        </div>
      </div>
    );
  }

  if (pathname === '/admin/login') return <>{children}</>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-slate-900">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:translate-x-0 ${
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-[84px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileNavOpen(false)}>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900 text-lg font-bold text-white shadow-md shadow-emerald-950/10">
              B
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-slate-900">Baaqir Lifestyle</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Store workspace</span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
          {navigation.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.links.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-emerald-900 text-white shadow-sm shadow-emerald-950/10'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-emerald-100' : 'text-slate-400 group-hover:text-slate-700'} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
              {auth.currentUser?.email?.slice(0, 1).toUpperCase() || 'A'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-slate-800">Store administrator</span>
              <span className="block truncate text-[11px] text-slate-500">{auth.currentUser?.email || 'Admin account'}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">Al Baaqir / Admin</p>
              <h1 className="truncate text-base font-semibold text-slate-900">{getPageTitle(pathname)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 sm:inline-flex">
              <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Store is online
            </span>
            <Link
              href="/admin/notifications"
              aria-label="View notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Bell size={17} />
            </Link>
            <span className="hidden h-8 w-px bg-slate-200 sm:block" />
            <span className="hidden max-w-40 truncate text-xs font-medium text-slate-600 md:block">
              {auth.currentUser?.email || 'Administrator'}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-9">
          {children}
        </main>
      </div>
    </div>
  );
}

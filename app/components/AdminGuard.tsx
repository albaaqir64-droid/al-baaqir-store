'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        if (data.isAdmin) {
          setAuthorized(true);
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth verification failed', error);
        router.push('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-lg font-bold tracking-widest uppercase">Verifying Admin...</div>
      </div>
    );
  }

  return <>{children}</>;
}

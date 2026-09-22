'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { Spinner } from '@/components/ui/Spinner';
import { AppShellContent } from '@/components/layout/AppShellContent';

/**
 * The auth guard lives here (no useSearchParams — safe to prerender).
 * Everything that reads useSearchParams (badges, nav) is isolated in
 * AppShellContent and Suspense-wrapped, per Next.js's requirement that
 * any useSearchParams() call have a Suspense boundary above it.
 */
export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) router.replace('/login');
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-gold" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="text-gold" />
        </div>
      }
    >
      <AppShellContent user={user}>{children}</AppShellContent>
    </Suspense>
  );
}

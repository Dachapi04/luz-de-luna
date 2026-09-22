'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { landingPathFor } from '@/domain/permissions';
import { Spinner } from '@/components/ui/Spinner';

export default function RootPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    router.replace(user ? landingPathFor(user.rol) : '/login');
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="text-gold" />
    </div>
  );
}

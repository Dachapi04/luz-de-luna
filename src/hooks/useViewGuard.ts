'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { canAccessView, landingPathFor, type ViewKey } from '@/domain/permissions';

/** Redirects away from views the current role isn't allowed to see (deep-link guard). */
export function useViewGuard(view: ViewKey) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (!canAccessView(user.rol, view)) router.replace(landingPathFor(user.rol));
  }, [user, view, router]);

  return user;
}

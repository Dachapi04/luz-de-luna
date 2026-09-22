'use client';

import { apiFetch } from '@/lib/api/client';
import type { CierreCaja } from '@/domain/types';

export const cierresService = {
  guardar: (fecha: string) =>
    apiFetch<CierreCaja>('/api/cierres', { method: 'POST', body: JSON.stringify({ fecha }) }),
};

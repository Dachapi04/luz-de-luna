'use client';

import { apiFetch } from '@/lib/api/client';
import type { Compra } from '@/domain/types';

export interface CompraInput {
  fecha?: string;
  concepto: string;
  categoria: Compra['categoria'];
  cantidad?: number | null;
  unidad?: string | null;
  total: number;
}

export const comprasService = {
  crear: (input: CompraInput) =>
    apiFetch<{ compra: Compra; insumoActualizado: string | null }>('/api/compras', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  eliminar: (id: string) => apiFetch<void>(`/api/compras/${id}`, { method: 'DELETE' }),
};

'use client';

import { apiFetch } from '@/lib/api/client';
import type { Producto } from '@/domain/types';

export type ProductoInput = Omit<Producto, 'id'>;

export const productosService = {
  crear: (input: ProductoInput) =>
    apiFetch<Producto>('/api/productos', { method: 'POST', body: JSON.stringify(input) }),

  editar: (id: string, input: ProductoInput) =>
    apiFetch<Producto>(`/api/productos/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  eliminar: (id: string) => apiFetch<void>(`/api/productos/${id}`, { method: 'DELETE' }),

  ajustarStock: (id: string, delta: number) =>
    apiFetch<void>(`/api/productos/${id}/ajuste-stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    }),
};

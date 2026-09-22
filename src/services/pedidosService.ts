'use client';

import { apiFetch } from '@/lib/api/client';
import type { Destino, MetodoPago, Pedido } from '@/domain/types';

export interface CartLine {
  productoId: string;
  cantidad: number;
  detalle: string;
  destino: Destino;
}

export const pedidosService = {
  enviar: (mesa: string, cart: CartLine[]) =>
    apiFetch<Pedido>('/api/pedidos', { method: 'POST', body: JSON.stringify({ mesa, cart }) }),

  quitarItem: (pedidoId: string, itemId: string) =>
    apiFetch<void>(`/api/pedidos/${pedidoId}/items/${itemId}`, { method: 'DELETE' }),

  marcarListo: (pedidoId: string, itemId: string, listo: boolean) =>
    apiFetch<void>(`/api/pedidos/${pedidoId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ listo }),
    }),

  eliminar: (pedidoId: string) => apiFetch<void>(`/api/pedidos/${pedidoId}`, { method: 'DELETE' }),

  cobrar: (mesa: string, metodoPago: MetodoPago, recibido: number) =>
    apiFetch<Pedido>('/api/pedidos/cobrar', {
      method: 'POST',
      body: JSON.stringify({ mesa, metodoPago, recibido }),
    }),
};

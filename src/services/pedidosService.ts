'use client';

import { apiFetch } from '@/lib/api/client';
import type { Destino, MetodoPago, Pedido } from '@/domain/types';

export interface CartLine {
  productoId: string;
  cantidad: number;
  detalle: string;
  destino: Destino;
}

export interface RegistrarPagoInput {
  monto: number;
  metodoPago: MetodoPago;
  nota?: string;
  recibido?: number;
  /** Día de la venta (YYYY-MM-DD); si se omite, no se toca la fecha ya guardada del pedido. */
  fecha?: string;
}

export const pedidosService = {
  enviar: (mesa: string, cart: CartLine[]) =>
    apiFetch<Pedido>('/api/pedidos', { method: 'POST', body: JSON.stringify({ mesa, cart }) }),

  /** Admin no necesita pin; mesero/cajero sí (se les pide con el modal de PIN). */
  quitarItem: (pedidoId: string, itemId: string, pin?: string) =>
    apiFetch<void>(`/api/pedidos/${pedidoId}/items/${itemId}`, {
      method: 'DELETE',
      body: JSON.stringify({ pin }),
    }),

  cambiarCantidad: (pedidoId: string, itemId: string, cantidad: number, pin?: string) =>
    apiFetch<void>(`/api/pedidos/${pedidoId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ cantidad, pin }),
    }),

  marcarListo: (pedidoId: string, itemId: string, listo: boolean) =>
    apiFetch<void>(`/api/pedidos/${pedidoId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ listo }),
    }),

  eliminar: (pedidoId: string, pin?: string) =>
    apiFetch<void>(`/api/pedidos/${pedidoId}`, { method: 'DELETE', body: JSON.stringify({ pin }) }),

  registrarPago: (mesa: string, input: RegistrarPagoInput) =>
    apiFetch<Pedido>('/api/pedidos/cobrar', { method: 'POST', body: JSON.stringify({ mesa, ...input }) }),
};

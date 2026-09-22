'use client';

import { orderBy, query, where } from 'firebase/firestore';
import { collections } from '@/lib/firestore/collections';
import { useCollection } from './useCollection';

/** Mesas ocupadas — usado por Mesas, Pedido y Cobro. Barato: casi nunca hay más de una decena. */
export function usePedidosAbiertos() {
  return useCollection(() => query(collections.pedidos(), where('pagado', '==', false)));
}

/** Comandas de hoy — cocina/bartender filtran por destino en memoria (ver domain/pedidos.ts). */
export function usePedidosDelDia(fecha: string) {
  return useCollection(() => query(collections.pedidos(), where('fecha', '==', fecha)), [fecha]);
}

/** Historial acotado por fecha — Resumen, Ventas y Cobros lo usan con el rango elegido. */
export function usePedidosDesde(desde: string) {
  return useCollection(
    () => query(collections.pedidos(), where('fecha', '>=', desde), orderBy('fecha', 'desc')),
    [desde]
  );
}

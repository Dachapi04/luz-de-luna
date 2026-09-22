import type { Destino, Pedido, PedidoItem } from './types';

/** Una mesa está ocupada si tiene un pedido con pagado === false. */
export function pedidoAbierto(pedidos: Pedido[], mesa: string): Pedido | undefined {
  return pedidos.find((p) => p.mesa === mesa && !p.pagado);
}

export function totalPedido(pedido: Pick<Pedido, 'items'>): number {
  return pedido.items.reduce((acc, i) => acc + i.total, 0);
}

export function totalLineas(pedido: Pick<Pedido, 'items'>): number {
  return pedido.items.reduce((acc, i) => acc + i.cantidad, 0);
}

/**
 * Un pedido es "activo" para una estación si tiene al menos un ítem de su
 * destino sin listo=true. Cuando todos los suyos quedan listo=true, pasa al
 * historial de esa estación.
 */
export function itemsDeEstacion(pedido: Pick<Pedido, 'items'>, estacion: Destino): PedidoItem[] {
  return pedido.items.filter((i) => i.destino === estacion);
}

export function estacionPendiente(pedido: Pick<Pedido, 'items'>, estacion: Destino): boolean {
  return itemsDeEstacion(pedido, estacion).some((i) => !i.listo);
}

export function totalesPeriodo(pedidos: Pedido[], compras: { fecha: string; total: number }[], desde: string) {
  const ventas = pedidos
    .filter((p) => p.pagado && p.fecha >= desde && p.cobro)
    .reduce((acc, p) => acc + (p.cobro?.total ?? 0), 0);
  const comprasTotal = compras.filter((c) => c.fecha >= desde).reduce((acc, c) => acc + c.total, 0);
  return { ventas, compras: comprasTotal, ganancia: ventas - comprasTotal };
}

export function desglosePorProducto(pedidos: Pedido[], desde: string) {
  const acc = new Map<string, { qty: number; monto: number }>();
  for (const p of pedidos) {
    if (!p.pagado || p.fecha < desde) continue;
    for (const i of p.items) {
      const cur = acc.get(i.producto) ?? { qty: 0, monto: 0 };
      cur.qty += i.cantidad;
      cur.monto += i.total;
      acc.set(i.producto, cur);
    }
  }
  return Array.from(acc.entries())
    .map(([nombre, v]) => ({ nombre, ...v }))
    .sort((a, b) => b.monto - a.monto);
}

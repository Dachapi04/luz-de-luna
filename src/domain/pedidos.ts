import type { Destino, MetodoPago, PagoParcial, Pedido, PedidoItem } from './types';
import { round3 } from './inventory';

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

/**
 * Los pagos de un pedido, como una lista uniforme de abonos — ya sea la
 * lista real de `pagos` (pago dividido) o, para pedidos migrados del
 * respaldo que solo tienen `cobro`, un único abono sintético equivalente.
 * Todo el reporting (Cierre, Cobros, exportar) recorre esta lista en vez
 * de mirar `cobro`/`pagos` por separado.
 */
export function pagosDe(pedido: Pick<Pedido, 'pagos' | 'cobro'>): PagoParcial[] {
  if (pedido.pagos && pedido.pagos.length > 0) return pedido.pagos;
  if (pedido.cobro && pedido.cobro.metodoPago !== 'Mixto') {
    return [
      {
        id: 'legacy',
        monto: pedido.cobro.total,
        metodoPago: pedido.cobro.metodoPago,
        recibido: pedido.cobro.recibido,
        vuelto: pedido.cobro.vuelto,
        nota: '',
        cajeroId: pedido.cobro.cajeroId,
        cajeroNombre: pedido.cobro.cajeroNombre,
        fechaHora: pedido.cobro.fechaHora,
      },
    ];
  }
  return [];
}

export function totalPagado(pedido: Pick<Pedido, 'pagos'>): number {
  return round3((pedido.pagos ?? []).reduce((a, p) => a + p.monto, 0));
}

export function saldoPendiente(pedido: Pick<Pedido, 'items' | 'pagos'>): number {
  return round3(Math.max(0, totalPedido(pedido) - totalPagado(pedido)));
}

export function montoPorMetodo(pedido: Pick<Pedido, 'pagos' | 'cobro'>, metodo: MetodoPago): number {
  return pagosDe(pedido)
    .filter((p) => p.metodoPago === metodo)
    .reduce((a, p) => a + p.monto, 0);
}

export interface PagoConMesa extends PagoParcial {
  pedidoId: string;
  mesa: string;
  fecha: string;
}

/** Aplana los abonos de varios pedidos pagados en una sola lista, para la tabla de Cobros. */
export function flattenPagos(pedidos: Pedido[]): PagoConMesa[] {
  return pedidos
    .filter((p) => p.pagado)
    .flatMap((p) => pagosDe(p).map((pg) => ({ ...pg, pedidoId: p.id, mesa: p.mesa, fecha: p.fecha })));
}

export function desglosePorProducto(pedidos: Pedido[], desde: string, hasta?: string) {
  const acc = new Map<string, { qty: number; monto: number }>();
  for (const p of pedidos) {
    if (!p.pagado || p.fecha < desde || (hasta && p.fecha > hasta)) continue;
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

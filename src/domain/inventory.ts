import type { Producto } from './types';

/**
 * Stock disponible de un platillo = MIN( stock_del_insumo / cantidad_necesaria )
 * sobre cada línea de su receta. No es un valor almacenado: se resuelve
 * siempre a partir de los insumos referenciados.
 */
export function disponiblePlatillo(platillo: Producto, productos: Producto[]): number {
  if (platillo.tipo !== 'platillo' || !platillo.receta?.length) return Infinity;
  const byId = new Map(productos.map((p) => [p.id, p]));
  const ratios = platillo.receta.map((r) => {
    const insumo = byId.get(r.insumoId);
    if (!insumo || r.cantidad <= 0) return 0;
    return (insumo.cantidad ?? 0) / r.cantidad;
  });
  return Math.floor(Math.min(...ratios));
}

export function esBajoStock(insumo: Producto): boolean {
  return insumo.tipo === 'insumo' && (insumo.cantidad ?? 0) <= (insumo.stockMinimo ?? 0);
}

export function insumosBajoStock(productos: Producto[]): Producto[] {
  return productos.filter(esBajoStock);
}

/**
 * Aplica el ajuste de stock que produce vender `cantidadVendida` unidades de
 * un platillo (signo -1 al vender, +1 al restituir), devolviendo un mapa
 * insumoId -> delta que el caller escribe dentro de la misma transacción de
 * Firestore que toca el documento del pedido.
 */
export function deltasReceta(platillo: Producto, cantidadVendida: number, signo: 1 | -1): Map<string, number> {
  const deltas = new Map<string, number>();
  if (platillo.tipo !== 'platillo') return deltas;
  for (const linea of platillo.receta ?? []) {
    const delta = signo * linea.cantidad * cantidadVendida;
    deltas.set(linea.insumoId, (deltas.get(linea.insumoId) ?? 0) + delta);
  }
  return deltas;
}

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

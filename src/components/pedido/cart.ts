import type { Categoria, Destino, Producto } from '@/domain/types';

export interface CartLine {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  detalle: string;
  destino: Destino;
}

const DESTINO_BAR: Categoria[] = ['Alcohol', 'Botellas'];

/** Heurística de destino por defecto: bebidas van al bar, el resto a cocina. */
export function destinoPorDefecto(p: Producto): Destino {
  if (DESTINO_BAR.includes(p.categoria)) return 'bartender';
  if (p.nombre.startsWith('Agua')) return 'bartender';
  return 'cocina';
}

export function addToCart(cart: CartLine[], p: Producto): CartLine[] {
  const i = cart.findIndex((c) => c.productoId === p.id);
  if (i >= 0) {
    const next = cart.slice();
    next[i] = { ...next[i]!, cantidad: next[i]!.cantidad + 1 };
    return next;
  }
  return [
    ...cart,
    { productoId: p.id, nombre: p.nombre, precio: p.precio ?? 0, cantidad: 1, detalle: '', destino: destinoPorDefecto(p) },
  ];
}

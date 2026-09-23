/**
 * Core domain types — the shape of every Firestore document in the system.
 * Framework-free on purpose: no Firebase, no React here, so this file can
 * be shared between client components, server route handlers and scripts.
 */

export const ROLES = ['admin', 'mesero', 'cocina', 'bartender', 'cajero'] as const;
export type Rol = (typeof ROLES)[number];

export const CATEGORIAS = ['Insumos', 'Botellas', 'Alcohol', 'Comidas', 'Otros'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const METODOS_PAGO = ['Efectivo', 'Sinpe', 'Tarjeta'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const DESTINOS = ['cocina', 'bartender'] as const;
export type Destino = (typeof DESTINOS)[number];

export const MESAS_BARRA = ['Barra Izquierda', 'Barra Medio', 'Barra Centro'] as const;
export const MESAS_SALON = [
  'Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5',
  'Mesa 6', 'Mesa 7', 'Mesa 8', 'Mesa 9', 'Mesa 10',
] as const;

/** usuarios/{uid} — uid is the Firebase Auth uid */
export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
}

export interface RecetaLinea {
  insumoId: string;
  insumoNombre: string;
  cantidad: number;
}

export type TipoProducto = 'insumo' | 'platillo';

/** productos/{id} — insumo or platillo, recipe embedded */
export interface Producto {
  id: string;
  nombre: string;
  tipo: TipoProducto;
  categoria: Categoria;
  unidad: string;
  // insumo only
  cantidad?: number;
  stockMinimo?: number;
  // platillo only
  precio?: number;
  receta?: RecetaLinea[];
}

export interface ProductoInsumo extends Producto {
  tipo: 'insumo';
  cantidad: number;
  stockMinimo: number;
}

export interface ProductoPlatillo extends Producto {
  tipo: 'platillo';
  precio: number;
  receta: RecetaLinea[];
}

/** compras/{id} */
export interface Compra {
  id: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  categoria: Categoria;
  cantidad: number | null;
  unidad: string | null;
  total: number;
}

export interface PedidoItem {
  id: string;
  productoId: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  detalle: string;
  destino: Destino;
  listo: boolean;
}

/** Un abono al pagar en partes. "Mixto" solo aparece en el resumen agregado (Cobro), nunca se elige a mano. */
export interface PagoParcial {
  id: string;
  monto: number; // lo que se aplica a la factura
  metodoPago: MetodoPago;
  recibido: number; // lo entregado; > monto en efectivo produce vuelto
  vuelto: number;
  nota: string; // quién pagó esa parte, texto libre, opcional ("Juan")
  cajeroId: string;
  cajeroNombre: string;
  fechaHora: string; // ISO timestamp
}

/** Resumen final una vez el pedido queda completamente pagado (posible mezcla de métodos/pagadores). */
export interface Cobro {
  total: number;
  metodoPago: MetodoPago | 'Mixto';
  recibido: number;
  vuelto: number;
  cajeroId: string;
  cajeroNombre: string;
  fechaHora: string; // ISO timestamp
}

/** pedidos/{id} — comanda, items embedded */
export interface Pedido {
  id: string;
  mesa: string;
  fecha: string; // YYYY-MM-DD
  horaCreacion: string; // HH:mm
  meseroId: string;
  meseroNombre: string;
  pagado: boolean;
  items: PedidoItem[];
  /** Abonos registrados hasta completar el total. Pedidos migrados del respaldo no lo tienen (ver `cobro`). */
  pagos?: PagoParcial[];
  cobro: Cobro | null;
}

/** cierresCaja/{fecha} — doc id is the YYYY-MM-DD date */
export interface CierreCaja {
  fecha: string;
  totalVendido: number;
  totalComprado: number;
  ganancia: number;
  efectivo: number;
  sinpe: number;
  tarjeta: number;
  cerradoPorId: string;
  cerradoPorNombre: string;
  hora: string;
}

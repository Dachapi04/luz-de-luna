import 'server-only';
import { FieldValue, Transaction } from 'firebase-admin/firestore';
import { getAdminDb } from '@/config/firebase.admin';
import { ApiError } from '@/lib/api/http';
import type { Destino, MetodoPago, Pedido, PedidoItem, Producto, Usuario } from '@/domain/types';
import { todayStr, nowHHmm } from '@/lib/utils/date';
import { newId } from '@/lib/utils/id';
import { round3 } from '@/domain/inventory';

export interface CartLineInput {
  productoId: string;
  cantidad: number;
  detalle: string;
  destino: Destino;
}

/**
 * Envía las líneas del carrito de un mesero: crea el pedido si la mesa
 * estaba libre o agrega líneas al pedido abierto existente, y descuenta el
 * inventario de cada insumo según receta. Todo en una transacción: si dos
 * meseros venden al mismo tiempo, Firestore reintenta la que pierde la
 * carrera en vez de dejar el stock inconsistente.
 */
export async function enviarPedido(mesero: Usuario, mesa: string, cart: CartLineInput[]): Promise<Pedido> {
  if (!cart.length) throw new ApiError(400, 'El carrito está vacío');
  const db = getAdminDb();
  const pedidosCol = db.collection('pedidos');
  const productosCol = db.collection('productos');

  return db.runTransaction(async (tx) => {
    // 1. Read every platillo referenced by the cart.
    const platilloRefs = cart.map((c) => productosCol.doc(c.productoId));
    const platilloSnaps = await Promise.all(platilloRefs.map((ref) => tx.get(ref)));
    const platillos = platilloSnaps.map((snap, i) => {
      if (!snap.exists) throw new ApiError(404, `Producto ${cart[i]!.productoId} no existe`);
      return { id: snap.id, ...(snap.data() as Omit<Producto, 'id'>) };
    });

    // 2. Read every insumo referenced by those recipes.
    const insumoIds = new Set<string>();
    platillos.forEach((p) => (p.receta ?? []).forEach((r) => insumoIds.add(r.insumoId)));
    const insumoRefs = Array.from(insumoIds, (id) => productosCol.doc(id));
    const insumoSnaps = await Promise.all(insumoRefs.map((ref) => tx.get(ref)));
    const insumos = new Map<string, Producto>();
    insumoSnaps.forEach((snap) => {
      if (snap.exists) insumos.set(snap.id, { id: snap.id, ...(snap.data() as Omit<Producto, 'id'>) });
    });

    // 3. Find the mesa's currently-open pedido (if any).
    const openSnap = await tx.get(pedidosCol.where('mesa', '==', mesa).where('pagado', '==', false).limit(1));
    const existing = openSnap.empty
      ? null
      : ({ id: openSnap.docs[0]!.id, ...(openSnap.docs[0]!.data() as Omit<Pedido, 'id'>) } as Pedido);

    // 4. Aggregate stock deltas across the whole cart and validate availability.
    const deltas = new Map<string, number>();
    const nuevosItems: PedidoItem[] = [];
    for (let i = 0; i < cart.length; i++) {
      const line = cart[i]!;
      const platillo = platillos[i]!;
      if (platillo.tipo !== 'platillo') throw new ApiError(400, `${platillo.nombre} no es un platillo`);
      for (const r of platillo.receta ?? []) {
        deltas.set(r.insumoId, (deltas.get(r.insumoId) ?? 0) + r.cantidad * line.cantidad);
      }
      nuevosItems.push({
        id: newId('it'),
        productoId: platillo.id,
        producto: platillo.nombre,
        cantidad: line.cantidad,
        precioUnitario: platillo.precio ?? 0,
        total: (platillo.precio ?? 0) * line.cantidad,
        detalle: line.detalle || '',
        destino: line.destino,
        listo: false,
      });
    }
    for (const [insumoId, needed] of deltas) {
      const insumo = insumos.get(insumoId);
      const disponible = insumo?.cantidad ?? 0;
      if (disponible < needed) {
        throw new ApiError(409, `Insumo "${insumo?.nombre ?? insumoId}" no alcanza para completar el pedido`);
      }
    }

    // 5. Write: decrement stock, then upsert the pedido.
    for (const [insumoId, delta] of deltas) {
      tx.update(productosCol.doc(insumoId), { cantidad: FieldValue.increment(-delta) });
    }

    if (existing) {
      tx.update(pedidosCol.doc(existing.id), { items: [...existing.items, ...nuevosItems] });
      return { ...existing, items: [...existing.items, ...nuevosItems] };
    }

    const nuevo: Omit<Pedido, 'id'> = {
      mesa,
      fecha: todayStr(),
      horaCreacion: nowHHmm(),
      meseroId: mesero.id,
      meseroNombre: mesero.nombre,
      pagado: false,
      items: nuevosItems,
      cobro: null,
    };
    const ref = pedidosCol.doc();
    tx.set(ref, nuevo);
    return { id: ref.id, ...nuevo };
  });
}

async function restituirStock(tx: Transaction, items: PedidoItem[]) {
  const db = getAdminDb();
  const productosCol = db.collection('productos');
  const platilloIds = Array.from(new Set(items.map((i) => i.productoId)));
  const snaps = await Promise.all(platilloIds.map((id) => tx.get(productosCol.doc(id))));
  const platillos = new Map<string, Producto>();
  snaps.forEach((s) => {
    if (s.exists) platillos.set(s.id, { id: s.id, ...(s.data() as Omit<Producto, 'id'>) });
  });
  const deltas = new Map<string, number>();
  for (const item of items) {
    const platillo = platillos.get(item.productoId);
    for (const r of platillo?.receta ?? []) {
      deltas.set(r.insumoId, (deltas.get(r.insumoId) ?? 0) + r.cantidad * item.cantidad);
    }
  }
  for (const [insumoId, delta] of deltas) {
    tx.update(productosCol.doc(insumoId), { cantidad: FieldValue.increment(delta) });
  }
}

export async function quitarItemPedido(pedidoId: string, itemId: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection('pedidos').doc(pedidoId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new ApiError(404, 'Pedido no encontrado');
    const pedido = snap.data() as Omit<Pedido, 'id'>;
    if (pedido.pagado) throw new ApiError(409, 'El pedido ya está cobrado');
    const item = pedido.items.find((i) => i.id === itemId);
    if (!item) throw new ApiError(404, 'Línea no encontrada');
    await restituirStock(tx, [item]);
    tx.update(ref, { items: pedido.items.filter((i) => i.id !== itemId) });
  });
}

export async function eliminarPedido(pedidoId: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection('pedidos').doc(pedidoId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new ApiError(404, 'Pedido no encontrado');
    const pedido = snap.data() as Omit<Pedido, 'id'>;
    if (!pedido.pagado) await restituirStock(tx, pedido.items);
    tx.delete(ref);
  });
}

export async function marcarListo(
  pedidoId: string,
  itemId: string,
  listo: boolean,
  callerRol: Usuario['rol']
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection('pedidos').doc(pedidoId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new ApiError(404, 'Pedido no encontrado');
    const pedido = snap.data() as Omit<Pedido, 'id'>;
    const item = pedido.items.find((i) => i.id === itemId);
    if (!item) throw new ApiError(404, 'Línea no encontrada');
    // admin can toggle either station; cocina/bartender only their own
    const estacionPermitida: Destino | null =
      callerRol === 'cocina' ? 'cocina' : callerRol === 'bartender' ? 'bartender' : null;
    if (estacionPermitida && item.destino !== estacionPermitida) {
      throw new ApiError(403, 'Esa línea no pertenece a tu estación');
    }
    tx.update(ref, {
      items: pedido.items.map((i) => (i.id === itemId ? { ...i, listo } : i)),
    });
  });
}

export async function cobrarPedido(
  cajero: Usuario,
  mesa: string,
  metodoPago: MetodoPago,
  recibidoInput: number
): Promise<Pedido> {
  const db = getAdminDb();
  const pedidosCol = db.collection('pedidos');
  return db.runTransaction(async (tx) => {
    const openSnap = await tx.get(pedidosCol.where('mesa', '==', mesa).where('pagado', '==', false).limit(1));
    if (openSnap.empty) throw new ApiError(404, 'No hay pedido abierto para esa mesa');
    const doc = openSnap.docs[0]!;
    const pedido = { id: doc.id, ...(doc.data() as Omit<Pedido, 'id'>) } as Pedido;
    const total = round3(pedido.items.reduce((a, i) => a + i.total, 0));
    const recibido = metodoPago === 'Efectivo' ? recibidoInput : total;
    if (metodoPago === 'Efectivo' && recibido < total) {
      throw new ApiError(400, 'El monto recibido no cubre el total');
    }
    const cobro = {
      total,
      metodoPago,
      recibido,
      vuelto: round3(recibido - total),
      cajeroId: cajero.id,
      cajeroNombre: cajero.nombre,
      fechaHora: new Date().toISOString(),
    };
    tx.update(doc.ref, { pagado: true, cobro });
    return { ...pedido, pagado: true, cobro };
  });
}

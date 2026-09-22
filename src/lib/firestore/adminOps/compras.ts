import 'server-only';
import { getAdminDb } from '@/config/firebase.admin';
import { ApiError } from '@/lib/api/http';
import type { Compra, Producto } from '@/domain/types';
import { norm } from '@/lib/utils/normalize';
import { todayStr } from '@/lib/utils/date';

export interface CompraInput {
  fecha?: string;
  concepto: string;
  categoria: Compra['categoria'];
  cantidad?: number | null;
  unidad?: string | null;
  total: number;
}

/**
 * Registra una compra/gasto. Si el concepto coincide (sin importar
 * mayúsculas) con el nombre de un insumo y se dio cantidad, esa compra
 * suma stock a ese insumo — en la misma transacción para no perder la
 * actualización si dos compras llegan a la vez.
 */
export async function crearCompra(input: CompraInput): Promise<{ compra: Compra; insumoActualizado: string | null }> {
  if (!input.concepto?.trim() || !input.total) throw new ApiError(400, 'Falta concepto o total');
  const db = getAdminDb();
  const productosCol = db.collection('productos');
  const comprasCol = db.collection('compras');

  return db.runTransaction(async (tx) => {
    const cantidad = input.cantidad ? Number(input.cantidad) : null;
    let insumoActualizado: string | null = null;

    if (cantidad) {
      // Firestore doesn't support case-insensitive queries; fetch insumos and match in memory.
      const insumosSnap = await tx.get(productosCol.where('tipo', '==', 'insumo'));
      const match = insumosSnap.docs.find((d) => norm((d.data() as Producto).nombre) === norm(input.concepto));
      if (match) {
        insumoActualizado = (match.data() as Producto).nombre;
        const actual = (match.data() as Producto).cantidad ?? 0;
        tx.update(match.ref, { cantidad: actual + cantidad });
      }
    }

    const ref = comprasCol.doc();
    const compra: Omit<Compra, 'id'> = {
      fecha: input.fecha || todayStr(),
      concepto: input.concepto.trim(),
      categoria: input.categoria,
      cantidad,
      unidad: input.unidad || null,
      total: Number(input.total),
    };
    tx.set(ref, compra);
    return { compra: { id: ref.id, ...compra }, insumoActualizado };
  });
}

export async function eliminarCompra(id: string): Promise<void> {
  const ref = getAdminDb().collection('compras').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Compra no encontrada');
  await ref.delete();
}

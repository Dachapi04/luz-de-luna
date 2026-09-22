import 'server-only';
import { getAdminDb } from '@/config/firebase.admin';
import { ApiError } from '@/lib/api/http';
import type { Producto } from '@/domain/types';
import { norm } from '@/lib/utils/normalize';

export type ProductoInput = Omit<Producto, 'id'>;

async function assertNombreUnico(nombre: string, excludeId?: string) {
  const db = getAdminDb();
  const snap = await db.collection('productos').get();
  const dup = snap.docs.find((d) => d.id !== excludeId && norm((d.data() as Producto).nombre) === norm(nombre));
  if (dup) throw new ApiError(409, 'Ya existe un producto con ese nombre');
}

function sanitize(input: ProductoInput): ProductoInput {
  if (!input.nombre?.trim()) throw new ApiError(400, 'Falta el nombre');
  if (input.tipo === 'insumo') {
    return {
      nombre: input.nombre.trim(),
      tipo: 'insumo',
      categoria: input.categoria,
      unidad: input.unidad || '',
      cantidad: Number(input.cantidad) || 0,
      stockMinimo: Number(input.stockMinimo) || 0,
    };
  }
  return {
    nombre: input.nombre.trim(),
    tipo: 'platillo',
    categoria: input.categoria,
    unidad: input.unidad || '',
    precio: Number(input.precio) || 0,
    receta: (input.receta ?? []).map((r) => ({
      insumoId: r.insumoId,
      insumoNombre: r.insumoNombre,
      cantidad: Number(r.cantidad) || 0,
    })),
  };
}

export async function crearProducto(input: ProductoInput): Promise<Producto> {
  const clean = sanitize(input);
  await assertNombreUnico(clean.nombre);
  const ref = getAdminDb().collection('productos').doc();
  await ref.set(clean);
  return { id: ref.id, ...clean };
}

export async function editarProducto(id: string, input: ProductoInput): Promise<Producto> {
  const clean = sanitize(input);
  await assertNombreUnico(clean.nombre, id);
  const ref = getAdminDb().collection('productos').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Producto no encontrado');
  await ref.set(clean);
  return { id, ...clean };
}

export async function eliminarProducto(id: string): Promise<void> {
  const ref = getAdminDb().collection('productos').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Producto no encontrado');
  await ref.delete();
}

export async function ajustarStockRapido(id: string, delta: number): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection('productos').doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new ApiError(404, 'Producto no encontrado');
    const p = snap.data() as Producto;
    if (p.tipo !== 'insumo') throw new ApiError(400, 'Solo los insumos tienen ajuste rápido de stock');
    const nueva = Math.max(0, Math.round(((p.cantidad ?? 0) + delta) * 100) / 100);
    tx.update(ref, { cantidad: nueva });
  });
}

import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import type { CierreCaja, Compra, Pedido, Producto, Usuario } from '@/domain/types';

/** Generic converter: Firestore doc id becomes `id`, everything else passes through. */
function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T) {
      const { id: _id, ...rest } = model;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
      const data = snapshot.data(options);
      return { id: snapshot.id, ...data } as T;
    },
  };
}

export const usuarioConverter = makeConverter<Usuario>();
export const productoConverter = makeConverter<Producto>();
export const pedidoConverter = makeConverter<Pedido>();
export const compraConverter = makeConverter<Compra>();

/**
 * cierresCaja doesn't have a separate `id` field — the doc id IS `fecha`,
 * which is already stored as a field on the document, so no id-merging is
 * needed here (unlike the other collections' auto-generated ids).
 */
export const cierreConverter: FirestoreDataConverter<CierreCaja> = {
  toFirestore(model: CierreCaja) {
    return { ...model };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions) {
    return snapshot.data(options) as CierreCaja;
  },
};

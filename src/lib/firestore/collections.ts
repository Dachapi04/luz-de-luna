'use client';

import { collection } from 'firebase/firestore';
import { getFirebaseDb } from '@/config/firebase.client';
import {
  cierreConverter,
  compraConverter,
  pedidoConverter,
  productoConverter,
  usuarioConverter,
} from './converters';

/** Typed collection refs — the only place collection name strings live. */
export const collections = {
  usuarios: () => collection(getFirebaseDb(), 'usuarios').withConverter(usuarioConverter),
  productos: () => collection(getFirebaseDb(), 'productos').withConverter(productoConverter),
  pedidos: () => collection(getFirebaseDb(), 'pedidos').withConverter(pedidoConverter),
  compras: () => collection(getFirebaseDb(), 'compras').withConverter(compraConverter),
  cierresCaja: () => collection(getFirebaseDb(), 'cierresCaja').withConverter(cierreConverter),
};

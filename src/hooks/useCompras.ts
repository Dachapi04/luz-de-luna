'use client';

import { orderBy, query } from 'firebase/firestore';
import { collections } from '@/lib/firestore/collections';
import { useCollection } from './useCollection';

export function useCompras() {
  return useCollection(() => query(collections.compras(), orderBy('fecha', 'desc')));
}

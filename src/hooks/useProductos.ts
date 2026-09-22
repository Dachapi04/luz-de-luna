'use client';

import { query } from 'firebase/firestore';
import { collections } from '@/lib/firestore/collections';
import { useCollection } from './useCollection';

export function useProductos() {
  return useCollection(() => query(collections.productos()));
}

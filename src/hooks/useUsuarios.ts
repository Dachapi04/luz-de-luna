'use client';

import { orderBy, query } from 'firebase/firestore';
import { collections } from '@/lib/firestore/collections';
import { useCollection } from './useCollection';

export function useUsuarios() {
  return useCollection(() => query(collections.usuarios(), orderBy('nombre')));
}

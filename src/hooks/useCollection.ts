'use client';

import { onSnapshot, type Query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Subscribes to a Firestore query in real time. Every feature hook
 * (useProductos, usePedidos, ...) is a thin wrapper around this so the
 * subscribe/unsubscribe/error boilerplate lives in exactly one place.
 */
export function useCollection<T>(queryFactory: () => Query<T>, deps: unknown[] = []): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({ data: [], loading: true, error: null });

  useEffect(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = onSnapshot(
      queryFactory(),
      (snap) => setState({ data: snap.docs.map((d) => d.data()), loading: false, error: null }),
      (err) => setState({ data: [], loading: false, error: err.message })
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

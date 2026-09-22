'use client';

import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebaseDb } from '@/config/firebase.client';
import { cierreConverter } from '@/lib/firestore/converters';
import type { CierreCaja } from '@/domain/types';

/** Live lookup of cierresCaja/{fecha} — null while loading or if that date was never closed. */
export function useCierre(fecha: string) {
  const [cierre, setCierre] = useState<CierreCaja | null | undefined>(undefined);

  useEffect(() => {
    setCierre(undefined);
    const ref = doc(getFirebaseDb(), 'cierresCaja', fecha).withConverter(cierreConverter);
    return onSnapshot(ref, (snap) => setCierre(snap.exists() ? snap.data() : null));
  }, [fecha]);

  return cierre;
}

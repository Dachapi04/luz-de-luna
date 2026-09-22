'use client';

import { getFirebaseAuth } from '@/config/firebase.client';
import { ApiClientError } from '@/lib/api/client';

/** Downloads the full Excel backup and saves it via the browser (binary, not JSON). */
export async function descargarRespaldoExcel(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new ApiClientError('No hay sesión activa');
  const token = await user.getIdToken();

  const res = await fetch('/api/export', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ApiClientError(`No se pudo generar el respaldo (${res.status})`);

  const blob = await res.blob();
  const filename =
    res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ?? 'luz-de-luna-respaldo.xlsx';

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

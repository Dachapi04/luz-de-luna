'use client';

import { getFirebaseAuth } from '@/config/firebase.client';

export class ApiClientError extends Error {}

/**
 * Fetch wrapper for our own /api/** route handlers: attaches the current
 * Firebase ID token and throws a readable error on non-2xx responses.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new ApiClientError('No hay sesión activa');
  const token = await user.getIdToken();

  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiClientError(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

import 'server-only';
import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/config/firebase.admin';
import type { Rol, Usuario } from '@/domain/types';

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <token>`
 * and loads the caller's usuarios/{uid} document. This is the server-side
 * counterpart to the Firestore security rules: route handlers that mutate
 * more than one document re-check the role here before writing.
 */
export async function requireUser(req: NextRequest): Promise<Usuario> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AuthError(401, 'Falta el token de autenticación');

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    throw new AuthError(401, 'Token inválido o expirado');
  }

  const snap = await getAdminDb().collection('usuarios').doc(uid).get();
  if (!snap.exists) throw new AuthError(403, 'No existe un perfil de usuario para esta cuenta');
  return { id: snap.id, ...(snap.data() as Omit<Usuario, 'id'>) };
}

export async function requireRole(req: NextRequest, allowed: Rol[]): Promise<Usuario> {
  const user = await requireUser(req);
  if (!allowed.includes(user.rol)) {
    throw new AuthError(403, `Se requiere rol ${allowed.join(' o ')}`);
  }
  return user;
}

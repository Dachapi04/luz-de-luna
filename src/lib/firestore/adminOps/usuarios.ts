import 'server-only';
import { getAdminAuth, getAdminDb } from '@/config/firebase.admin';
import { ApiError } from '@/lib/api/http';
import type { Rol, Usuario } from '@/domain/types';
import { norm } from '@/lib/utils/normalize';
import { usernameToAuthEmail } from '@/config/env';
import { deleteAdminPin, setAdminPin } from './adminPin';

export interface UsuarioInput {
  nombre: string;
  usuario: string;
  clave?: string;
  rol: Rol;
  /** PIN de 4-6 dígitos para autorizar cambios de mesero/cajero. Vacío/omitido = no tocar el actual. Solo admins. */
  pin?: string;
}

async function assertUsuarioUnico(usuario: string, excludeId?: string) {
  const snap = await getAdminDb().collection('usuarios').get();
  const dup = snap.docs.find((d) => d.id !== excludeId && norm((d.data() as Usuario).usuario) === norm(usuario));
  if (dup) throw new ApiError(409, 'Ese usuario ya existe');
}

async function countAdmins(excludeId?: string): Promise<number> {
  const snap = await getAdminDb().collection('usuarios').where('rol', '==', 'admin').get();
  return snap.docs.filter((d) => d.id !== excludeId).length;
}

export async function crearUsuario(input: UsuarioInput): Promise<Usuario> {
  if (!input.nombre?.trim() || !input.usuario?.trim()) throw new ApiError(400, 'Falta nombre o usuario');
  if (!input.clave) throw new ApiError(400, 'Define una contraseña');
  await assertUsuarioUnico(input.usuario);

  const auth = getAdminAuth();
  const email = usernameToAuthEmail(input.usuario);
  const authUser = await auth.createUser({
    email,
    password: input.clave,
    displayName: input.nombre.trim(),
  });

  const doc: Omit<Usuario, 'id'> = {
    nombre: input.nombre.trim(),
    usuario: input.usuario.trim(),
    rol: input.rol,
  };
  try {
    await getAdminDb().collection('usuarios').doc(authUser.uid).set(doc);
    if (input.pin) {
      if (input.rol !== 'admin') throw new ApiError(400, 'Solo un admin puede tener PIN de autorización');
      await setAdminPin(authUser.uid, input.pin);
    }
  } catch (err) {
    // roll back the orphaned Auth account if any later step fails
    await auth.deleteUser(authUser.uid).catch(() => undefined);
    throw err;
  }
  return { id: authUser.uid, ...doc };
}

export async function editarUsuario(id: string, input: UsuarioInput): Promise<Usuario> {
  const db = getAdminDb();
  const ref = db.collection('usuarios').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Usuario no encontrado');
  const actual = snap.data() as Omit<Usuario, 'id'>;

  if (!input.nombre?.trim() || !input.usuario?.trim()) throw new ApiError(400, 'Falta nombre o usuario');
  await assertUsuarioUnico(input.usuario, id);

  if (actual.rol === 'admin' && input.rol !== 'admin') {
    const otros = await countAdmins(id);
    if (otros === 0) throw new ApiError(409, 'Debe quedar al menos un admin');
  }

  const auth = getAdminAuth();
  const authUpdate: { email?: string; password?: string; displayName?: string } = {
    displayName: input.nombre.trim(),
  };
  if (norm(input.usuario) !== norm(actual.usuario)) authUpdate.email = usernameToAuthEmail(input.usuario);
  if (input.clave) authUpdate.password = input.clave;
  await auth.updateUser(id, authUpdate);

  const doc: Omit<Usuario, 'id'> = { nombre: input.nombre.trim(), usuario: input.usuario.trim(), rol: input.rol };
  await ref.set(doc);

  if (input.pin) {
    if (input.rol !== 'admin') throw new ApiError(400, 'Solo un admin puede tener PIN de autorización');
    await setAdminPin(id, input.pin);
  }
  // el rol dejó de ser admin: su PIN, si tenía, ya no debe poder autorizar nada
  if (actual.rol === 'admin' && input.rol !== 'admin') await deleteAdminPin(id);

  return { id, ...doc };
}

export async function eliminarUsuario(id: string): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection('usuarios').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Usuario no encontrado');
  const u = snap.data() as Omit<Usuario, 'id'>;

  if (u.rol === 'admin') {
    const otros = await countAdmins(id);
    if (otros === 0) throw new ApiError(409, 'No se puede eliminar al último admin');
  }

  await getAdminAuth().deleteUser(id).catch(() => undefined);
  await deleteAdminPin(id);
  await ref.delete();
}

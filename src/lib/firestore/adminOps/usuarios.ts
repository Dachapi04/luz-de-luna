import 'server-only';
import { getAdminAuth, getAdminDb } from '@/config/firebase.admin';
import { ApiError } from '@/lib/api/http';
import { ROLES, esUsuarioActivo, type Rol, type Usuario } from '@/domain/types';
import { norm } from '@/lib/utils/normalize';
import { usernameToAuthEmail } from '@/config/env';
import { deleteAdminPin, isValidPinFormat, setAdminPin } from './adminPin';

export interface UsuarioInput {
  nombre: string;
  usuario: string;
  clave?: string;
  rol: Rol;
  /** PIN de 4-6 dígitos para autorizar cambios de mesero/cajero. Vacío/omitido = no tocar el actual. Solo admins. */
  pin?: string;
}

const USUARIO_PATTERN = /^[a-z0-9._-]+$/i;
const CLAVE_MIN = 6;

/**
 * Firebase Auth exige un email válido (el usuario se convierte en
 * `usuario@dominio`) y contraseñas de al menos 6 caracteres. Validamos aquí
 * para devolver un mensaje claro en vez de un 500 genérico.
 */
function validarCampos(input: UsuarioInput, { claveRequerida, validarUsuario }: { claveRequerida: boolean; validarUsuario: boolean }) {
  if (!input.nombre?.trim() || !input.usuario?.trim()) throw new ApiError(400, 'Falta nombre o usuario');
  if (validarUsuario && !USUARIO_PATTERN.test(input.usuario.trim())) {
    throw new ApiError(400, 'El usuario solo puede tener letras, números, punto, guion y guion bajo (sin espacios ni tildes)');
  }
  if (!ROLES.includes(input.rol)) throw new ApiError(400, 'Rol inválido');
  if (claveRequerida && !input.clave) throw new ApiError(400, 'Define una contraseña');
  if (input.clave && input.clave.length < CLAVE_MIN) {
    throw new ApiError(400, `La contraseña debe tener al menos ${CLAVE_MIN} caracteres`);
  }
  if (input.pin && input.rol !== 'admin') throw new ApiError(400, 'Solo un admin puede tener PIN de autorización');
  if (input.pin && !isValidPinFormat(input.pin)) throw new ApiError(400, 'El PIN debe tener entre 4 y 6 dígitos');
}

/** Traduce los errores de Firebase Auth a mensajes que el admin entienda. */
function authError(err: unknown): never {
  const code = (err as { code?: string })?.code;
  if (code === 'auth/email-already-exists') throw new ApiError(409, 'Ese usuario ya existe en el sistema de acceso');
  if (code === 'auth/invalid-email') throw new ApiError(400, 'El nombre de usuario no es válido');
  if (code === 'auth/invalid-password') throw new ApiError(400, `La contraseña debe tener al menos ${CLAVE_MIN} caracteres`);
  if (code === 'auth/user-not-found') {
    throw new ApiError(404, 'Este usuario no tiene cuenta de acceso. Elimínalo y créalo de nuevo.');
  }
  throw err;
}

async function assertUsuarioUnico(usuario: string, excludeId?: string) {
  const snap = await getAdminDb().collection('usuarios').get();
  const dup = snap.docs.find((d) => d.id !== excludeId && norm((d.data() as Usuario).usuario) === norm(usuario));
  if (dup) throw new ApiError(409, 'Ese usuario ya existe');
}

/** Admins activos, sin contar `excludeId`. Un admin desactivado no sirve para administrar. */
async function countAdmins(excludeId?: string): Promise<number> {
  const snap = await getAdminDb().collection('usuarios').where('rol', '==', 'admin').get();
  return snap.docs.filter((d) => d.id !== excludeId && esUsuarioActivo(d.data() as Usuario)).length;
}

export async function crearUsuario(input: UsuarioInput): Promise<Usuario> {
  validarCampos(input, { claveRequerida: true, validarUsuario: true });
  await assertUsuarioUnico(input.usuario);

  const auth = getAdminAuth();
  const email = usernameToAuthEmail(input.usuario);
  const authUser = await auth
    .createUser({ email, password: input.clave, displayName: input.nombre.trim() })
    .catch(authError);

  const doc: Omit<Usuario, 'id'> = {
    nombre: input.nombre.trim(),
    usuario: input.usuario.trim(),
    rol: input.rol,
    activo: true,
  };
  try {
    await getAdminDb().collection('usuarios').doc(authUser.uid).set(doc);
    if (input.pin) await setAdminPin(authUser.uid, input.pin);
  } catch (err) {
    // roll back the orphaned Auth account if any later step fails
    await auth.deleteUser(authUser.uid).catch(() => undefined);
    throw err;
  }
  return { id: authUser.uid, ...doc };
}

export async function editarUsuario(id: string, input: UsuarioInput, actorId: string): Promise<Usuario> {
  const db = getAdminDb();
  const ref = db.collection('usuarios').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Usuario no encontrado');
  const actual = snap.data() as Omit<Usuario, 'id'>;
  const cambiaUsuario = norm(input.usuario) !== norm(actual.usuario);

  // Validar todo antes de escribir nada, para no dejar cambios a medias.
  validarCampos(input, { claveRequerida: false, validarUsuario: cambiaUsuario });
  await assertUsuarioUnico(input.usuario, id);

  if (actual.rol === 'admin' && input.rol !== 'admin') {
    if (id === actorId) throw new ApiError(409, 'No puedes quitarte el rol de admin a ti mismo');
    const otros = await countAdmins(id);
    if (otros === 0) throw new ApiError(409, 'Debe quedar al menos un admin activo');
  }

  const auth = getAdminAuth();
  const authUpdate: { email?: string; password?: string; displayName?: string } = {
    displayName: input.nombre.trim(),
  };
  if (cambiaUsuario) authUpdate.email = usernameToAuthEmail(input.usuario);
  if (input.clave) authUpdate.password = input.clave;
  await auth.updateUser(id, authUpdate).catch(authError);

  // update (no set) para no borrar otros campos del documento, como `activo`
  const cambios = { nombre: input.nombre.trim(), usuario: input.usuario.trim(), rol: input.rol };
  await ref.update(cambios);

  if (input.pin) await setAdminPin(id, input.pin);
  // el rol dejó de ser admin: su PIN, si tenía, ya no debe poder autorizar nada
  if (actual.rol === 'admin' && input.rol !== 'admin') await deleteAdminPin(id);

  return { id, ...actual, ...cambios };
}

/**
 * Activa o desactiva una cuenta sin borrarla (p. ej. un empleado que ya no
 * trabaja aquí). Desactivada: Firebase Auth rechaza el login, se revocan sus
 * sesiones abiertas, la API la rechaza (ver requireUser) y, si es admin, su
 * PIN deja de autorizar.
 */
export async function setUsuarioActivo(id: string, activo: boolean, actorId: string): Promise<void> {
  const ref = getAdminDb().collection('usuarios').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Usuario no encontrado');
  const u = snap.data() as Omit<Usuario, 'id'>;

  if (!activo) {
    if (id === actorId) throw new ApiError(409, 'No puedes desactivar tu propia cuenta');
    if (u.rol === 'admin' && (await countAdmins(id)) === 0) {
      throw new ApiError(409, 'Debe quedar al menos un admin activo');
    }
  }

  const auth = getAdminAuth();
  await auth.updateUser(id, { disabled: !activo }).catch(authError);
  if (!activo) await auth.revokeRefreshTokens(id).catch(authError);
  await ref.update({ activo });
}

export async function eliminarUsuario(id: string, actorId: string): Promise<void> {
  if (id === actorId) throw new ApiError(409, 'No puedes eliminar tu propia cuenta');
  const db = getAdminDb();
  const ref = db.collection('usuarios').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Usuario no encontrado');
  const u = snap.data() as Omit<Usuario, 'id'>;

  if (u.rol === 'admin') {
    const otros = await countAdmins(id);
    if (otros === 0) throw new ApiError(409, 'No se puede eliminar al último admin activo');
  }

  // Si la cuenta de acceso ya no existía, seguimos; cualquier otro error se
  // reporta, para no dejar una cuenta de Auth huérfana que bloquee volver a
  // crear ese mismo usuario.
  await getAdminAuth()
    .deleteUser(id)
    .catch((err) => {
      if ((err as { code?: string })?.code !== 'auth/user-not-found') throw err;
    });
  await deleteAdminPin(id);
  await ref.delete();
}

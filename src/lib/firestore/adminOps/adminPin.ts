import 'server-only';
import bcrypt from 'bcryptjs';
import { getAdminDb } from '@/config/firebase.admin';
import { ApiError } from '@/lib/api/http';
import type { Usuario } from '@/domain/types';

/**
 * PINs de administrador viven en su propia colección (`adminPins/{uid}`),
 * nunca en `usuarios/{uid}` — ese documento lo puede leer el propio dueño
 * desde el cliente (ver firestore.rules), y un PIN corto de 4-6 dígitos es
 * trivial de romper offline si su hash llegara a exponerse. `adminPins`
 * tiene lectura/escritura cerrada por completo en las reglas; solo el
 * Admin SDK (este archivo) la toca.
 */
const SALT_ROUNDS = 10;
const PIN_PATTERN = /^\d{4,6}$/;

export function isValidPinFormat(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

export async function setAdminPin(uid: string, pin: string | null | undefined): Promise<void> {
  const ref = getAdminDb().collection('adminPins').doc(uid);
  if (!pin) {
    await ref.delete().catch(() => undefined);
    return;
  }
  if (!isValidPinFormat(pin)) throw new ApiError(400, 'El PIN debe tener entre 4 y 6 dígitos');
  const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);
  await ref.set({ pinHash });
}

export async function deleteAdminPin(uid: string): Promise<void> {
  await getAdminDb().collection('adminPins').doc(uid).delete().catch(() => undefined);
}

/**
 * Verifica un PIN contra todos los administradores. Cualquier admin cuyo
 * PIN coincida autoriza la acción — no hace falta saber cuál admin es.
 */
export async function verifyAdminPin(pin: string): Promise<Usuario> {
  if (!pin || !isValidPinFormat(pin)) throw new ApiError(403, 'PIN inválido');
  const db = getAdminDb();
  const adminsSnap = await db.collection('usuarios').where('rol', '==', 'admin').get();

  for (const doc of adminsSnap.docs) {
    const pinDoc = await db.collection('adminPins').doc(doc.id).get();
    const pinHash = pinDoc.exists ? (pinDoc.data() as { pinHash?: string }).pinHash : undefined;
    if (pinHash && (await bcrypt.compare(pin, pinHash))) {
      return { id: doc.id, ...(doc.data() as Omit<Usuario, 'id'>) };
    }
  }
  throw new ApiError(403, 'PIN incorrecto');
}

/**
 * Deja pasar directo a un admin; para cualquier otro rol exige un PIN de
 * administrador válido. Úsalo en las rutas que mesero/cajero pueden
 * ejecutar solo con autorización (quitar producto, cambiar cantidad,
 * eliminar la mesa).
 */
export async function authorizeOrPin(user: Usuario, pin: string | undefined): Promise<void> {
  if (user.rol === 'admin') return;
  if (!pin) throw new ApiError(403, 'Se requiere el PIN de un administrador');
  await verifyAdminPin(pin);
}

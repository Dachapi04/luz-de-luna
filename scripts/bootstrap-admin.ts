/**
 * Crea el primer usuario admin (usuario "admin", contraseña "admin123") si
 * todavía no existe ningún admin en el sistema. Corre una sola vez, fuera
 * de la app — la API /api/usuarios exige ya estar autenticado como admin,
 * así que este es el único punto de entrada para el primer acceso.
 *
 * Uso:
 *   npm run bootstrap-admin
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const domain = process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'luzdeluna.local';

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Faltan variables FIREBASE_ADMIN_* en .env.local. Revisa .env.local.example.');
    process.exit(1);
  }

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const auth = getAuth(app);
  const db = getFirestore(app);

  const existingAdmins = await db.collection('usuarios').where('rol', '==', 'admin').limit(1).get();
  if (!existingAdmins.empty) {
    console.log('Ya existe al menos un usuario admin. No se creó ninguno nuevo.');
    return;
  }

  const email = `admin@${domain}`;
  let uid: string;
  try {
    const created = await auth.createUser({ email, password: 'admin123', displayName: 'Administrador' });
    uid = created.uid;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'auth/email-already-exists') {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
    } else {
      throw err;
    }
  }

  await db.collection('usuarios').doc(uid).set({ nombre: 'Administrador', usuario: 'admin', rol: 'admin' });
  console.log('Usuario admin creado: usuario "admin", contraseña "admin123". Cámbiala desde Usuarios.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

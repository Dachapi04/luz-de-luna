/**
 * Typed access to PUBLIC environment variables — safe to import from both
 * client and server code. Admin/secret variables live in env.server.ts,
 * which is guarded by the `server-only` package so a client component can
 * never accidentally pull them into the browser bundle.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.local.example a .env.local y complétala.`
    );
  }
  return value;
}

export const clientEnv = {
  get firebaseApiKey() {
    return required('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  },
  get firebaseAuthDomain() {
    return required('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  },
  get firebaseProjectId() {
    return required('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  },
  get firebaseStorageBucket() {
    return required('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  },
  get firebaseMessagingSenderId() {
    return required(
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    );
  },
  get firebaseAppId() {
    return required('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
  },
  get authEmailDomain() {
    return process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || 'luzdeluna.local';
  },
};

/** "juan" -> "juan@luzdeluna.local" — lets staff log in with a short username. */
export function usernameToAuthEmail(usuario: string): string {
  return `${usuario.trim().toLowerCase()}@${clientEnv.authEmailDomain}`;
}

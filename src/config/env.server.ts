import 'server-only';

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.local.example a .env.local y complétala.`
    );
  }
  return value;
}

/** Admin SDK credentials — only ever read from src/config/firebase.admin.ts. */
export const serverEnv = {
  get adminProjectId() {
    return required('FIREBASE_ADMIN_PROJECT_ID', process.env.FIREBASE_ADMIN_PROJECT_ID);
  },
  get adminClientEmail() {
    return required('FIREBASE_ADMIN_CLIENT_EMAIL', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  },
  get adminPrivateKey() {
    const raw = required('FIREBASE_ADMIN_PRIVATE_KEY', process.env.FIREBASE_ADMIN_PRIVATE_KEY);
    return raw.replace(/\\n/g, '\n');
  },
};

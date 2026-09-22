import 'server-only';
import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { serverEnv } from './env.server';

/**
 * Firebase Admin SDK — server-only, used from app/api route handlers.
 * Never import this from a Client Component; `server-only` will throw a
 * build error if that happens by accident.
 */
function createAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  return initializeApp({
    credential: cert({
      projectId: serverEnv.adminProjectId,
      clientEmail: serverEnv.adminClientEmail,
      privateKey: serverEnv.adminPrivateKey,
    }),
  });
}

let _app: App | undefined;

export function getAdminApp(): App {
  if (!_app) _app = createAdminApp();
  return _app;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

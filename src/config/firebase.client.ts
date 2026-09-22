'use client';

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, initializeFirestore } from 'firebase/firestore';
import { clientEnv } from './env';

/**
 * Single Firebase client instance for the whole app. Next.js can execute
 * this module multiple times in dev (fast refresh) — getApps() guards
 * against "app already exists" errors.
 */
function createFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApps()[0]!;
  return initializeApp({
    apiKey: clientEnv.firebaseApiKey,
    authDomain: clientEnv.firebaseAuthDomain,
    projectId: clientEnv.firebaseProjectId,
    storageBucket: clientEnv.firebaseStorageBucket,
    messagingSenderId: clientEnv.firebaseMessagingSenderId,
    appId: clientEnv.firebaseAppId,
  });
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) _app = createFirebaseApp();
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    // long-polling auto-detect avoids WebChannel issues behind some
    // restaurant/router firewalls without needing a manual flag.
    _db = initializeFirestore(getFirebaseApp(), { experimentalAutoDetectLongPolling: true });
  }
  return _db;
}

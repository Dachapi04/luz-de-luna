'use client';

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth, getFirebaseDb } from '@/config/firebase.client';
import { usernameToAuthEmail } from '@/config/env';
import type { Usuario } from '@/domain/types';
import { usuarioConverter } from '@/lib/firestore/converters';

interface AuthContextValue {
  /** undefined = still resolving initial auth state, null = signed out */
  user: Usuario | null | undefined;
  firebaseUser: FirebaseUser | null;
  login: (usuario: string, clave: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Usuario | null | undefined>(undefined);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) setProfile(null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    // Live subscription: role/nombre changes made from Usuarios reflect
    // immediately without forcing a re-login.
    const ref = doc(getFirebaseDb(), 'usuarios', firebaseUser.uid).withConverter(usuarioConverter);
    const unsub = onSnapshot(
      ref,
      (snap) => setProfile(snap.exists() ? snap.data() : null),
      () => setProfile(null)
    );
    return unsub;
  }, [firebaseUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: profile,
      firebaseUser,
      login: async (usuario, clave) => {
        await signInWithEmailAndPassword(getFirebaseAuth(), usernameToAuthEmail(usuario), clave);
      },
      logout: async () => {
        await signOut(getFirebaseAuth());
      },
    }),
    [profile, firebaseUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

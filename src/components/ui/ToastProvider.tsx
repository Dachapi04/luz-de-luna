'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ToastContextValue {
  toast: string;
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  return <ToastContext.Provider value={{ toast, show }}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

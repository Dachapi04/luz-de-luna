'use client';

import clsx from 'clsx';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastTone = 'ok' | 'error';

interface ToastState {
  key: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  /** tone defaults to 'ok'. Pass 'error' for anything from a catch block — errors render in red, longer on screen. */
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * App-wide toast, rendered once here as a fixed banner near the bottom of
 * the viewport — not tucked into the header, which on a phone is easy to
 * miss while your attention (and thumb) is on the button you just tapped.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const seq = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'ok') => {
    clearTimeout(timer.current);
    const key = ++seq.current;
    setToast({ key, message, tone });
    timer.current = setTimeout(() => setToast((t) => (t?.key === key ? null : t)), tone === 'error' ? 5000 : 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5">
        {toast && (
          <div
            key={toast.key}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={clsx(
              'pointer-events-auto w-full max-w-md animate-slide-up rounded-xl border px-4 py-3 text-center text-sm font-semibold shadow-[var(--shadow-modal)]',
              toast.tone === 'error'
                ? 'border-[oklch(0.5_0.14_28)] bg-bad text-bad-fg'
                : 'border-[oklch(0.4_0.08_145)] bg-ok text-ok-fg'
            )}
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

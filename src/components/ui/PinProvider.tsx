'use client';

import { createContext, useContext, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

type PinContextValue = (title: string, body: string) => Promise<string | null>;

const PinContext = createContext<PinContextValue | null>(null);

interface PendingPin {
  title: string;
  body: string;
  resolve: (pin: string | null) => void;
}

/**
 * App-wide PIN prompt: mesero/cajero call this before an action that needs
 * an admin's authorization (quitar un producto, cambiar cantidad, eliminar
 * la mesa). The PIN itself is only verified server-side — this component
 * never checks it, just collects it.
 */
export function PinProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingPin | null>(null);
  const [value, setValue] = useState('');

  const requestPin = (title: string, body: string) =>
    new Promise<string | null>((resolve) => {
      setValue('');
      setPending({ title, body, resolve });
    });

  const close = (pin: string | null) => {
    pending?.resolve(pin);
    setPending(null);
  };

  return (
    <PinContext.Provider value={requestPin}>
      {children}
      {pending && (
        <Modal title={pending.title} onClose={() => close(null)}>
          <div className="mb-2 font-serif text-xl font-semibold">{pending.title}</div>
          <div className="mb-4 text-sm leading-relaxed text-text-soft">{pending.body}</div>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && value && close(value)}
            placeholder="PIN de administrador"
            className="w-full rounded-md border border-input-border bg-input-bg px-3 py-[10px] text-center font-mono text-lg tracking-[0.3em] outline-none focus-visible:border-gold"
          />
          <div className="mt-5 flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => close(null)}>
              Cancelar
            </Button>
            <Button fullWidth disabled={!value} onClick={() => close(value)}>
              Confirmar
            </Button>
          </div>
        </Modal>
      )}
    </PinContext.Provider>
  );
}

export function usePinPrompt(): PinContextValue {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error('usePinPrompt debe usarse dentro de <PinProvider>');
  return ctx;
}

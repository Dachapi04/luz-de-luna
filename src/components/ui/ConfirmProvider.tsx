'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  body: string;
  confirmLabel?: string;
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

/**
 * App-wide "are you sure?" modal — replaces window.confirm() everywhere
 * (compras, productos, pedidos, usuarios all delete through this).
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmContextValue>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <Modal title={pending.title} onClose={() => close(false)}>
          <div className="mb-2 font-serif text-xl font-semibold">{pending.title}</div>
          <div className="text-sm leading-relaxed text-text-soft">{pending.body}</div>
          <div className="mt-5 flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button variant="danger-solid" fullWidth onClick={() => close(true)}>
              {pending.confirmLabel ?? 'Eliminar'}
            </Button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

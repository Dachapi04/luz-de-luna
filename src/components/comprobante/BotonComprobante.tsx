'use client';

import { useState } from 'react';
import type { Pedido } from '@/domain/types';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { imprimirComprobante } from '@/lib/pdf/comprobante';

/** Genera e imprime el comprobante de pago. Solo se habilita cuando el pedido está pagado por completo. */
export function BotonComprobante({
  pedido,
  children = '🧾 Imprimir comprobante',
  ...props
}: { pedido: Pedido } & Omit<ButtonProps, 'onClick'>) {
  const { show } = useToast();
  const [generando, setGenerando] = useState(false);

  async function imprimir() {
    setGenerando(true);
    try {
      await imprimirComprobante(pedido);
    } catch {
      show('No se pudo generar el comprobante', 'error');
    } finally {
      setGenerando(false);
    }
  }

  return (
    <Button
      variant="secondary"
      {...props}
      disabled={!pedido.pagado || generando || props.disabled}
      title={pedido.pagado ? undefined : 'Disponible cuando la cuenta esté pagada por completo'}
      onClick={imprimir}
    >
      {generando ? 'Generando…' : children}
    </Button>
  );
}

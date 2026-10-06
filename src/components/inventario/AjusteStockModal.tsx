'use client';

import { useState } from 'react';
import type { Producto } from '@/domain/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

/**
 * Pide la cantidad exacta que entra (+) o sale (−) de un insumo, para no
 * tener que pulsar el botón una vez por unidad. Muestra cómo queda el stock
 * antes de confirmar.
 */
export function AjusteStockModal({
  producto,
  signo,
  onConfirm,
  onClose,
}: {
  producto: Producto;
  signo: 1 | -1;
  onConfirm: (delta: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const cantidad = Number(value.replace(',', '.'));
  const valida = value.trim() !== '' && Number.isFinite(cantidad) && cantidad > 0;
  const actual = producto.cantidad ?? 0;
  const nueva = Math.max(0, Math.round((actual + signo * (valida ? cantidad : 0)) * 100) / 100);
  const title = signo > 0 ? 'Agregar stock' : 'Restar stock';

  const confirmar = () => valida && onConfirm(signo * cantidad);

  return (
    <Modal title={title} onClose={onClose}>
      <div className="mb-2 font-serif text-xl font-semibold">{title}</div>
      <div className="mb-4 text-sm leading-relaxed text-text-soft">
        ¿Cuántos {producto.unidad} de <b>{producto.nombre}</b>{' '}
        {signo > 0 ? 'entran al inventario?' : 'salen del inventario?'}
      </div>
      <input
        type="text"
        inputMode="decimal"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && confirmar()}
        placeholder="0"
        className="w-full rounded-md border border-input-border bg-input-bg px-3 py-[10px] text-center font-mono text-lg outline-none focus-visible:border-gold"
      />
      <div className="mt-3 text-center font-mono text-[13px] text-muted">
        {actual} → <span className="text-text">{nueva}</span> {producto.unidad}
      </div>
      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" fullWidth onClick={onClose}>
          Cancelar
        </Button>
        <Button fullWidth disabled={!valida} onClick={confirmar}>
          {signo > 0 ? 'Agregar' : 'Restar'}
        </Button>
      </div>
    </Modal>
  );
}

'use client';

import clsx from 'clsx';
import type { PedidoItem } from '@/domain/types';
import { formatMoney } from '@/lib/utils/money';

export function SentLines({
  items,
  onCambiarCantidad,
  onQuitar,
}: {
  items: PedidoItem[];
  /** Si se omiten, la lista queda de solo lectura (p. ej. ya cobrado). */
  onCambiarCantidad?: (item: PedidoItem, nuevaCantidad: number) => void;
  onQuitar?: (item: PedidoItem) => void;
}) {
  const editable = !!(onCambiarCantidad && onQuitar);

  if (!items.length) return <div className="py-1 text-[13px] text-muted-2">Aún no hay líneas enviadas.</div>;
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((i) => (
        <div key={i.id} className="flex items-start gap-2.5">
          {editable ? (
            <span className="flex items-center gap-1">
              <button
                onClick={() => onCambiarCantidad!(i, i.cantidad - 1)}
                disabled={i.cantidad <= 1}
                aria-label="Restar cantidad"
                className="transition-fast press-scale h-6 w-6 cursor-pointer rounded-[6px] border border-border-strong bg-surface-hover text-xs leading-none disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[18px] text-center font-mono text-xs text-gold">{i.cantidad}</span>
              <button
                onClick={() => onCambiarCantidad!(i, i.cantidad + 1)}
                aria-label="Sumar cantidad"
                className="transition-fast press-scale h-6 w-6 cursor-pointer rounded-[6px] border border-border-strong bg-surface-hover text-xs leading-none"
              >
                +
              </button>
            </span>
          ) : (
            <span className="min-w-[24px] font-mono text-xs text-gold">{i.cantidad}×</span>
          )}
          <span className="min-w-0 flex-1">
            <span className={clsx('block text-[13px] leading-snug', i.listo ? 'text-muted line-through' : 'text-text')}>
              {i.producto}
            </span>
            <span className="block font-mono text-[11px] text-muted-2">
              {i.detalle ? `${i.detalle} · ` : ''}
              {i.destino}
              {i.listo ? ' · listo' : ' · en preparación'}
            </span>
          </span>
          <span className="font-mono text-[13px]">{formatMoney(i.total)}</span>
          {editable && (
            <button
              onClick={() => onQuitar!(i)}
              className="transition-fast cursor-pointer rounded-[6px] border border-border-strong bg-transparent px-2 py-1 text-[11px] text-[oklch(0.72_0.08_30)]"
            >
              Quitar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

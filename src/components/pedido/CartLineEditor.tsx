'use client';

import clsx from 'clsx';
import type { Destino } from '@/domain/types';
import type { CartLine } from './cart';
import { formatMoney } from '@/lib/utils/money';

export function CartLineEditor({
  line,
  onInc,
  onDec,
  onDetalle,
  onDestino,
  onRemove,
}: {
  line: CartLine;
  onInc: () => void;
  onDec: () => void;
  onDetalle: (v: string) => void;
  onDestino: (d: Destino) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-md border border-border-strong bg-surface-hover p-[11px]">
      <div className="flex items-center gap-2.5">
        <span className="min-w-0 flex-1 text-sm font-semibold leading-tight">{line.nombre}</span>
        <button
          onClick={onDec}
          aria-label="Restar cantidad"
          className="transition-fast press-scale h-[27px] w-[27px] cursor-pointer rounded-[7px] border border-border-strong bg-surface-raised leading-none"
        >
          −
        </button>
        <span className="min-w-[16px] text-center font-mono text-sm">{line.cantidad}</span>
        <button
          onClick={onInc}
          aria-label="Sumar cantidad"
          className="transition-fast press-scale h-[27px] w-[27px] cursor-pointer rounded-[7px] border border-border-strong bg-surface-raised leading-none"
        >
          +
        </button>
        <span className="min-w-[74px] text-right font-mono text-[13px]">{formatMoney(line.precio * line.cantidad)}</span>
      </div>
      <input
        type="text"
        value={line.detalle}
        onChange={(e) => onDetalle(e.target.value)}
        placeholder="Detalle: sin verduras, término medio…"
        className="transition-fast w-full rounded-md border border-input-border bg-input-bg px-2.5 py-2 text-[13px] outline-none focus-visible:border-gold"
      />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-2">Destino</span>
        <button
          onClick={() => onDestino('cocina')}
          className={clsx(
            'transition-fast cursor-pointer rounded-[7px] border px-[11px] py-1.5 text-xs',
            line.destino === 'cocina' ? 'border-gold bg-gold text-ink' : 'border-border-strong bg-transparent text-text-soft'
          )}
        >
          Cocina
        </button>
        <button
          onClick={() => onDestino('bartender')}
          className={clsx(
            'transition-fast cursor-pointer rounded-[7px] border px-[11px] py-1.5 text-xs',
            line.destino === 'bartender' ? 'border-gold bg-gold text-ink' : 'border-border-strong bg-transparent text-text-soft'
          )}
        >
          Bartender
        </button>
        <button
          onClick={onRemove}
          className="ml-auto cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-1.5 text-xs text-[oklch(0.72_0.08_30)]"
        >
          Quitar
        </button>
      </div>
    </div>
  );
}

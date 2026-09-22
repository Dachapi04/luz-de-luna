'use client';

import clsx from 'clsx';
import type { Pedido } from '@/domain/types';
import { totalLineas, totalPedido } from '@/domain/pedidos';
import { formatMoney } from '@/lib/utils/money';

export function MesaButton({ nombre, pedido, onTap }: { nombre: string; pedido: Pedido | undefined; onTap: () => void }) {
  const ocupada = !!pedido;
  return (
    <button
      onClick={onTap}
      className={clsx(
        'transition-base press-scale stagger-child flex min-h-[96px] flex-col gap-1.5 rounded-lg border p-3 text-left',
        ocupada
          ? 'border-[oklch(0.44_0.08_70)] bg-[oklch(0.26_0.04_68)] hover:border-gold'
          : 'border-border bg-surface hover:border-gold'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-serif text-[17px] font-semibold leading-[1.15]">{nombre}</span>
        <span className={clsx('h-2 w-2 flex-none rounded-full', ocupada ? 'bg-gold' : 'bg-luna')} />
      </div>
      <div className="text-xs leading-snug text-muted">
        {ocupada ? `${totalLineas(pedido!)} líneas · ${pedido!.horaCreacion}` : 'Libre'}
      </div>
      <div className={clsx('mt-auto font-mono text-xs', ocupada ? 'text-warn-fg' : 'text-muted')}>
        {ocupada ? formatMoney(totalPedido(pedido!)) : 'Abrir mesa'}
      </div>
    </button>
  );
}

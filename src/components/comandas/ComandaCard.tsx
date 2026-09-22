'use client';

import clsx from 'clsx';
import type { Destino, Pedido } from '@/domain/types';
import { itemsDeEstacion } from '@/domain/pedidos';
import { Badge } from '@/components/ui/Badge';

export function ComandaCard({
  pedido,
  estacion,
  onToggle,
}: {
  pedido: Pedido;
  estacion: Destino;
  onToggle: (itemId: string, listo: boolean) => void;
}) {
  const items = itemsDeEstacion(pedido, estacion);
  const pendientes = items.filter((i) => !i.listo).length;

  return (
    <section
      className={clsx(
        'stagger-child flex flex-col gap-2.5 rounded-lg border bg-surface p-3.5',
        pendientes ? 'border-[oklch(0.42_0.08_70)]' : 'border-[oklch(0.3_0.04_145)]'
      )}
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <div>
          <div className="font-serif text-[19px] font-semibold">{pedido.mesa}</div>
          <div className="font-mono text-[11px] text-muted-2">
            {pedido.horaCreacion} · {pedido.meseroNombre}
          </div>
        </div>
        <Badge tone={pendientes ? 'warn' : 'ok'}>{pendientes ? `${pendientes} por preparar` : 'completa'}</Badge>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => onToggle(i.id, !i.listo)}
            className={clsx(
              'transition-base press-scale flex items-start gap-2.5 rounded-md border px-2.5 py-2 text-left',
              i.listo ? 'border-border bg-[oklch(0.2_0.016_52)]' : 'border-[oklch(0.34_0.02_60)] bg-[oklch(0.245_0.018_52)]'
            )}
          >
            <span className="min-w-[24px] font-mono text-[13px] text-gold">{i.cantidad}×</span>
            <span className="min-w-0 flex-1">
              <span className={clsx('block text-sm leading-snug', i.listo ? 'text-muted line-through' : 'text-text')}>
                {i.producto}
              </span>
              {i.detalle && <span className="block text-xs leading-snug text-muted">{i.detalle}</span>}
            </span>
            <span className={clsx('font-mono text-[11px]', i.listo ? 'text-ok-fg' : 'text-muted')}>
              {i.listo ? 'listo' : 'marcar'}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

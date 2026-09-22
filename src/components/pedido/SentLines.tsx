import clsx from 'clsx';
import type { PedidoItem } from '@/domain/types';
import { formatMoney } from '@/lib/utils/money';

export function SentLines({ items }: { items: PedidoItem[] }) {
  if (!items.length) return <div className="py-1 text-[13px] text-muted-2">Aún no hay líneas enviadas.</div>;
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((i) => (
        <div key={i.id} className="flex items-start gap-2.5">
          <span className="min-w-[24px] font-mono text-xs text-gold">{i.cantidad}×</span>
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
        </div>
      ))}
    </div>
  );
}

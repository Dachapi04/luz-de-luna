'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Pedido } from '@/domain/types';
import { pagosDe, totalPedido } from '@/domain/pedidos';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/utils/money';

export function VentaCard({
  pedido,
  onQuitarItem,
  onEliminar,
}: {
  pedido: Pedido;
  onQuitarItem: (itemId: string) => void;
  onEliminar: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className={clsx('rounded-lg border bg-surface-sunken p-3.5', open ? 'border-[oklch(0.42_0.06_70)]' : 'border-border')}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="min-w-[150px] flex-1">
          <span className="block font-serif text-lg font-semibold">{pedido.mesa}</span>
          <span className="block font-mono text-[11px] text-muted-2">
            {pedido.fecha} {pedido.horaCreacion} · {pedido.meseroNombre}
          </span>
        </span>
        <Badge tone={pedido.pagado ? 'ok' : 'warn'}>{pedido.pagado ? 'Cobrado' : 'Abierto'}</Badge>
        <span className="min-w-[92px] text-right font-mono text-sm">{formatMoney(totalPedido(pedido))}</span>
        <button
          onClick={() => setOpen(!open)}
          className="cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-[7px] text-xs text-text-soft"
        >
          {open ? 'Cerrar' : 'Ver líneas'}
        </button>
        <button
          onClick={onEliminar}
          className="cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-[7px] text-xs text-[oklch(0.74_0.09_30)]"
        >
          Eliminar
        </button>
      </div>
      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-2.5 animate-slide-up">
          {pedido.items.map((i) => (
            <div key={i.id} className="flex items-center gap-2.5 text-[13px]">
              <span className="min-w-[26px] font-mono text-gold">{i.cantidad}×</span>
              <span className="min-w-0 flex-1 leading-snug">
                {i.producto}
                {i.detalle && <span className="text-muted-2"> · {i.detalle}</span>}
              </span>
              <span className="font-mono">{formatMoney(i.total)}</span>
              {!pedido.pagado && (
                <button
                  onClick={() => onQuitarItem(i.id)}
                  className="cursor-pointer rounded-md border border-border-strong bg-transparent px-2.5 py-1 text-xs text-[oklch(0.74_0.09_30)]"
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
          {pedido.pagado && pagosDe(pedido).length > 0 && (
            <div className="flex flex-col gap-0.5 pt-1 font-mono text-[11px] text-muted">
              {pagosDe(pedido).map((pg) => (
                <div key={pg.id}>
                  {pg.nota ? `${pg.nota} · ` : ''}
                  {formatMoney(pg.monto)} · {pg.metodoPago}
                  {pg.vuelto > 0 ? ` · vuelto ${formatMoney(pg.vuelto)}` : ''} · {pg.cajeroNombre}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

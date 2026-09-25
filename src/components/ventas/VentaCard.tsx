'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { Pedido } from '@/domain/types';
import { pagosDe, totalPedido } from '@/domain/pedidos';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/utils/money';
import { todayStr } from '@/lib/utils/date';

export function VentaCard({
  pedido,
  onQuitarItem,
  onEliminar,
  onEditarFecha,
}: {
  pedido: Pedido;
  onQuitarItem: (itemId: string) => void;
  onEliminar: () => void;
  onEditarFecha?: (fecha: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editandoFecha, setEditandoFecha] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(pedido.fecha);
  const [guardandoFecha, setGuardandoFecha] = useState(false);

  async function guardarFecha() {
    if (!onEditarFecha || !nuevaFecha || nuevaFecha === pedido.fecha) {
      setEditandoFecha(false);
      return;
    }
    setGuardandoFecha(true);
    try {
      await onEditarFecha(nuevaFecha);
      setEditandoFecha(false);
    } finally {
      setGuardandoFecha(false);
    }
  }

  return (
    <section className={clsx('rounded-lg border bg-surface-sunken p-3.5', open ? 'border-[oklch(0.42_0.06_70)]' : 'border-border')}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="min-w-[150px] flex-1">
          <span className="block font-serif text-lg font-semibold">{pedido.mesa}</span>
          {editandoFecha ? (
            <span className="mt-1 flex items-center gap-1.5">
              <input
                type="date"
                value={nuevaFecha}
                max={todayStr()}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="rounded-md border border-input-border bg-input-bg px-1.5 py-0.5 font-mono text-[11px] outline-none focus-visible:border-gold"
              />
              <button
                onClick={guardarFecha}
                disabled={guardandoFecha}
                className="cursor-pointer rounded-md border border-border-strong bg-transparent px-1.5 py-0.5 text-[11px] text-ok-fg"
              >
                {guardandoFecha ? '…' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setNuevaFecha(pedido.fecha);
                  setEditandoFecha(false);
                }}
                className="cursor-pointer rounded-md border border-border-strong bg-transparent px-1.5 py-0.5 text-[11px] text-muted-2"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <span className="block font-mono text-[11px] text-muted-2">
              {pedido.fecha} {pedido.horaCreacion} · {pedido.meseroNombre}
              {onEditarFecha && (
                <button
                  onClick={() => {
                    setNuevaFecha(pedido.fecha);
                    setEditandoFecha(true);
                  }}
                  className="ml-1.5 cursor-pointer text-gold underline decoration-dotted"
                >
                  editar fecha
                </button>
              )}
            </span>
          )}
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

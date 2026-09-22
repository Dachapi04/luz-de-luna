'use client';

import { useMemo, useState } from 'react';
import { useViewGuard } from '@/hooks/useViewGuard';
import { usePedidosDesde } from '@/hooks/usePedidos';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { Chip } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Spinner';
import { formatMoney } from '@/lib/utils/money';
import { daysAgoStr, todayStr } from '@/lib/utils/date';
import type { MetodoPago } from '@/domain/types';

const RANGOS = [
  { key: 'hoy', label: 'Hoy', desde: todayStr() },
  { key: '7', label: '7 días', desde: daysAgoStr(6) },
  { key: '30', label: '30 días', desde: daysAgoStr(29) },
  { key: 'todo', label: 'Todo', desde: daysAgoStr(364) },
] as const;

export default function CobrosPage() {
  useViewGuard('cobros');
  const [range, setRange] = useState<(typeof RANGOS)[number]['key']>('hoy');
  const [cajero, setCajero] = useState('todos');
  const desde = RANGOS.find((r) => r.key === range)!.desde;
  const { data: pedidos, loading } = usePedidosDesde(desde);

  const cajeros = useMemo(
    () => Array.from(new Set(pedidos.filter((p) => p.cobro).map((p) => p.cobro!.cajeroNombre))),
    [pedidos]
  );

  const rows = pedidos
    .filter((p) => p.pagado && p.cobro && (cajero === 'todos' || p.cobro.cajeroNombre === cajero))
    .sort((a, b) => (b.fecha + b.horaCreacion > a.fecha + a.horaCreacion ? 1 : -1));

  const sum = (m: MetodoPago) => rows.filter((p) => p.cobro!.metodoPago === m).reduce((a, p) => a + p.cobro!.total, 0);
  const metodoColor = (m: MetodoPago) => (m === 'Efectivo' ? 'text-warn-fg' : m === 'Sinpe' ? 'text-luna-fg' : 'text-ok-fg');

  return (
    <>
      <PageHeader title={VIEW_META.cobros.label} subtitle={VIEW_META.cobros.subtitle} />

      <div className="mb-3.5 flex flex-wrap items-end gap-3.5">
        <div className="flex gap-1.5">
          {RANGOS.map((r) => (
            <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
              {r.label}
            </Chip>
          ))}
        </div>
        <Select
          label="Cajero"
          wrapperClassName="ml-auto"
          value={cajero}
          onChange={(e) => setCajero(e.target.value)}
          options={[{ value: 'todos', label: 'Todos' }, ...cajeros.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-surface-sunken">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-2.5 bg-surface-hover px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-2">
              <span>Mesa</span>
              <span>Cajero</span>
              <span>Método</span>
              <span className="text-right">Total</span>
              <span className="text-right">Recibido</span>
              <span className="text-right">Vuelto</span>
            </div>
            {rows.length === 0 ? (
              <div className="px-6 py-6 text-center text-[13px] text-muted">Sin cobros en el filtro seleccionado.</div>
            ) : (
              rows.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] items-center gap-2.5 border-t border-border px-3.5 py-3 text-[13px]"
                >
                  <span>
                    <span className="block font-semibold">{p.mesa}</span>
                    <span className="block font-mono text-[10px] text-muted-2">
                      {p.fecha} {p.horaCreacion}
                    </span>
                  </span>
                  <span className="text-xs text-text-soft">{p.cobro!.cajeroNombre}</span>
                  <span className={`font-mono text-xs ${metodoColor(p.cobro!.metodoPago)}`}>{p.cobro!.metodoPago}</span>
                  <span className="text-right font-mono">{formatMoney(p.cobro!.total)}</span>
                  <span className="text-right font-mono text-muted">{formatMoney(p.cobro!.recibido)}</span>
                  <span className="text-right font-mono text-muted">{formatMoney(p.cobro!.vuelto)}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-3.5 flex flex-wrap gap-5 font-mono text-[13px]">
            <div>
              <span className="text-muted">Total </span>
              <span>{formatMoney(rows.reduce((a, p) => a + p.cobro!.total, 0))}</span>
            </div>
            <div>
              <span className="text-muted">Efectivo </span>
              <span>{formatMoney(sum('Efectivo'))}</span>
            </div>
            <div>
              <span className="text-muted">Sinpe </span>
              <span>{formatMoney(sum('Sinpe'))}</span>
            </div>
            <div>
              <span className="text-muted">Tarjeta </span>
              <span>{formatMoney(sum('Tarjeta'))}</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

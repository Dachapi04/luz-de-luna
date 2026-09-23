'use client';

import { useState } from 'react';
import { useViewGuard } from '@/hooks/useViewGuard';
import { usePedidosDesde, usePedidosDelDia } from '@/hooks/usePedidos';
import { useCompras } from '@/hooks/useCompras';
import { useCierre } from '@/hooks/useCierre';
import { totalesPeriodo, desglosePorProducto, montoPorMetodo } from '@/domain/pedidos';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PeriodCard } from '@/components/resumen/PeriodCard';
import { DesgloseBars } from '@/components/resumen/DesgloseBars';
import { formatMoney } from '@/lib/utils/money';
import { daysAgoStr, firstOfMonthStr, todayStr } from '@/lib/utils/date';
import { useToast } from '@/components/ui/ToastProvider';
import { cierresService } from '@/services/cierresService';
import { descargarRespaldoExcel } from '@/services/exportService';
import { ApiClientError } from '@/lib/api/client';
import type { MetodoPago } from '@/domain/types';

const RANGOS = [
  { key: 'hoy', label: 'Hoy', desde: todayStr() },
  { key: '7', label: '7 días', desde: daysAgoStr(6) },
  { key: '30', label: '30 días', desde: daysAgoStr(29) },
] as const;

export default function ResumenPage() {
  useViewGuard('resumen');
  const { show } = useToast();
  const [range, setRange] = useState<(typeof RANGOS)[number]['key']>('7');
  const [cierreFecha, setCierreFecha] = useState(todayStr());
  const [guardando, setGuardando] = useState(false);

  // 31 days covers "hoy/7/30" + "este mes" in the same subscription.
  const { data: pedidos } = usePedidosDesde(daysAgoStr(31));
  const { data: compras } = useCompras();
  const { data: pedidosCierreDia } = usePedidosDelDia(cierreFecha);
  const cierreGuardado = useCierre(cierreFecha);

  const hoy = totalesPeriodo(pedidos, compras, todayStr());
  const semana = totalesPeriodo(pedidos, compras, daysAgoStr(6));
  const mes = totalesPeriodo(pedidos, compras, firstOfMonthStr());

  const rangoActivo = RANGOS.find((r) => r.key === range)!;
  const desglose = desglosePorProducto(pedidos, rangoActivo.desde);

  const cobrosDia = pedidosCierreDia.filter((p) => p.pagado && p.cobro);
  const porMetodo = (m: MetodoPago) => cobrosDia.reduce((a, p) => a + montoPorMetodo(p, m), 0);
  const vendidoDia = cobrosDia.reduce((a, p) => a + (p.cobro?.total ?? 0), 0);
  const compradoDia = compras.filter((c) => c.fecha === cierreFecha).reduce((a, c) => a + c.total, 0);
  const gananciaDia = vendidoDia - compradoDia;

  async function guardarCierre() {
    setGuardando(true);
    try {
      await cierresService.guardar(cierreFecha);
      show(`Cierre de ${cierreFecha} guardado`);
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo guardar el cierre');
    } finally {
      setGuardando(false);
    }
  }

  async function exportar() {
    try {
      await descargarRespaldoExcel();
      show('Respaldo Excel generado');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo generar el respaldo');
    }
  }

  return (
    <>
      <PageHeader title={VIEW_META.resumen.label} subtitle={VIEW_META.resumen.subtitle} />

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <PeriodCard label="Hoy" {...hoy} />
        <PeriodCard label="Esta semana" {...semana} />
        <PeriodCard label="Este mes" {...mes} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(310px,1fr))] items-start gap-[18px]">
        <section className="rounded-lg border border-border bg-surface p-[17px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
              Productos vendidos en el rango
            </div>
            <div className="flex gap-1.5">
              {RANGOS.map((r) => (
                <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>
          <DesgloseBars rows={desglose} />
        </section>

        <section className="rounded-lg border border-border bg-surface p-[17px]">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">Cierre de caja</div>
          <Input
            type="date"
            label="Fecha"
            wrapperClassName="mb-3.5"
            value={cierreFecha}
            onChange={(e) => setCierreFecha(e.target.value)}
            max={todayStr()}
          />
          <div className="flex flex-col gap-2 font-mono text-[13px]">
            <Row label="Total vendido" value={formatMoney(vendidoDia)} />
            <Row label="Total comprado" value={formatMoney(compradoDia)} />
            <Row label="Ganancia" value={formatMoney(gananciaDia)} tone={gananciaDia >= 0 ? 'ok' : 'bad'} />
            <Row label="Efectivo" value={formatMoney(porMetodo('Efectivo'))} muted />
            <Row label="Sinpe" value={formatMoney(porMetodo('Sinpe'))} muted />
            <Row label="Tarjeta" value={formatMoney(porMetodo('Tarjeta'))} muted />
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <Button className="min-w-[150px] flex-1" disabled={guardando} onClick={guardarCierre}>
              {cierreGuardado ? 'Recalcular y guardar cierre' : `Guardar cierre de ${cierreFecha}`}
            </Button>
            <Button variant="secondary" className="min-w-[150px] flex-1" onClick={exportar}>
              Exportar respaldo Excel
            </Button>
          </div>
          {cierreGuardado && (
            <div className="mt-2.5 text-xs leading-relaxed text-muted">
              Cerrado por {cierreGuardado.cerradoPorNombre} a las {cierreGuardado.hora}. Guardar de nuevo reemplaza el
              cierre de esa fecha.
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Row({ label, value, tone, muted }: { label: string; value: string; tone?: 'ok' | 'bad'; muted?: boolean }) {
  return (
    <div
      className={
        'flex justify-between gap-2.5 ' +
        (tone === 'ok' ? 'text-ok-fg' : tone === 'bad' ? 'text-bad-fg' : muted ? 'text-muted' : 'text-text')
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

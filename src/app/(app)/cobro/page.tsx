'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useViewGuard } from '@/hooks/useViewGuard';
import { usePedidosAbiertos, usePedidosDelDia } from '@/hooks/usePedidos';
import { pagosDe, pedidoAbierto, saldoPendiente, totalPagado, totalPedido } from '@/domain/pedidos';
import { METODOS_PAGO, type MetodoPago, type Pedido } from '@/domain/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { EmptyState } from '@/components/ui/EmptyState';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SkeletonRows } from '@/components/ui/Spinner';
import { formatMoney, parseNumeric } from '@/lib/utils/money';
import { horaDe, todayStr } from '@/lib/utils/date';
import { useToast } from '@/components/ui/ToastProvider';
import { pedidosService } from '@/services/pedidosService';
import { ApiClientError } from '@/lib/api/client';
import { BotonComprobante } from '@/components/comprobante/BotonComprobante';

export default function CobroPage() {
  useViewGuard('cobro');
  const { show } = useToast();
  const { data: abiertos, loading } = usePedidosAbiertos();
  const [selMesa, setSelMesa] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('Efectivo');
  const [montoStr, setMontoStr] = useState('');
  const [recibidoStr, setRecibidoStr] = useState('');
  const [nota, setNota] = useState('');
  const [fechaVenta, setFechaVenta] = useState(todayStr());
  const [cobrando, setCobrando] = useState(false);
  /** Último pedido cobrado por completo en esta pantalla — muestra el botón de comprobante. */
  const [cobrado, setCobrado] = useState<Pedido | null>(null);
  const hoy = usePedidosDelDia(todayStr());
  const cobradasHoy = hoy.data
    .filter((p) => p.pagado)
    .sort((a, b) => ((a.cobro?.fechaHora ?? '') < (b.cobro?.fechaHora ?? '') ? 1 : -1));

  const pedido = selMesa ? pedidoAbierto(abiertos, selMesa) : undefined;
  const total = pedido ? totalPedido(pedido) : 0;
  const pagado = pedido ? totalPagado(pedido) : 0;
  const falta = pedido ? saldoPendiente(pedido) : 0;
  const pagosPrevios = pedido?.pagos ?? [];

  const monto = parseNumeric(montoStr);
  const recibido = metodo === 'Efectivo' ? parseNumeric(recibidoStr) : monto;
  const vuelto = Math.max(recibido - monto, 0);
  const excedeSaldo = monto - falta > 0.01;

  function seleccionar(p: Pedido) {
    setCobrado(null);
    setSelMesa(p.mesa);
    setMetodo('Efectivo');
    setMontoStr(String(saldoPendiente(p)));
    setRecibidoStr('');
    setNota('');
    setFechaVenta(todayStr());
  }

  async function registrar() {
    if (!pedido || !selMesa || monto <= 0) return;
    setCobrando(true);
    try {
      const resultado = await pedidosService.registrarPago(selMesa, {
        monto,
        metodoPago: metodo,
        nota: nota.trim() || undefined,
        recibido: metodo === 'Efectivo' ? recibido : undefined,
        fecha: fechaVenta || undefined,
      });
      if (resultado.pagado) {
        show(`${selMesa} cobrada por completo · ${formatMoney(total)}`);
        setCobrado(resultado);
        setSelMesa(null);
      } else {
        const nuevaFalta = saldoPendiente(resultado);
        show(`Abono de ${formatMoney(monto)} registrado · falta ${formatMoney(nuevaFalta)}`);
        setMontoStr(String(nuevaFalta));
      }
      setRecibidoStr('');
      setNota('');
      setMetodo('Efectivo');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo registrar el pago', 'error');
    } finally {
      setCobrando(false);
    }
  }

  return (
    <>
      <PageHeader title={VIEW_META.cobro.label} subtitle={VIEW_META.cobro.subtitle} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(310px,1fr))] items-start gap-[18px]">
        <section>
          <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">Mesas ocupadas</div>
          {loading ? (
            <SkeletonRows count={3} />
          ) : abiertos.length === 0 ? (
            <EmptyState>No hay mesas por cobrar.</EmptyState>
          ) : (
            <div className="flex flex-col gap-2.5">
              {abiertos.map((p) => {
                const on = selMesa === p.mesa;
                const faltaP = saldoPendiente(p);
                const tienePagos = (p.pagos?.length ?? 0) > 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => seleccionar(p)}
                    className={clsx(
                      'transition-base press-scale flex items-center justify-between gap-2.5 rounded-lg border p-3.5 text-left',
                      on ? 'border-gold bg-[oklch(0.27_0.045_70)]' : 'border-border bg-surface hover:border-gold'
                    )}
                  >
                    <span>
                      <span className="block font-serif text-lg font-semibold">{p.mesa}</span>
                      <span className="block font-mono text-[11px] text-muted-2">
                        {p.horaCreacion} · {p.meseroNombre} · {p.items.length} líneas
                        {tienePagos && ' · con abonos'}
                      </span>
                    </span>
                    <span className="font-mono text-sm text-gold">{formatMoney(faltaP)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {cobradasHoy.length > 0 && (
            <>
              <div className="mb-2.5 mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
                Cobradas hoy · reimprimir comprobante
              </div>
              <div className="flex flex-col gap-2">
                {cobradasHoy.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2.5 rounded-lg border border-border bg-surface-sunken px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block font-serif text-base font-semibold">{p.mesa}</span>
                      <span className="block font-mono text-[11px] text-muted-2">
                        {p.cobro?.fechaHora ? horaDe(p.cobro.fechaHora) : p.horaCreacion} · {formatMoney(totalPedido(p))}
                      </span>
                    </span>
                    <BotonComprobante pedido={p} size="sm">
                      🧾 Imprimir
                    </BotonComprobante>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-[17px]">
          {!pedido && cobrado && (
            <div className="flex flex-col items-center gap-3 px-2 py-7 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ok-fg">✅ Cuenta pagada</div>
              <div className="font-serif text-[22px] font-semibold">{cobrado.mesa}</div>
              <div className="font-mono text-2xl text-gold">{formatMoney(totalPedido(cobrado))}</div>
              {(() => {
                const vuelto = pagosDe(cobrado).at(-1)?.vuelto ?? 0;
                return vuelto > 0 ? <div className="font-mono text-sm text-text-soft">Vuelto {formatMoney(vuelto)}</div> : null;
              })()}
              <BotonComprobante pedido={cobrado} variant="primary" fullWidth className="mt-2 py-3.5 text-[15px]" />
              <Button variant="ghost" onClick={() => setCobrado(null)}>
                Listo
              </Button>
            </div>
          )}
          {!pedido && !cobrado && (
            <div className="px-2 py-9 text-center text-[13px] text-muted">Selecciona una mesa para cobrar.</div>
          )}
          {pedido && (
            <>
              <div className="flex items-baseline justify-between gap-2.5 border-b border-border pb-[11px]">
                <div className="font-serif text-[22px] font-semibold">{pedido.mesa}</div>
                <div className="font-mono text-[11px] text-muted-2">
                  {pedido.horaCreacion} · {pedido.meseroNombre}
                </div>
              </div>
              <div className="flex flex-col gap-2 border-b border-border py-3">
                {pedido.items.map((i) => (
                  <div key={i.id} className="flex items-baseline gap-2.5 text-[13px]">
                    <span className="min-w-[26px] font-mono text-muted">{i.cantidad}×</span>
                    <span className="min-w-0 flex-1 leading-snug">
                      {i.producto}
                      {i.detalle && <span className="text-muted-2"> · {i.detalle}</span>}
                    </span>
                    <span className="font-mono">{formatMoney(i.total)}</span>
                  </div>
                ))}
              </div>

              {pagosPrevios.length > 0 && (
                <div className="flex flex-col gap-1.5 border-b border-border py-3">
                  <div className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">Abonado</div>
                  {pagosPrevios.map((pg) => (
                    <div key={pg.id} className="flex items-baseline gap-2.5 text-[13px]">
                      <span className="min-w-0 flex-1 text-muted">
                        {pg.nota || 'Pago'} <span className="font-mono text-[11px] text-muted-2">· {pg.metodoPago}</span>
                      </span>
                      <span className="font-mono text-ok-fg">{formatMoney(pg.monto)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1 py-3 font-mono">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-muted">Total</span>
                  <span className="text-sm">{formatMoney(total)}</span>
                </div>
                {pagado > 0 && (
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-muted">Pagado</span>
                    <span className="text-sm text-ok-fg">{formatMoney(pagado)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px]">Falta</span>
                  <span className="text-2xl text-gold">{formatMoney(falta)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                <div className="flex flex-wrap gap-3.5">
                  <Input
                    type="date"
                    label="Fecha de la venta"
                    value={fechaVenta}
                    onChange={(e) => setFechaVenta(e.target.value)}
                    max={todayStr()}
                    wrapperClassName="w-[170px]"
                  />
                  <Input
                    label="¿Quién paga? (opcional)"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Juan, Pedro, Mónica…"
                    wrapperClassName="min-w-[180px] flex-1"
                  />
                </div>
                <div>
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">Método de pago</div>
                  <div className="flex flex-wrap gap-1.5">
                    {METODOS_PAGO.map((m) => (
                      <Chip key={m} active={metodo === m} onClick={() => setMetodo(m)} pill={false}>
                        {m}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3.5">
                  <Input
                    label="Monto a abonar"
                    mono
                    value={montoStr}
                    onChange={(e) => setMontoStr(e.target.value)}
                    placeholder="0"
                    wrapperClassName="w-[150px]"
                  />
                  {metodo === 'Efectivo' && (
                    <>
                      <Input
                        label="Recibido"
                        mono
                        value={recibidoStr}
                        onChange={(e) => setRecibidoStr(e.target.value)}
                        placeholder="0"
                        wrapperClassName="w-[150px]"
                      />
                      <div className={clsx('pb-[11px] font-mono text-sm', recibido && recibido < monto ? 'text-bad-fg' : 'text-text')}>
                        Vuelto {formatMoney(vuelto)}
                      </div>
                    </>
                  )}
                </div>
                {excedeSaldo && (
                  <div className="font-mono text-xs text-bad-fg">El monto no puede superar el saldo pendiente ({formatMoney(falta)}).</div>
                )}
                <Button
                  disabled={cobrando || monto <= 0 || excedeSaldo || (metodo === 'Efectivo' && recibido < monto)}
                  onClick={registrar}
                  className="py-3.5 text-[15px]"
                >
                  {cobrando
                    ? 'Registrando…'
                    : monto >= falta && falta > 0
                      ? `Cobrar ${formatMoney(monto)} · ${metodo}`
                      : `Abonar ${formatMoney(monto)} · ${metodo}`}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

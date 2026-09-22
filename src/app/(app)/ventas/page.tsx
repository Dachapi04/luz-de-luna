'use client';

import { useState } from 'react';
import { useViewGuard } from '@/hooks/useViewGuard';
import { usePedidosDesde } from '@/hooks/usePedidos';
import { totalPedido } from '@/domain/pedidos';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Spinner';
import { VentaCard } from '@/components/ventas/VentaCard';
import { includesNorm } from '@/lib/utils/normalize';
import { formatMoney } from '@/lib/utils/money';
import { daysAgoStr } from '@/lib/utils/date';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { pedidosService } from '@/services/pedidosService';
import { ApiClientError } from '@/lib/api/client';

/** Últimos 60 días — suficiente para operar y editar pedidos recientes sin descargar todo el historial. */
const VENTANA_DIAS = 59;

export default function VentasPage() {
  useViewGuard('ventas');
  const { show } = useToast();
  const confirm = useConfirm();
  const { data: pedidos, loading } = usePedidosDesde(daysAgoStr(VENTANA_DIAS));
  const [filtro, setFiltro] = useState('');

  const list = pedidos
    .filter((p) => !filtro || includesNorm(p.mesa, filtro) || p.fecha.includes(filtro) || includesNorm(p.meseroNombre, filtro))
    .slice()
    .sort((a, b) => (b.fecha + b.horaCreacion > a.fecha + a.horaCreacion ? 1 : -1));

  async function quitarItem(pedidoId: string, itemId: string, cantidad: number, producto: string, mesa: string) {
    const ok = await confirm({
      title: 'Quitar línea',
      body: `¿Quitar ${cantidad}× ${producto} del pedido de ${mesa}? Se restituye el inventario.`,
    });
    if (!ok) return;
    try {
      await pedidosService.quitarItem(pedidoId, itemId);
      show('Línea quitada, inventario restituido');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo quitar la línea');
    }
  }

  async function eliminarPedido(id: string, mesa: string, fecha: string, pagado: boolean) {
    const ok = await confirm({
      title: 'Eliminar pedido',
      body: `¿Eliminar el pedido de ${mesa} del ${fecha}?${pagado ? ' Ya está cobrado; también se borra su registro de cobro.' : ' Se restituye el inventario de sus líneas.'}`,
    });
    if (!ok) return;
    try {
      await pedidosService.eliminar(id);
      show('Pedido eliminado');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el pedido');
    }
  }

  return (
    <>
      <PageHeader title={VIEW_META.ventas.label} subtitle={VIEW_META.ventas.subtitle} />

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por mesa, fecha o mesero" className="min-w-[200px] flex-1 text-[13px]" />
        <div className="font-mono text-[11px] text-muted-2">
          {list.length} pedidos · {formatMoney(list.reduce((a, p) => a + totalPedido(p), 0))}
        </div>
      </div>

      {loading ? (
        <SkeletonRows count={5} />
      ) : list.length === 0 ? (
        <EmptyState>
          {pedidos.length === 0
            ? 'Aún no hay pedidos registrados. Los pedidos aparecen aquí cuando un mesero abre una mesa.'
            : 'Ningún pedido coincide con el filtro.'}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((p) => (
            <VentaCard
              key={p.id}
              pedido={p}
              onQuitarItem={(itemId) => {
                const item = p.items.find((i) => i.id === itemId)!;
                quitarItem(p.id, itemId, item.cantidad, item.producto, p.mesa);
              }}
              onEliminar={() => eliminarPedido(p.id, p.mesa, p.fecha, p.pagado)}
            />
          ))}
        </div>
      )}
    </>
  );
}

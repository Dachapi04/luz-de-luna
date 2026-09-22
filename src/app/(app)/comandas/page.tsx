'use client';

import { useState } from 'react';
import { useViewGuard } from '@/hooks/useViewGuard';
import { usePedidosDelDia } from '@/hooks/usePedidos';
import { estacionPendiente } from '@/domain/pedidos';
import { ESTACION_BY_ROLE } from '@/domain/permissions';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Spinner';
import { ComandaCard } from '@/components/comandas/ComandaCard';
import { todayStr } from '@/lib/utils/date';
import { pedidosService } from '@/services/pedidosService';
import { useToast } from '@/components/ui/ToastProvider';
import { ApiClientError } from '@/lib/api/client';

type Tab = 'activas' | 'historial';

export default function ComandasPage() {
  const user = useViewGuard('comandas');
  const { show } = useToast();
  const { data: pedidos, loading } = usePedidosDelDia(todayStr());
  const [tab, setTab] = useState<Tab>('activas');

  const estacion = user ? ESTACION_BY_ROLE[user.rol] ?? 'cocina' : 'cocina';

  const list = pedidos
    .filter((p) => p.items.some((i) => i.destino === estacion))
    .filter((p) => {
      const pendiente = estacionPendiente(p, estacion);
      return tab === 'activas' ? pendiente && !p.pagado : !pendiente;
    })
    .sort((a, b) => (a.horaCreacion < b.horaCreacion ? -1 : 1));

  async function toggle(pedidoId: string, itemId: string, listo: boolean) {
    try {
      await pedidosService.marcarListo(pedidoId, itemId, listo);
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo actualizar la línea');
    }
  }

  return (
    <>
      <PageHeader title={VIEW_META.comandas.label} subtitle={VIEW_META.comandas.subtitle} />

      <div className="mb-4 flex gap-1.5">
        <Chip active={tab === 'activas'} onClick={() => setTab('activas')}>
          Activas
        </Chip>
        <Chip active={tab === 'historial'} onClick={() => setTab('historial')}>
          Historial del día
        </Chip>
      </div>

      {loading ? (
        <SkeletonRows count={3} />
      ) : list.length === 0 ? (
        <EmptyState>
          {tab === 'activas'
            ? `No hay comandas activas para ${estacion === 'cocina' ? 'cocina' : 'bar'}.`
            : 'Aún no hay comandas completadas hoy.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] items-start gap-3.5">
          {list.map((p) => (
            <ComandaCard
              key={p.id}
              pedido={p}
              estacion={estacion}
              onToggle={(itemId, listo) => toggle(p.id, itemId, listo)}
            />
          ))}
        </div>
      )}
    </>
  );
}

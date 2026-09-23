'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useViewGuard } from '@/hooks/useViewGuard';
import { usePedidosAbiertos } from '@/hooks/usePedidos';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { StatCard } from '@/components/ui/StatCard';
import { MesaSection } from '@/components/mesas/MesaSection';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SkeletonRows } from '@/components/ui/Spinner';
import { MESAS_BARRA, MESAS_SALON } from '@/domain/types';
import { formatMoney } from '@/lib/utils/money';
import { useToast } from '@/components/ui/ToastProvider';

export default function MesasPage() {
  useViewGuard('mesas');
  const router = useRouter();
  const { show } = useToast();
  const { data: abiertos, loading } = usePedidosAbiertos();
  const [customName, setCustomName] = useState('');

  const goToPedido = (mesa: string) => router.push(`/pedido?mesa=${encodeURIComponent(mesa)}`);

  const fijas: readonly string[] = [...MESAS_BARRA, ...MESAS_SALON];
  const extras = Array.from(new Set(abiertos.map((p) => p.mesa).filter((m) => !fijas.includes(m))));

  const consumoEnPiso = abiertos.reduce((a, p) => a + p.items.reduce((b, i) => b + i.total, 0), 0);
  const lineasPendientes = abiertos.reduce((a, p) => a + p.items.filter((i) => !i.listo).length, 0);

  return (
    <>
      <PageHeader title={VIEW_META.mesas.label} subtitle={VIEW_META.mesas.subtitle} />

      {loading ? (
        <SkeletonRows count={3} />
      ) : (
        <>
          <div className="mb-[18px] flex flex-wrap gap-2.5">
            <StatCard label="Ocupadas" value={`${abiertos.length}/13`} />
            <StatCard label="Consumo en piso" value={formatMoney(consumoEnPiso)} />
            <StatCard label="Líneas pendientes" value={String(lineasPendientes)} />
          </div>

          <MesaSection titulo="Barra" nombres={[...MESAS_BARRA]} pedidos={abiertos} onSelect={goToPedido} />
          <MesaSection titulo="Salón" nombres={[...MESAS_SALON]} pedidos={abiertos} onSelect={goToPedido} />
          {extras.length > 0 && (
            <MesaSection titulo="Personalizadas" nombres={extras} pedidos={abiertos} onSelect={goToPedido} />
          )}

          <div className="flex flex-wrap items-end gap-2.5 rounded-lg border border-dashed border-border-strong p-3.5">
            <Input
              label="Mesa personalizada"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Terraza 2, Para llevar…"
              wrapperClassName="min-w-[190px] flex-1"
            />
            <Button
              onClick={() => {
                if (!customName.trim()) {
                  show('Escribe un nombre de mesa', 'error');
                  return;
                }
                goToPedido(customName.trim());
                setCustomName('');
              }}
            >
              Abrir
            </Button>
          </div>
        </>
      )}
    </>
  );
}

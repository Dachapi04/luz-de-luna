'use client';

import clsx from 'clsx';
import { usePathname, useSearchParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { usePedidosAbiertos, usePedidosDelDia } from '@/hooks/usePedidos';
import { useProductos } from '@/hooks/useProductos';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useAvisoComandas } from '@/hooks/useAvisoComandas';
import { insumosBajoStock } from '@/domain/inventory';
import { comandasDeEstacion } from '@/domain/pedidos';
import { ESTACION_BY_ROLE, type ViewKey } from '@/domain/permissions';
import { todayStr } from '@/lib/utils/date';
import type { Usuario } from '@/domain/types';

export function AppShellContent({ user, children }: { user: Usuario; children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const abiertos = usePedidosAbiertos();
  const hoy = usePedidosDelDia(todayStr());
  const productos = useProductos();
  const usuarios = useUsuarios();

  const estacion = ESTACION_BY_ROLE[user.rol];
  const comandas = estacion ? comandasDeEstacion(abiertos.data, hoy.data, estacion) : null;
  const pendientesEstacion = comandas?.activas.length ?? 0;
  const aviso = useAvisoComandas(
    estacion,
    comandas ? [...comandas.activas, ...comandas.historial] : [],
    abiertos.loading || hoy.loading
  );

  const badges: Partial<Record<ViewKey, string>> = {
    mesas: String(abiertos.data.length),
    pedido: pathname.startsWith('/pedido') && searchParams.get('mesa') ? '•' : '',
    comandas: String(pendientesEstacion),
    cobro: String(abiertos.data.length),
    inventario: String(insumosBajoStock(productos.data).length),
    usuarios: String(usuarios.data.length),
  };

  const wide = user.rol === 'admin';

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader wide={wide} badges={badges} />
      <main className={clsx('mx-auto w-full flex-1 px-[18px] pb-14 pt-5', wide ? 'max-w-shell-admin' : 'max-w-shell')}>
        {aviso.bloqueado && (
          <button
            type="button"
            onClick={aviso.activar}
            className="transition-base press-scale mb-4 w-full rounded-lg border border-gold bg-gold px-4 py-3 text-left text-sm font-semibold text-ink"
          >
            🔔 Toca aquí para activar el sonido de comandas nuevas
          </button>
        )}
        {children}
      </main>
    </div>
  );
}

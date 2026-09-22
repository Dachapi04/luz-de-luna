'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { Spinner } from '@/components/ui/Spinner';
import { usePedidosAbiertos, usePedidosDelDia } from '@/hooks/usePedidos';
import { useProductos } from '@/hooks/useProductos';
import { useUsuarios } from '@/hooks/useUsuarios';
import { insumosBajoStock } from '@/domain/inventory';
import { estacionPendiente } from '@/domain/pedidos';
import { ESTACION_BY_ROLE, type ViewKey } from '@/domain/permissions';
import { todayStr } from '@/lib/utils/date';
import clsx from 'clsx';

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const abiertos = usePedidosAbiertos();
  const hoy = usePedidosDelDia(todayStr());
  const productos = useProductos();
  const usuarios = useUsuarios();

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) router.replace('/login');
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-gold" />
      </div>
    );
  }

  const estacion = ESTACION_BY_ROLE[user.rol];
  const pendientesEstacion = estacion
    ? hoy.data.filter((p) => !p.pagado && estacionPendiente(p, estacion)).length
    : 0;

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
        {children}
      </main>
    </div>
  );
}

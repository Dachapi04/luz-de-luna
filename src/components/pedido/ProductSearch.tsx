'use client';

import clsx from 'clsx';
import type { Producto } from '@/domain/types';
import { disponiblePlatillo } from '@/domain/inventory';
import { formatMoney } from '@/lib/utils/money';
import { includesNorm } from '@/lib/utils/normalize';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';

export function ProductSearch({
  productos,
  query,
  onQuery,
  onPick,
}: {
  productos: Producto[];
  query: string;
  onQuery: (q: string) => void;
  onPick: (p: Producto) => void;
}) {
  const platillos = productos.filter((p) => p.tipo === 'platillo' && (!query || includesNorm(p.nombre, query)));
  const results = platillos.slice(0, 14);
  const hayPlatillos = productos.some((p) => p.tipo === 'platillo');

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-[15px]">
      <Input label="Buscar platillo" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Buscar platillo por nombre" />
      <div className="flex max-h-[330px] flex-col gap-1.5 overflow-auto">
        {results.length === 0 && (
          <EmptyState>{hayPlatillos ? 'Sin coincidencias.' : 'Todavía no hay platillos dados de alta en Inventario.'}</EmptyState>
        )}
        {results.map((p) => {
          const disp = disponiblePlatillo(p, productos);
          const sinStock = disp <= 0;
          const nota = disp === Infinity ? 'sin receta' : sinStock ? 'sin insumos' : `disponible ${disp}`;
          return (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className={clsx(
                'transition-base press-scale flex items-center justify-between gap-2.5 rounded-md border bg-surface-hover px-3 py-[11px] text-left',
                sinStock ? 'border-[oklch(0.4_0.08_28)]' : 'border-border-strong hover:border-gold'
              )}
            >
              <span>
                <span className="block text-sm font-semibold">{p.nombre}</span>
                <span className={clsx('block font-mono text-[11px]', sinStock ? 'text-bad-fg' : disp < 5 ? 'text-warn-fg' : 'text-muted')}>
                  {nota}
                </span>
              </span>
              <span className="font-mono text-[13px] text-gold">{formatMoney(p.precio)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import clsx from 'clsx';
import type { Producto } from '@/domain/types';
import { disponiblePlatillo, esBajoStock } from '@/domain/inventory';
import { formatMoney } from '@/lib/utils/money';
import { Badge } from '@/components/ui/Badge';

export function ProductoCard({
  producto,
  productos,
  onAjustar,
  onEdit,
  onDelete,
}: {
  producto: Producto;
  productos: Producto[];
  onAjustar: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const esInsumo = producto.tipo === 'insumo';
  const bajo = esInsumo && esBajoStock(producto);
  const disp = esInsumo ? null : disponiblePlatillo(producto, productos);
  const sinInsumos = disp !== null && disp <= 0;

  return (
    <div
      className={clsx(
        'stagger-child flex flex-col gap-2 rounded-md border bg-surface-sunken p-3',
        bajo || sinInsumos ? 'border-[oklch(0.4_0.06_50)]' : 'border-border'
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">{producto.nombre}</span>
          <span className="block font-mono text-[11px] text-muted-2">
            {esInsumo
              ? `${producto.categoria} · mínimo ${producto.stockMinimo} ${producto.unidad}`
              : `${producto.categoria} · ${formatMoney(producto.precio)} · ${producto.receta?.length ?? 0} insumos`}
          </span>
        </span>
        <Badge tone={esInsumo ? (bajo ? 'warn' : 'ok') : sinInsumos ? 'bad' : 'luna'}>
          {esInsumo
            ? bajo
              ? 'Reabastecer'
              : 'En stock'
            : sinInsumos
              ? 'Sin insumos'
              : `Alcanza ${disp === Infinity ? '∞' : disp}`}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {esInsumo && (
          <>
            <button onClick={() => onAjustar(-1)} className="transition-fast press-scale h-[30px] w-[30px] cursor-pointer rounded-[8px] border border-border-strong bg-surface-raised">
              −
            </button>
            <span className="min-w-[84px] text-center font-mono text-[13px]">
              {producto.cantidad} {producto.unidad}
            </span>
            <button onClick={() => onAjustar(1)} className="transition-fast press-scale h-[30px] w-[30px] cursor-pointer rounded-[8px] border border-border-strong bg-surface-raised">
              +
            </button>
          </>
        )}
        <button
          onClick={onEdit}
          className="ml-auto transition-fast cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-[7px] text-xs text-text-soft hover:border-gold"
        >
          Editar
        </button>
        <button
          onClick={onDelete}
          className="transition-fast cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-[7px] text-xs text-[oklch(0.74_0.09_30)]"
        >
          Eliminar
        </button>
      </div>
      {!esInsumo && producto.receta && producto.receta.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-1.5">
          {producto.receta.map((r) => (
            <div key={r.insumoId} className="flex justify-between font-mono text-[11px] text-muted">
              <span>{r.insumoNombre}</span>
              <span>{r.cantidad}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

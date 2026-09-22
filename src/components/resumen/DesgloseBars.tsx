import { formatMoney } from '@/lib/utils/money';

export function DesgloseBars({ rows }: { rows: { nombre: string; qty: number; monto: number }[] }) {
  if (!rows.length) return <div className="text-[13px] text-muted-2">Sin ventas en el rango.</div>;
  const max = rows[0]!.monto || 1;
  return (
    <div className="flex flex-col gap-2.5">
      {rows.slice(0, 8).map((r) => (
        <div key={r.nombre}>
          <div className="mb-1.5 flex justify-between gap-2.5 text-[13px]">
            <span className="font-semibold">{r.nombre}</span>
            <span className="font-mono text-muted">
              {r.qty} u · {formatMoney(r.monto)}
            </span>
          </div>
          <div className="h-[5px] rounded-[4px] bg-surface-hover">
            <div className="h-[5px] rounded-[4px] bg-gold" style={{ width: `${Math.round((r.monto / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

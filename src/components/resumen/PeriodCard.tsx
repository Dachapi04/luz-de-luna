import clsx from 'clsx';
import { formatMoney } from '@/lib/utils/money';

export function PeriodCard({
  label,
  ventas,
  compras,
  ganancia,
}: {
  label: string;
  ventas: number;
  compras: number;
  ganancia: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">{label}</div>
      <div className="my-[5px] font-serif text-[27px] text-gold">{formatMoney(ventas)}</div>
      <div className="flex flex-col gap-1 font-mono text-xs text-muted">
        <div className="flex justify-between">
          <span>Compras</span>
          <span>{formatMoney(compras)}</span>
        </div>
        <div className="flex justify-between">
          <span>Ganancia</span>
          <span className={clsx(ganancia >= 0 ? 'text-ok-fg' : 'text-bad-fg')}>{formatMoney(ganancia)}</span>
        </div>
      </div>
    </div>
  );
}

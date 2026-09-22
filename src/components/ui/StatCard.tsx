import clsx from 'clsx';

export function StatCard({
  label,
  value,
  valueClassName,
  children,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-[132px] flex-1 rounded-lg border border-border bg-surface px-[15px] py-[13px] animate-slide-up">
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-2">{label}</div>
      <div className={clsx('mt-[5px] font-serif text-2xl leading-tight', valueClassName)}>{value}</div>
      {children}
    </div>
  );
}

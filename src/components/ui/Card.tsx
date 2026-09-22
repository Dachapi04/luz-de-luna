import clsx from 'clsx';

export function Card({
  children,
  className,
  padding = 'md',
  raised = false,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: 'md' | 'sm' | 'none';
  raised?: boolean;
}) {
  const paddingClasses = { md: 'p-[17px]', sm: 'p-3', none: '' }[padding];
  return (
    <div
      className={clsx(
        'rounded-lg border border-border',
        raised ? 'bg-surface-raised' : 'bg-surface',
        paddingClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

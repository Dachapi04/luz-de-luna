'use client';

import clsx from 'clsx';

/** Toggle pill used for nav tabs, range pickers, payment methods, tipo tabs, etc. */
export function Chip({
  active,
  onClick,
  children,
  className,
  pill = true,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  pill?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'transition-base press-scale cursor-pointer whitespace-nowrap border px-3.5 py-2 text-[13px]',
        pill ? 'rounded-full' : 'rounded-md',
        active ? 'border-gold bg-gold font-semibold text-ink' : 'border-border-strong bg-surface-raised text-text-soft',
        className
      )}
    >
      {children}
    </button>
  );
}

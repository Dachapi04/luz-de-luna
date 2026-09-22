'use client';

import { forwardRef, useId } from 'react';
import clsx from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, className, wrapperClassName, id, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const select = (
    <select
      ref={ref}
      id={selectId}
      className={clsx(
        'transition-fast w-full rounded-md border border-input-border bg-input-bg px-3 py-[10px] text-[15px] outline-none',
        'focus-visible:border-gold',
        className
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  if (!label) return select;

  return (
    <label htmlFor={selectId} className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">{label}</span>
      {select}
    </label>
  );
});

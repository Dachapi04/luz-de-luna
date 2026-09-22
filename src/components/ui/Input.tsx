'use client';

import { forwardRef, useId } from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  mono?: boolean;
  /** Sizes the outer <label> wrapper — use this (not className) when the field sits in a flex row. */
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, mono, className, wrapperClassName, id, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const input = (
    <input
      ref={ref}
      id={inputId}
      className={clsx(
        'transition-fast w-full rounded-md border border-input-border bg-input-bg px-3 py-[10px] text-[15px] outline-none',
        'focus-visible:border-gold',
        mono && 'font-mono',
        className
      )}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label htmlFor={inputId} className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">{label}</span>
      {input}
    </label>
  );
});

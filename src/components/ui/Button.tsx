'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'danger-solid' | 'ghost';
type Size = 'md' | 'sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'border-0 bg-gold text-ink font-semibold hover:bg-gold-hover',
  secondary: 'border border-border-strong bg-transparent text-text hover:border-gold',
  danger: 'border border-border-strong bg-transparent text-bad-fg hover:border-[oklch(0.6_0.14_30)]',
  'danger-solid': 'border-0 bg-danger text-danger-fg font-semibold hover:opacity-90',
  ghost: 'border-0 bg-transparent text-muted hover:text-text',
};

const sizeClasses: Record<Size, string> = {
  md: 'px-4 py-3 text-sm rounded-md',
  sm: 'px-3 py-2 text-xs rounded-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        'transition-base press-scale inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

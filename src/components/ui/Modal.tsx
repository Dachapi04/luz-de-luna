'use client';

import { useEffect, useRef } from 'react';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-20 flex animate-fade-in items-center justify-center bg-[oklch(0.12_0.01_52_/_0.72)] p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-[400px] animate-scale-in rounded-xl border border-border-strong bg-surface-raised p-[22px] shadow-[var(--shadow-modal)] outline-none"
      >
        {children}
      </div>
    </div>
  );
}

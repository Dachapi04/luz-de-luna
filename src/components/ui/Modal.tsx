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
  // Callers pass an inline onClose, so its identity changes every render.
  // Keep it in a ref so the effect below only runs on mount — otherwise each
  // keystroke in a field inside the modal would re-focus the dialog and the
  // user would have to click back into the input after every digit.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    // Don't steal focus from an autoFocus field inside the dialog.
    if (!dialogRef.current?.contains(document.activeElement)) dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-20 flex animate-fade-in items-center justify-center bg-[oklch(0.12_0.01_52_/_0.72)] p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onCloseRef.current()}
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

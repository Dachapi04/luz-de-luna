'use client';

import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';

export interface SearchSelectOption {
  value: string;
  label: string;
}

/**
 * Combobox: type to filter a long list of named options, click (or Enter)
 * to pick one. Use this instead of a plain <select> whenever the list can
 * grow past a handful of items — scrolling a native dropdown to find one
 * insumo among 100 is exactly the friction this avoids.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar…',
  label,
  emptyMessage = 'Sin coincidencias.',
  className,
}: {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  const selected = options.find((o) => o.value === value);

  // Reflect the current selection in the input once the user isn't
  // actively typing/searching (e.g. after picking, or on mount).
  useEffect(() => {
    if (!open) setQuery(selected ? selected.label : '');
  }, [selected, open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

  function pick(o: SearchSelectOption) {
    onChange(o.value);
    setQuery(o.label);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={clsx('relative flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={(e) => {
          if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
            return;
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const o = filtered[highlight];
            if (o) pick(o);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="transition-fast w-full rounded-md border border-input-border bg-input-bg px-3 py-[10px] text-[15px] outline-none focus-visible:border-gold"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-md border border-border-strong bg-surface-raised shadow-[var(--shadow-modal)] animate-scale-in">
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-[13px] text-muted-2">{emptyMessage}</div>
          ) : (
            filtered.map((o, i) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                className={clsx(
                  'block w-full cursor-pointer px-3 py-2.5 text-left text-[13px] transition-fast',
                  i === highlight ? 'bg-gold text-ink' : 'text-text hover:bg-surface-hover'
                )}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

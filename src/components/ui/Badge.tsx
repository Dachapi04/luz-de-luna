import clsx from 'clsx';

export type BadgeTone = 'ok' | 'warn' | 'bad' | 'luna' | 'neutral';

const toneClasses: Record<BadgeTone, string> = {
  ok: 'bg-ok text-ok-fg',
  warn: 'bg-warn text-warn-fg',
  bad: 'bg-bad text-bad-fg',
  luna: 'bg-luna-bg text-luna-fg',
  neutral: 'bg-surface-hover text-text-soft',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-block whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px]',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

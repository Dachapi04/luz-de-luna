import clsx from 'clsx';

/** The candlelight mark: a small radial-gradient moon used in the header and login. */
export function Logo({ size = 19 }: { size?: number }) {
  return (
    <span
      className={clsx('block shrink-0 rounded-full')}
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(circle at 34% 32%, oklch(0.92 0.09 88), oklch(0.72 0.1 78) 62%, oklch(0.4 0.05 70))',
      }}
      aria-hidden="true"
    />
  );
}

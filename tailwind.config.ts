import type { Config } from 'tailwindcss';

// All color/typography values point at CSS custom properties defined in
// src/styles/tokens.css, so the palette lives in exactly one place.
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        'surface-sunken': 'var(--color-surface-sunken)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        'input-bg': 'var(--color-input-bg)',
        'input-border': 'var(--color-input-border)',
        text: 'var(--color-text)',
        'text-soft': 'var(--color-text-soft)',
        muted: 'var(--color-muted)',
        'muted-2': 'var(--color-muted-2)',
        gold: 'var(--color-gold)',
        'gold-hover': 'var(--color-gold-hover)',
        ink: 'var(--color-ink)',
        luna: 'var(--color-luna)',
        'luna-bg': 'var(--color-luna-bg)',
        'luna-fg': 'var(--color-luna-fg)',
        ok: 'var(--color-ok)',
        'ok-fg': 'var(--color-ok-fg)',
        warn: 'var(--color-warn)',
        'warn-fg': 'var(--color-warn-fg)',
        bad: 'var(--color-bad)',
        'bad-fg': 'var(--color-bad-fg)',
        danger: 'var(--color-danger)',
        'danger-fg': 'var(--color-danger-fg)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '7px',
        md: '9px',
        lg: '12px',
        xl: '14px',
      },
      maxWidth: {
        shell: '620px',
        'shell-admin': '1320px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;

export function formatMoney(n: number | null | undefined): string {
  return '₡' + Math.round(n || 0).toLocaleString('es-CR');
}

/** Parses free-text money/quantity input (e.g. "1,500", "3.5kg") into a number. */
export function parseNumeric(value: string | number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

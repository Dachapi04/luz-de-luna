/**
 * Zona horaria del negocio. Todas las fechas/horas se calculan aquí y no en
 * la del proceso: en Vercel el servidor corre en UTC, así que a partir de
 * las 18:00 en Costa Rica `new Date()` "local" ya es el día siguiente y los
 * pedidos quedaban guardados con la fecha de mañana (y no aparecían en las
 * comandas de hoy).
 */
export const BUSINESS_TZ = 'America/Costa_Rica';

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: BUSINESS_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** YYYY-MM-DD de "hoy" en la zona del negocio, sin importar dónde corra el código. */
export function todayStr(): string {
  return toDateStr(new Date());
}

/** YYYY-MM-DD del instante `d` en la zona del negocio. */
export function toDateStr(d: Date): string {
  return dateFmt.format(d);
}

/** HH:mm actual en la zona del negocio. */
export function nowHHmm(): string {
  return timeFmt.format(new Date());
}

export function daysAgoStr(n: number): string {
  // Aritmética sobre la fecha de calendario (en UTC para no tropezar con
  // cambios de hora), partiendo del "hoy" del negocio.
  const d = new Date(todayStr() + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function firstOfMonthStr(): string {
  return todayStr().slice(0, 8) + '01';
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

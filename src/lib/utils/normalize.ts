export function norm(s: string | null | undefined): string {
  return String(s ?? '').toLowerCase().trim();
}

export function includesNorm(haystack: string | null | undefined, needle: string): boolean {
  return norm(haystack).includes(norm(needle));
}

/** Display helpers that never show nonsense for odd inputs. */

/**
 * Normalise a score to 0-100. Models and fixtures mix scales: values in [0, 1] are fractions (0.5 -> 50), larger values are already
 * percentages. Non-numbers and non-finite values give null (render "—", never "NaN%"). Result is clamped to [0, 100].
 */
export function toPercent(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const pct = n >= 0 && n <= 1 ? n * 100 : n;
  return Math.min(100, Math.max(0, pct));
}

/** "55%" or the placeholder. */
export function formatPercent(value: unknown, placeholder = '—'): string {
  const p = toPercent(value);
  return p === null ? placeholder : `${Math.round(p)}%`;
}

/** Locale date, or the placeholder for missing/invalid values (never "Invalid Date"). */
export function formatDate(value: unknown, placeholder = '—'): string {
  if (value === null || value === undefined || value === '') return placeholder;
  const d = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(d.getTime()) ? placeholder : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** A FRACTION shown as a percentage: 0.5 -> "50.0%". Non-numbers give the placeholder. (Inputs are normalised to fractions upstream.) */
export function formatFraction(value: unknown, digits = 1, placeholder = '—'): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : placeholder;
}

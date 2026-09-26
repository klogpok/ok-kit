/** Options of the text shown in `ui-number-input`. */
export interface UiNumberFormat {
  minFractionDigits: number;
  /** `null`: as many as the value has (up to 20). */
  maxFractionDigits: number | null;
  grouping: boolean;
}

interface Symbols {
  group: string;
  decimal: string;
}

const symbolCache = new Map<string, Symbols>();

/** Group and decimal separators of a locale, e.g. "," and "." for he-IL. */
function symbols(locale: string): Symbols {
  let found = symbolCache.get(locale);
  if (!found) {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    found = {
      group: parts.find((part) => part.type === 'group')?.value ?? ',',
      decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
    };
    symbolCache.set(locale, found);
  }
  return found;
}

/** Bidi marks (he-IL puts an LRM before the minus sign) and every kind of space. */
const IGNORED = /[\u200e\u200f\u061c\s\u00a0\u202f]/g;
const MINUS = /^[-\u2212\u2012\u2013]/;
const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

/**
 * Reads a number typed in the format of `locale`: "1,234.5" in he-IL, "1.234,5" in de-DE.
 * Group separators are optional. A "." is also taken as the decimal separator when the locale
 * uses "," and does not group with ".". Returns `null` for empty text and `NaN` for text that is
 * not a number.
 */
export function parseNumber(text: string, locale: string): number | null {
  let normalized = text.replace(IGNORED, '');
  if (!normalized) return null;
  const { group, decimal } = symbols(locale);
  normalized = normalized.replace(MINUS, '-');
  if (group.trim()) normalized = normalized.split(group).join('');
  if (decimal !== '.') {
    if (group !== '.' && normalized.includes('.') && normalized.includes(decimal)) return NaN;
    normalized = normalized.replace(decimal, '.');
  }
  return NUMBER.test(normalized) ? Number(normalized) : NaN;
}

/** The number in the format of `locale`, without bidi marks (the field is LTR). */
export function formatNumber(value: number, locale: string, format: UiNumberFormat): string {
  const max = format.maxFractionDigits ?? 20;
  return new Intl.NumberFormat(locale, {
    useGrouping: format.grouping,
    minimumFractionDigits: Math.min(format.minFractionDigits, max),
    maximumFractionDigits: max,
  })
    .format(value)
    .replace(/[\u200e\u200f\u061c]/g, '');
}

/** Number of fraction digits of `value` as JavaScript writes it, e.g. 2 for 0.25. */
export function fractionDigits(value: number): number {
  const parts = String(value).toLowerCase().split('e');
  const digits = parts[0].split('.').at(1)?.length ?? 0;
  return Math.max(0, digits - Number(parts.at(1) ?? 0));
}

/** `value + step` without floating point noise (0.1 + 0.2 gives 0.3). */
export function addStep(value: number, step: number): number {
  const digits = Math.min(20, Math.max(fractionDigits(value), fractionDigits(step)));
  return Number((value + step).toFixed(digits));
}

/** Rounds to at most `digits` fraction digits; `null` keeps the value. */
export function roundTo(value: number, digits: number | null): number {
  return digits === null ? value : Number(value.toFixed(Math.min(20, Math.max(0, digits))));
}

/** A finite number, or `null` for anything else (a string from an API, `NaN`). */
export function validNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

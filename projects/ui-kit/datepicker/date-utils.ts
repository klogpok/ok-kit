// Calendar dates as local `Date` objects at midnight. Internal to the datepicker entry point.

/** The value as a usable date: anything but a valid `Date` (a string, an Invalid Date) is `null`. */
export function validDay(value: unknown): Date | null {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Adds months, keeping the day but clamping it to the target month (Jan 31 + 1 → Feb 28). */
export function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = Math.min(date.getDate(), daysInMonth(year, month));
  return new Date(year, month, day);
}

export function sameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Negative when `a` is an earlier day than `b`, 0 on the same day. */
export function compareDays(a: Date, b: Date): number {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function clampDay(date: Date, min?: Date | null, max?: Date | null): Date {
  if (min && compareDays(date, min) < 0) return startOfDay(min);
  if (max && compareDays(date, max) > 0) return startOfDay(max);
  return date;
}

export type UiDateFilter = (date: Date) => boolean;

/** Whether a day can be picked: inside `min`/`max` and accepted by `filter`. */
export function isDayEnabled(
  date: Date,
  min: Date | null | undefined,
  max: Date | null | undefined,
  filter: UiDateFilter | null | undefined,
): boolean {
  if (min && compareDays(date, min) < 0) return false;
  if (max && compareDays(date, max) > 0) return false;
  return filter ? filter(date) : true;
}

interface WeekInfo {
  firstDay: number;
}

// Regions whose week does not start on Monday (CLDR), for browsers without Intl week info.
const SUNDAY_REGIONS = new Set(
  'AG AS BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
    ' ',
  ),
);
const SATURDAY_REGIONS = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));

/** First day of the week from the locale's region, when Intl has no week info. */
export function firstDayOfWeekFallback(locale: string): number {
  let region: string | undefined;
  try {
    region = new Intl.Locale(locale).maximize().region;
  } catch {
    return 1;
  }
  if (!region) return 1;
  if (SUNDAY_REGIONS.has(region)) return 0;
  return SATURDAY_REGIONS.has(region) ? 6 : 1;
}

/** First day of the week for a locale as a JS day number (0 = Sunday). */
export function firstDayOfWeek(locale: string): number {
  try {
    const intl = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => WeekInfo;
      weekInfo?: WeekInfo;
    };
    const info = intl.getWeekInfo?.() ?? intl.weekInfo;
    // Intl uses 1 = Monday ... 7 = Sunday.
    return info ? info.firstDay % 7 : firstDayOfWeekFallback(locale);
  } catch {
    return firstDayOfWeekFallback(locale);
  }
}

const NUMERIC: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };

type DatePart = 'day' | 'month' | 'year';

/** Order of day, month and year and the separator in the locale's short numeric date. */
export function datePattern(locale: string): { order: DatePart[]; separator: string } {
  const parts = new Intl.DateTimeFormat(locale, NUMERIC).formatToParts(new Date(2026, 10, 22));
  const order = parts
    .map((part) => part.type)
    .filter((type): type is DatePart => type === 'day' || type === 'month' || type === 'year');
  const separator = parts.find((part) => part.type === 'literal')?.value.trim() || '/';
  return { order, separator };
}

/** Formats a date as the locale's short numeric date, e.g. "25.9.2026" in `he-IL`. */
export function formatDay(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, NUMERIC).format(date);
}

/**
 * Parses a numeric date typed in the locale's order ("25.9.2026", "25/09/26", "25-9-2026").
 * Any non-digit separates the parts; a two-digit year is the one within 50 years from now
 * ("85" is 1985, "30" is 2030). Returns `null` when the text is
 * not a real date, or the year has 1 or 3 digits (still being typed: "1.1.202" is not year 202).
 */
export function parseDay(text: string, locale: string): Date | null {
  const numbers = text.match(/\d+/g);
  const { order } = datePattern(locale);
  if (!numbers || numbers.length !== 3 || order.length !== 3) return null;

  const value = (part: DatePart) => Number(numbers[order.indexOf(part)]);
  const day = value('day');
  const month = value('month');
  const yearDigits = numbers[order.indexOf('year')].length;
  if (yearDigits !== 2 && yearDigits !== 4) return null;
  let year = value('year');
  if (yearDigits === 2) {
    year += 2000;
    if (year > new Date().getFullYear() + 50) year -= 100;
  }

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) return null;
  const date = new Date(year, month - 1, day);
  // Years 0-99 would otherwise map to 1900-1999.
  date.setFullYear(year);
  return date;
}

/** Placeholder describing the expected format, e.g. "DD.MM.YYYY". */
export function formatHint(locale: string): string {
  const { order, separator } = datePattern(locale);
  const tokens: Record<DatePart, string> = { day: 'DD', month: 'MM', year: 'YYYY' };
  return order.map((part) => tokens[part]).join(separator);
}

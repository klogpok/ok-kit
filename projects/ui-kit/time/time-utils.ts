// Times of day as "HH:mm" strings (24-hour, zero-padded).

const MINUTES_PER_DAY = 24 * 60;

/** Minutes after midnight of an "HH:mm" string, or `null` when it is not such a time. */
export function toMinutes(time: string | null | undefined): number | null {
  const match = typeof time === 'string' ? /^(\d{2}):(\d{2})$/.exec(time) : null;
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

/** "HH:mm" of minutes after midnight. */
export function fromMinutes(total: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** The time of a date as "HH:mm", e.g. to fill `ui-time-input` from a `Date`. */
export function uiTimeOf(date: Date): string {
  return fromMinutes(date.getHours() * 60 + date.getMinutes());
}

/**
 * The day of `date` at `time` ("HH:mm"), e.g. to join the values of `ui-datepicker` and
 * `ui-time-input`. Returns `null` when either is missing or `time` is not a time.
 */
export function uiDateWithTime(
  date: Date | null | undefined,
  time: string | null | undefined,
): Date | null {
  const minutes = toMinutes(time);
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || minutes === null) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(minutes / 60),
    minutes % 60,
  );
}

/** How a locale shows times: the hour cycle and the names of the day periods. */
export interface TimeFormat {
  hour12: boolean;
  /** "AM" and "PM" in the locale, for 12-hour locales. */
  am: string;
  pm: string;
}

export function timeFormat(locale: string): TimeFormat {
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  const cycle = format.resolvedOptions().hourCycle;
  const period = (hour: number) =>
    new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
      .formatToParts(new Date(2026, 0, 1, hour))
      .find((part) => part.type === 'dayPeriod')?.value ?? (hour < 12 ? 'AM' : 'PM');
  return { hour12: cycle === 'h11' || cycle === 'h12', am: period(1), pm: period(13) };
}

/** Shows an "HH:mm" time in the locale: "14:30" in 24-hour locales, "2:30 PM" in 12-hour ones. */
export function formatTime(time: string, format: TimeFormat): string {
  const minutes = toMinutes(time);
  if (minutes === null) return '';
  if (!format.hour12) return time;
  const hours = Math.floor(minutes / 60);
  const hour = hours % 12 || 12;
  return `${hour}:${time.slice(3)} ${hours < 12 ? format.am : format.pm}`;
}

/** Placeholder describing the expected format. */
export function timeHint(format: TimeFormat): string {
  return format.hour12 ? `HH:MM ${format.am}` : 'HH:MM';
}

/**
 * Parses a typed time: "14:30", "14.30", "1430", "930", "9" and, with a day period, "2:30 pm",
 * "2:30p" or "2 PM". Without a day period the hours are read as 24-hour hours, also in 12-hour
 * locales. Returns "HH:mm", or `null` when the text is not a time.
 */
export function parseTime(text: string, format: TimeFormat): string | null {
  let rest = text.trim().toLocaleLowerCase();
  let period: 'am' | 'pm' | null = null;
  const markers: [string, 'am' | 'pm'][] = [
    [format.am.toLocaleLowerCase(), 'am'],
    [format.pm.toLocaleLowerCase(), 'pm'],
    ['am', 'am'],
    ['pm', 'pm'],
    ['a', 'am'],
    ['p', 'pm'],
  ];
  for (const [marker, value] of markers) {
    if (marker && rest.endsWith(marker)) {
      period = value;
      rest = rest.slice(0, -marker.length).replace(/[\s.]+$/, '');
      break;
    }
  }

  const match =
    /^(\d{1,2})[:.](\d{2})$/.exec(rest) ??
    /^(\d{1,2})()$/.exec(rest) ??
    /^(\d{1,2})(\d{2})$/.exec(rest);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  if (minutes > 59) return null;
  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === 'pm' ? 12 : 0);
  }
  return hours < 24 ? fromMinutes(hours * 60 + minutes) : null;
}

/**
 * Keeps typed text to the characters of a time and adds the ":" once the digits can only mean
 * one time: "930" → "9:30", "1430" → "14:30". "123" stays as typed (1:23 or 12:3…) until the
 * next digit. Only digits and separators are kept in 24-hour locales.
 */
export function maskTime(text: string, format: TimeFormat): string {
  const kept = format.hour12 ? text.replace(/[^\d:.\s\p{L}]/gu, '') : text.replace(/[^\d:.]/g, '');
  const digits = /^\d{3,4}$/.exec(kept)?.[0];
  if (!digits) return kept;
  if (digits.length === 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return Number(digits.slice(0, 2)) < 24 ? digits : `${digits[0]}:${digits.slice(1)}`;
}

/** Times from `min` to `max` every `interval` minutes, counted from midnight. */
export function timeSlots(interval: number, min: number | null, max: number | null): string[] {
  const step = Math.max(1, Math.floor(interval));
  const from = min ?? 0;
  const to = max ?? MINUTES_PER_DAY - 1;
  const slots: string[] = [];
  for (let minutes = Math.ceil(from / step) * step; minutes <= to; minutes += step) {
    slots.push(fromMinutes(minutes));
  }
  return slots;
}

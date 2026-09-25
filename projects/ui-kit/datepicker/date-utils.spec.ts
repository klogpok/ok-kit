import {
  addMonths,
  clampDay,
  datePattern,
  firstDayOfWeek,
  formatDay,
  formatHint,
  isDayEnabled,
  parseDay,
  sameDay,
} from './date-utils';

describe('date utils', () => {
  it('clamps the day when adding months', () => {
    expect(sameDay(addMonths(new Date(2026, 0, 31), 1), new Date(2026, 1, 28))).toBe(true);
    expect(sameDay(addMonths(new Date(2026, 2, 15), -3), new Date(2025, 11, 15))).toBe(true);
  });

  it('reads the first day of the week from the locale', () => {
    expect(firstDayOfWeek('he-IL')).toBe(0);
    expect(firstDayOfWeek('en-US')).toBe(0);
    expect(firstDayOfWeek('de-DE')).toBe(1);
  });

  it('reads the numeric date order and separator', () => {
    expect(datePattern('he-IL')).toEqual({ order: ['day', 'month', 'year'], separator: '.' });
    expect(datePattern('en-US')).toEqual({ order: ['month', 'day', 'year'], separator: '/' });
    expect(formatHint('he-IL')).toBe('DD.MM.YYYY');
    expect(formatHint('en-US')).toBe('MM/DD/YYYY');
  });

  it('formats and parses in the locale order', () => {
    const date = new Date(2026, 8, 5);
    expect(formatDay(date, 'he-IL')).toBe('5.9.2026');
    expect(sameDay(parseDay('5.9.2026', 'he-IL'), date)).toBe(true);
    expect(sameDay(parseDay('05/09/26', 'he-IL'), date)).toBe(true);
    expect(sameDay(parseDay('9/5/2026', 'en-US'), date)).toBe(true);
  });

  it('rejects text that is not a real date', () => {
    expect(parseDay('31.2.2026', 'he-IL')).toBeNull();
    expect(parseDay('5.13.2026', 'he-IL')).toBeNull();
    expect(parseDay('5.9', 'he-IL')).toBeNull();
    expect(parseDay('tomorrow', 'he-IL')).toBeNull();
  });

  it('treats a year of 1 or 3 digits as still being typed', () => {
    expect(parseDay('1.1.2', 'he-IL')).toBeNull();
    expect(parseDay('1.1.202', 'he-IL')).toBeNull();
    expect(parseDay('1.1.20260', 'he-IL')).toBeNull();
  });

  it('checks min, max and the filter', () => {
    const min = new Date(2026, 8, 10);
    const max = new Date(2026, 8, 20);
    const noFridays = (d: Date) => d.getDay() !== 5;
    expect(isDayEnabled(new Date(2026, 8, 9), min, max, null)).toBe(false);
    expect(isDayEnabled(new Date(2026, 8, 10, 15), min, max, null)).toBe(true);
    expect(isDayEnabled(new Date(2026, 8, 18), min, max, noFridays)).toBe(false);
    expect(sameDay(clampDay(new Date(2026, 8, 30), min, max), max)).toBe(true);
  });
});

import {
  formatTime,
  fromMinutes,
  maskTime,
  parseTime,
  timeFormat,
  timeHint,
  timeSlots,
  toMinutes,
  uiDateWithTime,
  uiTimeOf,
} from './time-utils';

const he = timeFormat('he-IL');
const en = timeFormat('en-US');

describe('time utils', () => {
  it('reads the hour cycle and the day periods of a locale', () => {
    expect(he.hour12).toBe(false);
    expect(en).toEqual({ hour12: true, am: 'AM', pm: 'PM' });
    expect(timeHint(he)).toBe('HH:MM');
    expect(timeHint(en)).toBe('HH:MM AM');
  });

  it('converts between "HH:mm" and minutes', () => {
    expect(toMinutes('09:05')).toBe(545);
    expect(toMinutes('24:00')).toBeNull();
    expect(toMinutes('9:05')).toBeNull();
    expect(toMinutes(null)).toBeNull();
    expect(fromMinutes(545)).toBe('09:05');
  });

  it('formats times in 24-hour and 12-hour locales', () => {
    expect(formatTime('09:05', he)).toBe('09:05');
    expect(formatTime('00:30', en)).toBe('12:30 AM');
    expect(formatTime('12:00', en)).toBe('12:00 PM');
    expect(formatTime('14:30', en)).toBe('2:30 PM');
    expect(formatTime('x', en)).toBe('');
  });

  it('parses typed times', () => {
    expect(parseTime('14:30', he)).toBe('14:30');
    expect(parseTime(' 9.05 ', he)).toBe('09:05');
    expect(parseTime('1430', he)).toBe('14:30');
    expect(parseTime('930', he)).toBe('09:30');
    expect(parseTime('9', he)).toBe('09:00');
    expect(parseTime('123', he)).toBe('01:23');
    expect(parseTime('2:30 pm', en)).toBe('14:30');
    expect(parseTime('2:30p', en)).toBe('14:30');
    expect(parseTime('12 AM', en)).toBe('00:00');
    expect(parseTime('12:15 PM', en)).toBe('12:15');
    // Without a day period the hours are 24-hour hours.
    expect(parseTime('14:30', en)).toBe('14:30');
  });

  it('rejects text that is not a time', () => {
    for (const text of ['', '24:00', '12:60', '14:3', '13 pm', '0 am', 'noon', '1:2:3']) {
      expect(parseTime(text, en)).toBeNull();
    }
  });

  it('masks typed text', () => {
    expect(maskTime('1430', he)).toBe('14:30');
    expect(maskTime('930', he)).toBe('9:30');
    expect(maskTime('123', he)).toBe('123');
    expect(maskTime('12a:3b', he)).toBe('12:3');
    expect(maskTime('2:30 pm', en)).toBe('2:30 pm');
    expect(maskTime('2:30 pm!', en)).toBe('2:30 pm');
  });

  it('lists the times of the day between the limits', () => {
    expect(timeSlots(360, null, null)).toEqual(['00:00', '06:00', '12:00', '18:00']);
    expect(timeSlots(30, toMinutes('08:10'), toMinutes('09:30'))).toEqual([
      '08:30',
      '09:00',
      '09:30',
    ]);
    expect(timeSlots(0, 0, 2)).toEqual(['00:00', '00:01', '00:02']);
  });

  it('joins a date and a time', () => {
    const date = new Date(2026, 8, 25, 23, 59);
    expect(uiTimeOf(date)).toBe('23:59');
    expect(uiDateWithTime(date, '08:15')).toEqual(new Date(2026, 8, 25, 8, 15));
    expect(uiDateWithTime(date, null)).toBeNull();
    expect(uiDateWithTime(null, '08:15')).toBeNull();
    expect(uiDateWithTime(new Date(Number.NaN), '08:15')).toBeNull();
  });
});

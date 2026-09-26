import {
  addStep,
  formatNumber,
  fractionDigits,
  parseNumber,
  roundTo,
  validNumber,
} from './number-utils';

describe('number utils', () => {
  it('parses numbers in the locale format', () => {
    expect(parseNumber('1,234.5', 'he-IL')).toBe(1234.5);
    expect(parseNumber('1234.5', 'he-IL')).toBe(1234.5);
    expect(parseNumber('-12', 'he-IL')).toBe(-12);
    expect(parseNumber(' 7 ', 'he-IL')).toBe(7);
    expect(parseNumber('1.', 'he-IL')).toBe(1);
    expect(parseNumber('.5', 'he-IL')).toBe(0.5);
    expect(parseNumber('1.234,5', 'de-DE')).toBe(1234.5);
    expect(parseNumber('1 234,5', 'fr-FR')).toBe(1234.5);
    expect(parseNumber('2.5', 'fr-FR')).toBe(2.5);
  });

  it('returns null for empty text and NaN for text that is not a number', () => {
    expect(parseNumber('', 'he-IL')).toBeNull();
    expect(parseNumber('   ', 'he-IL')).toBeNull();
    expect(parseNumber('abc', 'he-IL')).toBeNaN();
    expect(parseNumber('-', 'he-IL')).toBeNaN();
    expect(parseNumber('1.2.3', 'he-IL')).toBeNaN();
    expect(parseNumber('1.2,3', 'fr-FR')).toBeNaN();
  });

  it('formats without bidi marks', () => {
    const format = { minFractionDigits: 0, maxFractionDigits: null, grouping: true };
    expect(formatNumber(-1234.5, 'he-IL', format)).toBe('-1,234.5');
    expect(formatNumber(1234.5, 'he-IL', { ...format, grouping: false })).toBe('1234.5');
    expect(formatNumber(12.5, 'he-IL', { ...format, minFractionDigits: 2 })).toBe('12.50');
    expect(formatNumber(1.256, 'he-IL', { ...format, maxFractionDigits: 2 })).toBe('1.26');
  });

  it('steps without floating point noise', () => {
    expect(addStep(0.1, 0.2)).toBe(0.3);
    expect(addStep(1.25, -1)).toBe(0.25);
    expect(fractionDigits(1e-7)).toBe(7);
    expect(fractionDigits(3)).toBe(0);
    expect(roundTo(1.256, 1)).toBe(1.3);
    expect(roundTo(1.256, null)).toBe(1.256);
  });

  it('accepts only finite numbers as values', () => {
    expect(validNumber(3)).toBe(3);
    expect(validNumber('3')).toBeNull();
    expect(validNumber(Number.NaN)).toBeNull();
    expect(validNumber(Infinity)).toBeNull();
  });
});

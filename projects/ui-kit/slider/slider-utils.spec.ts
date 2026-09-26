import { percentOf, roundToScale, scaleTop, snapToScale } from './slider-utils';

describe('slider utils', () => {
  const scale = { min: 0, max: 100, step: 5 };

  it('snaps values to the step grid within the limits', () => {
    expect(snapToScale(12, scale)).toBe(10);
    expect(snapToScale(13, scale)).toBe(15);
    expect(snapToScale(-4, scale)).toBe(0);
    expect(snapToScale(140, scale)).toBe(100);
    expect(snapToScale(Number.NaN, scale)).toBe(0);
  });

  it('keeps the precision of a decimal step', () => {
    const decimal = { min: 0, max: 1, step: 0.1 };
    expect(snapToScale(0.3, decimal)).toBe(0.3);
    expect(snapToScale(0.26, decimal)).toBe(0.3);
    expect(roundToScale(0.1 + 0.2, decimal)).toBe(0.3);
    expect(snapToScale(1.34, { min: 1.2, max: 2, step: 0.05 })).toBe(1.35);
    expect(roundToScale(1e-7 * 3, { min: 0, max: 1, step: 1e-7 })).toBe(3e-7);
  });

  it('ends at the last grid value within max', () => {
    expect(scaleTop({ min: 0, max: 10, step: 3 })).toBe(9);
    expect(snapToScale(10, { min: 0, max: 10, step: 3 })).toBe(9);
    expect(scaleTop({ min: 0, max: 0.3, step: 0.1 })).toBe(0.3);
    expect(scaleTop({ min: 5, max: 5, step: 1 })).toBe(5);
  });

  it('places values along the track', () => {
    expect(percentOf(25, scale)).toBe(25);
    expect(percentOf(150, scale)).toBe(100);
    expect(percentOf(3, { min: 3, max: 3, step: 1 })).toBe(0);
  });
});

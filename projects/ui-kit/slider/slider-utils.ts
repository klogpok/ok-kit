/** Digits after the decimal point, so steps like 0.1 do not add float noise ("0.30000000000000004"). */
function decimals(value: number): number {
  const [mantissa, exponent] = String(value).toLowerCase().split('e');
  const dot = mantissa.indexOf('.');
  const fraction = dot < 0 ? 0 : mantissa.length - dot - 1;
  return Math.max(0, fraction - Number(exponent || 0));
}

/** The values a slider can take: `min`, `min + step`, ... up to the last one within `max`. */
export interface UiSliderScale {
  min: number;
  max: number;
  step: number;
}

/** Rounds a number to the precision of the scale (the digits of `min` and `step`). */
export function roundToScale(value: number, scale: UiSliderScale): number {
  const digits = Math.min(20, Math.max(decimals(scale.min), decimals(scale.step)));
  return Number(value.toFixed(digits));
}

/**
 * The highest value on the scale. Like `<input type="range">`, a `max` that is not on the step
 * grid is not reachable: min 0, max 10, step 3 ends at 9.
 */
export function scaleTop(scale: UiSliderScale): number {
  if (scale.max <= scale.min) return scale.min;
  return roundToScale(
    scale.min + Math.floor(roundToScale((scale.max - scale.min) / scale.step, scale)) * scale.step,
    scale,
  );
}

/** The nearest value on the step grid within the scale. */
export function snapToScale(value: number, scale: UiSliderScale): number {
  const top = scaleTop(scale);
  if (!Number.isFinite(value) || value <= scale.min) return scale.min;
  if (value >= top) return top;
  return roundToScale(scale.min + Math.round((value - scale.min) / scale.step) * scale.step, scale);
}

/** Position of a value along the track, 0–100. */
export function percentOf(value: number, scale: UiSliderScale): number {
  const span = scale.max - scale.min;
  if (span <= 0) return 0;
  return Math.min(100, Math.max(0, ((value - scale.min) / span) * 100));
}

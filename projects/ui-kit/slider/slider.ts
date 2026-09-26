import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ModelSignal,
  Signal,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  resolveDirection,
} from '@vplans/ui-kit/core';
import { UiSliderScale, percentOf, scaleTop, snapToScale } from './slider-utils';

/** A point of the scale shown under the track, e.g. `{ value: 50, label: '50%' }`. */
export interface UiSliderMark {
  value: number;
  /** Text under the track. Without it the mark is only a tick. */
  label?: string;
}

/** Value of `ui-range-slider`: the start and the end of the range, `start <= end`. */
export type UiSliderRange = readonly [start: number, end: number];

/** A thumb as the template renders it. */
interface Thumb {
  index: number;
  id: string;
  value: number;
  /** Limits of this thumb: the other thumb of a range bounds it. */
  min: number;
  max: number;
  percent: number;
  text: string;
  label: string | null;
  labelledBy: string | null;
}

interface Tick {
  value: number;
  percent: number;
  label: string | undefined;
  /** Inside the filled part of the track. */
  active: boolean;
}

interface Drag {
  pointerId: number;
  /** `null` while the two thumbs of a range overlap: the first move picks one. */
  index: number | null;
  /** Value under the pointer when the drag started. */
  from: number;
  changed: boolean;
}

/** More ticks than this would merge into a line, so `marks` then shows none. */
const MAX_TICKS = 100;
/** PageUp / PageDown move by this many steps. */
const PAGE_STEPS = 10;

const scaleNumber = (fallback: number) => (value: unknown) => numberAttribute(value, fallback);

const marksAttribute = (
  value: boolean | '' | readonly UiSliderMark[] | null | undefined,
): boolean | readonly UiSliderMark[] => (Array.isArray(value) ? value : value === '' || !!value);

/**
 * Shared behavior of `ui-slider` and `ui-range-slider`.
 *
 * Every thumb is a native `<input type="range">`, transparent inside the drawn thumb: it gives the
 * slider role, `label[for]`, the value attributes, and adjusting by screen readers (iOS swipes).
 * The pointer and the keys are handled here, so the track can be clicked and the keys follow
 * the visual direction in RTL.
 */
@Directive()
export abstract class UiSliderBase<T>
  extends UiFormControlBase<T | null>
  implements UiFormFieldControl
{
  protected readonly labels = inject(UI_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  abstract readonly value: ModelSignal<T | null>;
  abstract readonly id: Signal<string>;
  abstract readonly labelStrategy: 'for' | 'labelledby';
  abstract readonly controlId: Signal<string>;

  readonly min = input(0, { transform: scaleNumber(0) });
  readonly max = input(100, { transform: scaleNumber(100) });
  /** Distance between the values the slider can take. */
  readonly step = input(1, { transform: (value: unknown) => numberAttribute(value, 1) || 1 });
  /**
   * `true` draws a tick at every step (up to 100 ticks). A list draws ticks at its values and
   * shows the labels under the track.
   */
  readonly marks = input(false, { transform: marksAttribute });
  /**
   * Text read by screen readers for a value (`aria-valuetext`), e.g. `(v) => v + ' ₪'`. By default
   * the label of the mark at that value, or the number in the format of the `locale` label.
   */
  readonly valueText = input<((value: number) => string) | null>(null);
  readonly size = input<UiSize>('md');
  readonly name = input('');
  readonly ariaLabel = input('', { alias: 'aria-label' });
  /**
   * Emits the value when the user ends a change: releases the pointer, presses a key, or a screen
   * reader adjusts it. `valueChange` also fires while dragging; use this to load data.
   */
  readonly valueCommit = output<T>();

  private readonly control = viewChild.required<ElementRef<HTMLElement>>('control');
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('input');

  private drag: Drag | null = null;

  protected readonly scale = computed<UiSliderScale>(() => ({
    min: this.min(),
    max: Math.max(this.min(), this.max()),
    step: this.step(),
  }));

  private readonly format = computed(() => new Intl.NumberFormat(this.labels().locale));

  protected readonly markList = computed<readonly UiSliderMark[]>(() => {
    const marks = this.marks();
    const scale = this.scale();
    if (typeof marks !== 'boolean') {
      return marks.filter((mark) => mark.value >= scale.min && mark.value <= scale.max);
    }
    if (!marks) return [];
    const count = Math.round((scaleTop(scale) - scale.min) / scale.step);
    if (count > MAX_TICKS) return [];
    return Array.from({ length: count + 1 }, (_, i) => ({
      value: snapToScale(scale.min + i * scale.step, scale),
    }));
  });

  /** Values of the thumbs on the scale, in order. */
  protected abstract thumbValues(): readonly number[];
  /** Accessible name of a thumb. */
  protected abstract thumbLabel(index: number): { label: string | null; labelledBy: string | null };
  protected abstract thumbId(index: number): string;
  protected abstract toValue(values: readonly number[]): T;

  protected readonly thumbs = computed<readonly Thumb[]>(() => {
    const scale = this.scale();
    const values = this.thumbValues();
    const top = scaleTop(scale);
    return values.map((value, index) => ({
      index,
      id: this.thumbId(index),
      value,
      min: index > 0 ? values[index - 1] : scale.min,
      max: index < values.length - 1 ? values[index + 1] : top,
      percent: percentOf(value, scale),
      text: this.textOf(value),
      ...this.thumbLabel(index),
    }));
  });

  /** The filled part of the track: from `min` to the value, or between the two thumbs. */
  protected readonly fill = computed(() => {
    const thumbs = this.thumbs();
    const start = thumbs.length > 1 ? thumbs[0] : null;
    const end = thumbs[thumbs.length - 1];
    const from = start?.value ?? this.scale().min;
    return {
      start: start?.percent ?? 0,
      size: end.percent - (start?.percent ?? 0),
      from,
      to: end.value,
    };
  });

  protected readonly ticks = computed<readonly Tick[]>(() => {
    const scale = this.scale();
    const { from, to } = this.fill();
    return this.markList().map((mark) => ({
      value: mark.value,
      percent: percentOf(mark.value, scale),
      label: mark.label,
      active: mark.value >= from && mark.value <= to,
    }));
  });

  protected readonly labelledTicks = computed(() => this.ticks().filter((tick) => tick.label));

  /** Hidden texts that `aria-labelledby` of the host and the thumbs refers to. */
  protected readonly hiddenLabels: Signal<readonly { id: string; text: string }[]> = computed(
    () => [],
  );

  focus(options?: FocusOptions): void {
    this.inputs().at(0)?.nativeElement.focus(options);
  }

  protected snap(value: number): number {
    return snapToScale(value, this.scale());
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const thumb = this.thumbs()[index];
    const step = this.step();
    const forward = resolveDirection(this.host.nativeElement) === 'rtl' ? -step : step;
    let next: number;
    switch (event.key) {
      case 'ArrowUp':
        next = thumb.value + step;
        break;
      case 'ArrowDown':
        next = thumb.value - step;
        break;
      case 'ArrowRight':
        next = thumb.value + forward;
        break;
      case 'ArrowLeft':
        next = thumb.value - forward;
        break;
      case 'PageUp':
        next = thumb.value + step * PAGE_STEPS;
        break;
      case 'PageDown':
        next = thumb.value - step * PAGE_STEPS;
        break;
      case 'Home':
        next = thumb.min;
        break;
      case 'End':
        next = thumb.max;
        break;
      default:
        return;
    }
    // The native input must not step by itself.
    event.preventDefault();
    if (this.readonly()) return;
    if (this.setThumb(index, next)) this.commit();
  }

  /** A screen reader adjusted the native input. */
  protected onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!this.readonly() && this.setThumb(index, Number(input.value))) this.commit();
    // The `[value]` binding does not see a refused or clamped change.
    input.value = String(this.thumbs()[index].value);
  }

  protected onPointerdown(event: PointerEvent): void {
    if (event.button !== 0 || this.isDisabled() || this.readonly()) return;
    // No text selection and no native drag; the thumb is focused below.
    event.preventDefault();
    const value = this.valueAt(event.clientX);
    const index = this.thumbAt(value);
    this.drag = { pointerId: event.pointerId, index, from: this.snap(value), changed: false };
    this.control().nativeElement.setPointerCapture(event.pointerId);
    this.focusThumb(index ?? this.thumbs().length - 1);
    if (index !== null) this.dragTo(index, value);
  }

  protected onPointermove(event: PointerEvent): void {
    const drag = this.drag;
    if (drag?.pointerId !== event.pointerId) return;
    const value = this.valueAt(event.clientX);
    if (drag.index === null) {
      const snapped = this.snap(value);
      if (snapped === drag.from) return;
      drag.index = snapped < drag.from ? 0 : this.thumbs().length - 1;
      this.focusThumb(drag.index);
    }
    this.dragTo(drag.index, value);
  }

  protected onPointerup(event: PointerEvent): void {
    const drag = this.drag;
    if (drag?.pointerId !== event.pointerId) return;
    this.drag = null;
    const control = this.control().nativeElement;
    if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId);
    if (drag.changed) this.commit();
  }

  protected onFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) this.notifyTouched();
  }

  private textOf(value: number): string {
    const custom = this.valueText();
    if (custom) return custom(value);
    const mark = this.markList().find((item) => item.value === value && item.label);
    return mark?.label ?? this.format().format(value);
  }

  /** Value under a pointer position; the track runs from right to left in RTL. */
  private valueAt(clientX: number): number {
    const rect = this.track().nativeElement.getBoundingClientRect();
    const { min, max } = this.scale();
    if (!rect.width) return min;
    let fraction = (clientX - rect.left) / rect.width;
    if (resolveDirection(this.host.nativeElement) === 'rtl') fraction = 1 - fraction;
    return min + Math.min(1, Math.max(0, fraction)) * (max - min);
  }

  /** The thumb that a pointer at `value` takes; `null` when the thumbs overlap there. */
  private thumbAt(value: number): number | null {
    const values = this.thumbValues();
    if (values.length === 1) return 0;
    const [start, end] = values;
    if (start === end) {
      const snapped = this.snap(value);
      if (snapped === start) return null;
      return snapped < start ? 0 : 1;
    }
    return Math.abs(value - start) <= Math.abs(value - end) ? 0 : 1;
  }

  private dragTo(index: number, value: number): void {
    if (this.setThumb(index, value) && this.drag) this.drag.changed = true;
  }

  private focusThumb(index: number): void {
    this.inputs()[index]?.nativeElement.focus({ preventScroll: true, focusVisible: false });
  }

  /** Moves a thumb within its limits. Returns whether the value changed. */
  private setThumb(index: number, raw: number): boolean {
    const thumb = this.thumbs()[index];
    const next = Math.min(thumb.max, Math.max(thumb.min, this.snap(raw)));
    if (next === thumb.value && this.value() !== null) return false;
    const values = this.thumbs().map((item) => item.value);
    values[index] = next;
    const value = this.toValue(values);
    this.value.set(value);
    this.notifyChange(value);
    return true;
  }

  private commit(): void {
    const value = this.value();
    if (value !== null) this.valueCommit.emit(value);
  }
}

const TEMPLATE = `
  <div
    #control
    class="ui-slider__control"
    (pointerdown)="onPointerdown($event)"
    (pointermove)="onPointermove($event)"
    (pointerup)="onPointerup($event)"
    (pointercancel)="onPointerup($event)"
  >
    <span #track class="ui-slider__track">
      <span
        class="ui-slider__fill"
        [style.--_start]="fill().start + '%'"
        [style.--_size]="fill().size + '%'"
      ></span>
      @for (tick of ticks(); track tick.value) {
        <span
          class="ui-slider__tick"
          [class.ui-slider__tick--active]="tick.active"
          [style.--_pos]="tick.percent + '%'"
        ></span>
      }
    </span>
    @for (thumb of thumbs(); track thumb.index) {
      <span
        class="ui-slider__thumb"
        [style.--_pos]="thumb.percent + '%'"
      >
        <input
          #input
          type="range"
          class="ui-slider__input"
          [id]="thumb.id"
          [min]="thumb.min"
          [max]="thumb.max"
          [step]="step()"
          [value]="thumb.value"
          [disabled]="isDisabled()"
          [attr.name]="name() || null"
          [attr.aria-label]="thumb.label"
          [attr.aria-labelledby]="thumb.labelledBy"
          [attr.aria-valuetext]="thumb.text"
          [attr.aria-readonly]="readonly() ? 'true' : null"
          [attr.aria-invalid]="showError() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (keydown)="onKeydown($event, thumb.index)"
          (input)="onInput($event, thumb.index)"
        />
      </span>
    }
  </div>
  @if (labelledTicks().length) {
    <div class="ui-slider__marks" aria-hidden="true">
      @for (tick of labelledTicks(); track tick.value) {
        <span
          class="ui-slider__mark"
          [class.ui-slider__mark--active]="tick.active"
          [class.ui-slider__mark--start]="tick.percent === 0"
          [class.ui-slider__mark--end]="tick.percent === 100"
          [style.--_pos]="tick.percent + '%'"
          >{{ tick.label }}</span
        >
      }
    </div>
  }
  @for (label of hiddenLabels(); track label.id) {
    <span hidden [id]="label.id">{{ label.text }}</span>
  }
`;

const HOST = {
  class: 'ui-slider',
  '[class]': '"ui-slider--" + size()',
  '[class.ui-slider--disabled]': 'isDisabled()',
  '[class.ui-slider--readonly]': 'readonly()',
  '[class.ui-slider--invalid]': 'showError()',
  '[class.ui-slider--labelled-marks]': 'labelledTicks().length > 0',
  '[attr.id]': 'id()',
  // The thumbs carry the label and descriptions; static attributes stay on the host too.
  '[attr.aria-label]': 'null',
  '[attr.aria-describedby]': 'null',
  '(focusout)': 'onFocusout($event)',
};

/**
 * Picks one number on a scale by dragging a thumb, clicking the track or with the keys:
 * arrows by `step` (Left/Right follow the visual direction, so in RTL ArrowLeft increases),
 * PageUp/PageDown by ten steps, Home/End to the limits.
 *
 * The value is a `number` or `null`; `null` shows the thumb at `min`. A value off the step grid
 * or outside the limits is shown at the nearest allowed value and stays unchanged until the user
 * moves the thumb. Implements `FormValueControl` (Signal Forms) and `ControlValueAccessor`. With
 * Signal Forms, set the limits with `min()` and `max()` rules: `[formField]` does not allow
 * `min`/`max` attributes on the same element.
 *
 * @example
 * <ui-form-field label="Opacity">
 *   <ui-slider [(value)]="opacity" min="0" max="100" step="10" marks />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-slider',
  template: TEMPLATE,
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiSlider) }],
  host: HOST,
})
export class UiSlider extends UiSliderBase<number> {
  readonly value = model<number | null>(null);
  /** Host id; the native input gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-slider-'));

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);

  writeValue(value: number | null | undefined): void {
    this.value.set(typeof value === 'number' && Number.isFinite(value) ? value : null);
  }

  protected thumbValues(): readonly number[] {
    return [this.snap(this.value() ?? this.min())];
  }

  protected thumbLabel(): { label: string | null; labelledBy: string | null } {
    return { label: this.ariaLabel() || null, labelledBy: null };
  }

  protected thumbId(): string {
    return this.controlId();
  }

  protected toValue(values: readonly number[]): number {
    return values[0];
  }
}

/**
 * Picks a range on a scale with two thumbs. The thumbs do not pass each other; where they overlap,
 * the direction of the drag picks the thumb. Keys as in `ui-slider`.
 *
 * The value is a `[start, end]` tuple or `null`; `null` shows the whole scale. Each thumb is a
 * slider named by the field label and `startLabel` / `endLabel` (default: the `rangeStart` and
 * `rangeEnd` labels). With Signal Forms, set the limits with `limits`: `[formField]` does not allow
 * `min`/`max` attributes, and the `min()`/`max()` rules do not apply to a tuple.
 *
 * @example
 * <ui-form-field label="Price">
 *   <ui-range-slider [formField]="filters.price" [limits]="[0, 5000]" step="100" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-range-slider',
  template: TEMPLATE,
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiRangeSlider) }],
  host: {
    ...HOST,
    role: 'group',
    '[attr.aria-labelledby]': 'groupLabelledBy()',
  },
})
export class UiRangeSlider extends UiSliderBase<UiSliderRange> {
  readonly value = model<UiSliderRange | null>(null);
  /** Host id; the thumbs get `${id}-start` and `${id}-end`. */
  readonly id = input(inject(_IdGenerator).getId('ui-range-slider-'));
  /** `[min, max]` of the scale; wins over `min` and `max`. Use it with Signal Forms. */
  readonly limits = input<UiSliderRange | null>(null);
  /** Name of the start thumb, read after the field label. */
  readonly startLabel = input<string | null>(null);
  /** Name of the end thumb, read after the field label. */
  readonly endLabel = input<string | null>(null);

  readonly labelStrategy = 'labelledby' as const;
  readonly controlId = computed(() => `${this.id()}-start`);

  protected override readonly scale = computed<UiSliderScale>(() => {
    const [min, max] = this.limits() ?? [this.min(), this.max()];
    return { min, max: Math.max(min, max), step: this.step() };
  });

  /** The `aria-label` names the group only without a field label. */
  protected readonly ownLabel = computed(() => !this.formField?.labelledBy() && !!this.ariaLabel());
  protected readonly groupLabelledBy = computed(
    () => this.formField?.labelledBy() ?? (this.ownLabel() ? `${this.id()}-label` : null),
  );

  protected override readonly hiddenLabels = computed(() => [
    ...(this.ownLabel() ? [{ id: `${this.id()}-label`, text: this.ariaLabel() }] : []),
    { id: `${this.id()}-start-name`, text: this.startLabel() ?? this.labels().rangeStart },
    { id: `${this.id()}-end-name`, text: this.endLabel() ?? this.labels().rangeEnd },
  ]);

  writeValue(value: UiSliderRange | null | undefined): void {
    // Forms may write anything; keep only two finite numbers.
    const items: readonly unknown[] = Array.isArray(value) ? value : [];
    const valid =
      items.length === 2 &&
      items.every((item) => typeof item === 'number' && Number.isFinite(item));
    this.value.set(valid ? (items as UiSliderRange) : null);
  }

  protected thumbValues(): readonly number[] {
    const scale = this.scale();
    const [start, end] = this.value() ?? [scale.min, scaleTop(scale)];
    return [this.snap(start), this.snap(end)].sort((a, b) => a - b);
  }

  protected thumbLabel(index: number): { label: string | null; labelledBy: string | null } {
    const name = `${this.id()}-${index ? 'end' : 'start'}-name`;
    return {
      label: null,
      labelledBy: [this.groupLabelledBy(), name].filter(Boolean).join(' '),
    };
  }

  protected thumbId(index: number): string {
    return `${this.id()}-${index ? 'end' : 'start'}`;
  }

  protected toValue(values: readonly number[]): UiSliderRange {
    return [values[0], values[1]];
  }
}

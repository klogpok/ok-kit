import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  ɵinjectTypedText,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconMinus, uiIconPlus } from '@vplans/ui-kit/icon';
import {
  UiNumberFormat,
  addStep,
  formatNumber,
  parseNumber,
  roundTo,
  validNumber,
} from './number-utils';

/** Delay before a held stepper button starts repeating, and the repeat interval (ms). */
const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 60;

const optionalNumber = (value: unknown): number | null =>
  value == null || value === '' ? null : numberAttribute(value, Number.NaN);

/**
 * Number field (WAI-ARIA spinbutton). The text is read and shown in the format of the `locale`
 * label (default `he-IL`: "1,234.5").
 *
 * - Typing sets the value as soon as the text is a number. Text that is not a number sets the
 *   value to `null`; once the user leaves the field it shows `labels().invalidNumber`. The
 *   message is the field's own: it never becomes an error of a bound form control.
 * - Leaving the field (or Enter) formats the text, rounds to `maxFractionDigits` and clamps the
 *   value to `min`/`max`.
 * - ArrowUp/ArrowDown change the value by `step`, PageUp/PageDown by ten steps, Home/End go to
 *   `min`/`max`. The stepper buttons repeat while held; they are not in the tab order (the keys
 *   do the same).
 *
 * The value is a `number` or `null`. Implements `ControlValueAccessor`, so it binds with
 * `[formControl]`, `formControlName` and `[(ngModel)]`.
 *
 * @example
 * <ui-form-field label="Area">
 *   <ui-number-input [formControl]="area" maxFractionDigits="2" />
 *   <span uiSuffix>m²</span>
 * </ui-form-field>
 */
@Component({
  selector: 'ui-number-input',
  imports: [UiIcon],
  template: `
    <div class="ui-number-input__field">
      <input
        #input
        type="text"
        role="spinbutton"
        class="ui-number-input__input"
        autocomplete="off"
        dir="ltr"
        [attr.inputmode]="inputModeValue()"
        [id]="controlId()"
        [value]="text()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-valuenow]="current()"
        [attr.aria-valuemin]="min()"
        [attr.aria-valuemax]="max()"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [attr.aria-invalid]="showError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (blur)="onBlur()"
      />
      @if (steppers()) {
        <span class="ui-number-input__steppers">
          @for (button of buttons; track button.direction) {
            <button
              type="button"
              tabindex="-1"
              class="ui-number-input__step"
              [attr.aria-label]="button.direction > 0 ? labels().increment : labels().decrement"
              [attr.aria-controls]="controlId()"
              [disabled]="!canStep(button.direction)"
              (pointerdown)="onStepPointerdown($event, button.direction)"
              (pointerup)="stopRepeat()"
              (pointerleave)="stopRepeat()"
              (pointercancel)="stopRepeat()"
              (click)="onStepClick(button.direction)"
            >
              <ui-icon [icon]="button.icon" />
            </button>
          }
        </span>
      }
    </div>
  `,
  styleUrl: './number-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiNumberInput) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiNumberInput), multi: true },
  ],
  host: {
    class: 'ui-number-input',
    '[class]': '"ui-number-input--" + size()',
    '[class.ui-number-input--disabled]': 'isDisabled()',
    '[class.ui-number-input--readonly]': 'readonly()',
    '[class.ui-number-input--invalid]': 'showError()',
    '[class.ui-number-input--affixed]': 'formField?.hasAffixes() ?? false',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiNumberInput extends UiFormControlBase<number | null> implements UiFormFieldControl {
  protected readonly labels = inject(UI_LABELS);

  readonly value = model<number | null>(null);
  readonly min = input<number | null, unknown>(null, { transform: optionalNumber });
  readonly max = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Change of the arrow keys and the stepper buttons. */
  readonly step = input(1, { transform: (value: unknown) => numberAttribute(value, 1) || 1 });
  /** Fraction digits kept when the user leaves the field. `null`: as many as typed. */
  readonly maxFractionDigits = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Fraction digits always shown, e.g. `2` for prices ("12.50"). */
  readonly minFractionDigits = input(0, {
    transform: (value: unknown) => numberAttribute(value, 0),
  });
  /** Group separators in the shown value ("1,234"). */
  readonly grouping = input(true, { transform: booleanAttribute });
  /** Shows the − and + buttons. */
  readonly steppers = input(true, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /**
   * Virtual keyboard on phones. Defaults to `decimal`, or `numeric` with `maxFractionDigits="0"`.
   * The iOS decimal keypad has no minus key: set `text` for negative numbers.
   */
  readonly inputMode = input<string | null>(null, { alias: 'inputmode' });
  /** Host id; the text field gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-number-input-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly buttons = [
    { direction: -1, icon: uiIconMinus },
    { direction: 1, icon: uiIconPlus },
  ] as const;

  private readonly locale = computed(() => this.labels().locale);
  private readonly format = computed<UiNumberFormat>(() => ({
    minFractionDigits: this.minFractionDigits(),
    maxFractionDigits: this.maxFractionDigits(),
    grouping: this.grouping(),
  }));

  private readonly typedText = ɵinjectTypedText<number, string, 'invalid'>({
    value: this.value,
    notify: (value) => this.notifyChange(value),
    parse: (text) => {
      const parsed = parseNumber(text, this.locale());
      if (parsed === null) return { value: null, error: null };
      return Number.isNaN(parsed)
        ? { value: null, error: 'invalid' }
        : { value: parsed, error: null };
    },
    format: (value) => (value === null ? '' : formatNumber(value, this.locale(), this.format())),
    valid: validNumber,
    equals: (a, b) => a === b,
    commitValue: (value) => this.clamp(roundTo(value, this.maxFractionDigits())),
  });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);

  /** The value when it is a finite number; anything else is shown empty. */
  protected readonly current = computed(() => validNumber(this.value()));

  /** The typed text while it belongs to the current value, otherwise the formatted value. */
  protected readonly text = this.typedText.text;

  protected readonly inputModeValue = computed(
    () => this.inputMode() ?? (this.maxFractionDigits() === 0 ? 'numeric' : 'decimal'),
  );

  private repeatTimer: ReturnType<typeof setTimeout> | undefined;
  /** The last step came from a pointer, so the click that follows must not step again. */
  private pointerStepped = false;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.stopRepeat());
  }

  /**
   * The field shows the parse error itself, bound or not: a text the user still has to fix is not
   * a validation failure of the consumer's control, which only ever sees `null`.
   */
  protected override ownErrors(): readonly string[] {
    return this.typedText.error() === 'invalid' ? [this.labels().invalidNumber] : [];
  }

  writeValue(value: number | null | undefined): void {
    this.typedText.write(value);
  }

  focus(options?: FocusOptions): void {
    this.input().nativeElement.focus(options);
  }

  /** Increases the value by `step` (or `factor` steps), within `max`. */
  stepUp(factor = 1): void {
    this.stepBy(factor);
  }

  /** Decreases the value by `step` (or `factor` steps), within `min`. */
  stepDown(factor = 1): void {
    this.stepBy(-factor);
  }

  protected canStep(direction: number): boolean {
    if (this.isDisabled() || this.readonly()) return false;
    const value = this.current();
    if (value === null) return true;
    const limit = direction > 0 ? this.max() : this.min();
    return limit === null || (direction > 0 ? value < limit : value > limit);
  }

  protected onInput(event: Event): void {
    this.typedText.input((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const min = this.min();
    const max = this.max();
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'PageUp':
      case 'PageDown': {
        event.preventDefault();
        const factor = event.key.startsWith('Page') ? 10 : 1;
        this.stepBy(event.key.endsWith('Up') ? factor : -factor);
        break;
      }
      case 'Home':
      case 'End': {
        // Without a limit the keys move the caret.
        const limit = event.key === 'Home' ? min : max;
        if (limit === null || this.readonly()) return;
        event.preventDefault();
        this.typedText.set(limit);
        break;
      }
      case 'Enter':
        this.typedText.commit();
        break;
    }
  }

  protected onBlur(): void {
    this.stopRepeat();
    this.typedText.commit();
    this.notifyTouched();
  }

  protected onStepPointerdown(event: PointerEvent, direction: number): void {
    if (event.button !== 0) return;
    // Keep focus in the field; clicking the button must not move it.
    event.preventDefault();
    this.focus();
    this.pointerStepped = true;
    this.stepBy(direction);
    this.stopRepeat();
    const repeat = (): void => {
      if (!this.canStep(direction)) return;
      this.stepBy(direction);
      this.repeatTimer = setTimeout(repeat, REPEAT_INTERVAL);
    };
    this.repeatTimer = setTimeout(repeat, REPEAT_DELAY);
  }

  /** A click without a pointer press, e.g. from a screen reader. */
  protected onStepClick(direction: number): void {
    if (this.pointerStepped) this.pointerStepped = false;
    else this.stepBy(direction);
  }

  protected stopRepeat(): void {
    clearTimeout(this.repeatTimer);
    this.repeatTimer = undefined;
  }

  private stepBy(steps: number): void {
    if (this.isDisabled() || this.readonly()) return;
    const value = this.current();
    const next =
      value === null
        ? this.clamp(this.min() ?? 0)
        : this.clamp(addStep(value, steps * this.step()));
    this.typedText.set(next);
  }

  private clamp(value: number): number {
    const min = this.min();
    const max = this.max();
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));
  }
}

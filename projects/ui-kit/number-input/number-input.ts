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
  linkedSignal,
  model,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { transformedValue } from '@angular/forms/signals';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
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

/** Text the user is typing and the value it produced. */
interface Draft {
  text: string;
  value: number | null;
  /** The user left the field or pressed Enter: an invalid text is now an error. */
  committed: boolean;
}

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
 *   value to `null` and reports a `uiNumberParse` error (message `labels().invalidNumber`) to
 *   Signal Forms or Reactive Forms; without forms the field shows it once the user leaves.
 * - Leaving the field (or Enter) formats the text, rounds to `maxFractionDigits` and clamps the
 *   value to `min`/`max`.
 * - ArrowUp/ArrowDown change the value by `step`, PageUp/PageDown by ten steps, Home/End go to
 *   `min`/`max`. The stepper buttons repeat while held; they are not in the tab order (the keys
 *   do the same).
 *
 * The value is a `number` or `null`. Implements `FormValueControl` (Signal Forms) and
 * `ControlValueAccessor`. With Signal Forms, set the limits with `min()` and `max()` rules:
 * `[formField]` does not allow `min`/`max` attributes on the same element.
 *
 * @example
 * <ui-form-field label="Area">
 *   <ui-number-input [formField]="form.area" maxFractionDigits="2" />
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
        [attr.aria-invalid]="invalidState() ? 'true' : null"
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
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiNumberInput) }],
  host: {
    class: 'ui-number-input',
    '[class]': '"ui-number-input--" + size()',
    '[class.ui-number-input--disabled]': 'isDisabled()',
    '[class.ui-number-input--readonly]': 'readonly()',
    '[class.ui-number-input--invalid]': 'invalidState()',
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

  /**
   * Parses typed text into the value. Through `transformedValue` Signal Forms receives the parse
   * errors; they clear when the value changes elsewhere or the form is reset.
   */
  private readonly rawText = transformedValue(this.value, {
    parse: (text: string) => {
      const parsed = parseNumber(text, this.locale());
      const next = parsed === null || Number.isNaN(parsed) ? null : parsed;
      return {
        value: next !== this.value() ? next : undefined,
        error: Number.isNaN(parsed)
          ? { kind: 'uiNumberParse', message: this.labels().invalidNumber }
          : undefined,
      };
    },
    format: (value: number | null) => this.formatted(value),
  });

  /** Dropped when the value or the parsed text changes elsewhere, so old text does not come back. */
  private readonly draft = linkedSignal<{ value: number | null; text: string }, Draft | null>({
    source: () => ({ value: this.value(), text: this.rawText() }),
    computation: ({ value, text }, previous) => {
      const draft = previous?.value;
      return draft?.value === value && draft.text === text ? draft : null;
    },
  });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);

  /** The value when it is a finite number; anything else is shown empty. */
  protected readonly current = computed(() => validNumber(this.value()));

  /** The typed text while it belongs to the current value, otherwise the formatted value. */
  protected readonly text = computed(() => this.draft()?.text ?? this.formatted(this.current()));

  /** Typed text that is not a number. */
  protected readonly parseError = computed(() => {
    const draft = this.draft();
    return !!draft && draft.committed && Number.isNaN(parseNumber(draft.text, this.locale()));
  });

  protected readonly invalidState = computed(() => this.showError() || this.parseError());

  protected readonly inputModeValue = computed(
    () => this.inputMode() ?? (this.maxFractionDigits() === 0 ? 'numeric' : 'decimal'),
  );

  /** Reports the parse errors to Reactive / template forms, which read them only from validators. */
  private readonly parseValidator: ValidatorFn = (): ValidationErrors | null => {
    const error = this.rawText.parseErrors().at(0);
    return error ? { [error.kind]: { message: error.message } } : null;
  };

  /** The control that holds `parseValidator`; it must not keep it after this field is gone. */
  private validatedControl: AbstractControl | null = null;
  private repeatTimer: ReturnType<typeof setTimeout> | undefined;
  /** The last step came from a pointer, so the click that follows must not step again. */
  private pointerStepped = false;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      this.stopRepeat();
      this.releaseParseValidator();
    });
  }

  /** Without a forms directive, the field itself shows the parse error. */
  protected override ownErrors(): readonly string[] {
    return !this.controlState.bound && this.parseError() ? [this.labels().invalidNumber] : [];
  }

  writeValue(value: number | null | undefined): void {
    const number = validNumber(value);
    this.draft.set(null);
    this.value.set(number);
    // A new number clears the parse errors by itself; `null` over `null` (reset) does not.
    if (number === null) this.rawText.set('');
  }

  override registerOnChange(fn: (value: number | null) => void): void {
    const control = this.ngControl?.control ?? null;
    if (control !== this.validatedControl) {
      this.releaseParseValidator();
      if (control && !control.hasValidator(this.parseValidator)) {
        control.addValidators(this.parseValidator);
      }
      this.validatedControl = control;
    }
    super.registerOnChange(fn);
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
    const text = (event.target as HTMLInputElement).value;
    const before = this.value();
    const hadError = this.rawText.parseErrors().length > 0;
    this.rawText.set(text);
    const value = this.value();
    this.draft.set({ text, value, committed: false });
    if (value !== before) this.notifyChange(value);
    else if (hadError !== this.rawText.parseErrors().length > 0) {
      this.ngControl?.control?.updateValueAndValidity();
    }
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
        this.draft.set(null);
        this.setValue(limit);
        break;
      }
      case 'Enter':
        this.commitDraft();
        break;
    }
  }

  protected onBlur(): void {
    this.stopRepeat();
    this.commitDraft();
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
    this.draft.set(null);
    this.setValue(next);
  }

  /** Shows a valid typed number in the locale format; keeps invalid text for the user to fix. */
  private commitDraft(): void {
    const draft = this.draft();
    if (!draft) return;
    if (draft.value === null) {
      this.draft.set(draft.text.trim() ? { ...draft, committed: true } : null);
      return;
    }
    this.draft.set(null);
    this.setValue(this.clamp(roundTo(draft.value, this.maxFractionDigits())));
  }

  private clamp(value: number): number {
    const min = this.min();
    const max = this.max();
    return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));
  }

  private formatted(value: number | null): string {
    const number = validNumber(value);
    return number === null ? '' : formatNumber(number, this.locale(), this.format());
  }

  private setValue(value: number): void {
    if (value === this.value()) return;
    this.value.set(value);
    this.notifyChange(value);
  }

  private releaseParseValidator(): void {
    const control = this.validatedControl;
    this.validatedControl = null;
    if (!control?.hasValidator(this.parseValidator)) return;
    control.removeValidators(this.parseValidator);
    control.updateValueAndValidity();
  }
}

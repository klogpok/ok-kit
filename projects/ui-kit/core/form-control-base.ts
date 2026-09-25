import {
  DoCheck,
  Directive,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { injectControlState } from './control-state';
import { UI_FORM_FIELD } from './form-field-control';

/**
 * Base class for custom (non-native) form controls such as checkbox, switch and radio group.
 *
 * - **Signal Forms**: subclasses expose a `value` or `checked` model, so `[formField]` binds them
 *   natively as `FormValueControl` / `FormCheckboxControl` (inputs `disabled`, `readonly`,
 *   `required`, `invalid` are set by the directive; `touch` marks the field touched).
 * - **Reactive / template forms**: registers itself as the `ControlValueAccessor` of the host's
 *   `NgControl` (instead of `NG_VALUE_ACCESSOR`, which would force `[formField]` into CVA interop).
 *
 * Subclasses implement `writeValue` and call `notifyChange` / `notifyTouched`. `writeValue` sets the
 * model, so its output (`valueChange` / `checkedChange`) also fires for values written by the
 * forms directive; only `notifyChange` is limited to user changes.
 */
@Directive()
export abstract class UiFormControlBase<T> implements ControlValueAccessor, DoCheck {
  protected readonly controlState = injectControlState();
  protected readonly formField = inject(UI_FORM_FIELD, { optional: true });
  /** Reactive / template forms directive on the host, when bound through CVA. */
  protected readonly ngControl = inject(FORM_FIELD, { self: true, optional: true })
    ? null
    : inject(NgControl, { self: true, optional: true });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * The value is shown and focusable but the user cannot change it. Signal Forms binds it from a
   * `readonly()` rule.
   */
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * Shows the error state when no forms directive is bound. With forms bound, the error state is
   * derived from the control (invalid and touched).
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Ids of the app's own descriptions, kept before the hint / error of `ui-form-field`. */
  readonly ariaDescribedBy = input<string | null>(null, { alias: 'aria-describedby' });
  /** Emits when the user leaves the control. Signal Forms uses it to mark the field touched. */
  readonly touch = output();

  private readonly cvaDisabled = signal(false);
  private onChange: (value: T) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly isDisabled = computed(
    () => this.disabled() || this.cvaDisabled() || this.controlState.disabled(),
  );
  readonly isRequired = computed(() => this.required() || this.controlState.required());
  readonly showError = computed(
    () =>
      this.ownErrors().length > 0 ||
      (this.controlState.bound
        ? this.controlState.invalid() && this.controlState.touched()
        : this.invalid()),
  );
  /** `aria-describedby` of the element that has the control role. */
  protected readonly describedBy = computed(
    () => [this.ariaDescribedBy(), this.formField?.describedBy()].filter(Boolean).join(' ') || null,
  );
  readonly errorMessages = computed(() => [
    ...new Set([...this.ownErrors(), ...this.controlState.errorMessages()]),
  ]);

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  /** `setValidators()` and `addValidators()` emit no event, so re-read the control state here. */
  ngDoCheck(): void {
    this.controlState.sync();
  }

  abstract writeValue(value: T | null | undefined): void;

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
    this.controlState.sync();
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
    this.controlState.sync();
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  /**
   * Errors the control finds itself and shows even without a forms directive, e.g. text that does
   * not parse. Read inside `computed`, so subclasses may read signals.
   */
  protected ownErrors(): readonly string[] {
    return [];
  }

  /** Call when the user changes the value. */
  protected notifyChange(value: T): void {
    this.onChange(value);
  }

  /** Call when focus leaves the control. */
  protected notifyTouched(): void {
    this.onTouched();
    this.touch.emit();
  }
}

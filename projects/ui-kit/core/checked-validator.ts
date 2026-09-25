import { Injectable, Provider } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

/**
 * Reactive / template forms validator of checkbox-like controls: a required control must be
 * checked. `Validators.required` (and the `required` attribute with `ngModel`) accept `false`.
 *
 * A separate object, because the control itself cannot be an `NG_VALIDATORS` provider: it
 * injects `NgControl`, which injects `NG_VALIDATORS`. Used by `ui-checkbox` and `ui-switch`.
 */
@Injectable()
export class UiCheckedValidator implements Validator {
  /** Set by the control. */
  required: () => boolean = () => false;
  private onChange?: () => void;

  validate(control: AbstractControl): ValidationErrors | null {
    return this.required() && control.value !== true ? { required: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onChange = fn;
  }

  /** Call when `required` changes, so the form validates again. */
  requiredChanged(): void {
    this.onChange?.();
  }
}

/** Provides `UiCheckedValidator` as a validator of the control's forms directive. */
export function provideUiCheckedValidator(): Provider[] {
  return [
    UiCheckedValidator,
    { provide: NG_VALIDATORS, useExisting: UiCheckedValidator, multi: true },
  ];
}

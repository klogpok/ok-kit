import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * A multi-valued control (multi-select, chips, toggles, uploads) needs one entry.
 *
 * `Validators.required` passes on an empty array, so a required list needs its own validator,
 * the same way Signal Forms needed `minLength(path, 1)`.
 */
export function uiAtLeastOne(control: AbstractControl): ValidationErrors | null {
  const value = control.value as readonly unknown[] | null;
  return value && value.length > 0 ? null : { minLength: true };
}

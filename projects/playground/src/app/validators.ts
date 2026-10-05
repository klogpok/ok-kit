import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

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

/**
 * `required` whose message travels in the error instead of a projected `<ui-error>`.
 *
 * A field that reads typed text - date, date range, time, number - keeps its own "that is not a
 * date" message, and `ui-form-field` drops those as soon as the host projects one `<ui-error>`.
 * Both controls write `null`, so the host cannot tell an empty field from unreadable text and
 * would hide the field's message behind its own. A string-valued error is merged with the
 * field's messages rather than replacing them, so the user sees both.
 *
 * `Validators.required` stays in the list: `ui-form-field` reads it for the required marker.
 */
export function uiRequired(message: string): ValidatorFn[] {
  return [
    Validators.required,
    (control: AbstractControl) => (Validators.required(control) ? { message } : null),
  ];
}

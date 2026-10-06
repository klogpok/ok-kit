import { AbstractControl } from '@angular/forms';

/**
 * Guards a submit handler: the messages show only on a touched field, so an empty submit has to
 * touch them all. Returns `false` when the form is invalid and the handler must stop.
 */
export function readyToSubmit(form: AbstractControl): boolean {
  if (form.invalid) {
    form.markAllAsTouched();
    return false;
  }
  return true;
}

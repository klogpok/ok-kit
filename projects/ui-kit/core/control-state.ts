import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';
import { AbstractControl, NgControl, ValidationErrors, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

/** Forms-layer state of a control, as the Reactive / template forms directives report it. */
export interface UiControlState {
  /** Whether a forms directive (`formControl`, `formControlName`, `ngModel`, ...) is bound to the host. */
  readonly bound: boolean;
  readonly disabled: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly touched: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly errorMessages: Signal<readonly string[]>;
  /**
   * Re-reads the `NgControl` state. Call it once the control is attached (e.g. from
   * `registerOnTouched` in a ControlValueAccessor, or from `ngDoCheck` in a directive).
   * Subsequent changes are tracked automatically via `AbstractControl.events`.
   */
  sync(): void;
}

interface Snapshot {
  disabled: boolean;
  invalid: boolean;
  touched: boolean;
  required: boolean;
  errors: ValidationErrors | null;
}

const EMPTY: Snapshot = {
  disabled: false,
  invalid: false,
  touched: false,
  required: false,
  errors: null,
};

const sameSnapshot = (a: Snapshot, b: Snapshot): boolean =>
  a.disabled === b.disabled &&
  a.invalid === b.invalid &&
  a.touched === b.touched &&
  a.required === b.required &&
  a.errors === b.errors;

function snapshot(control: AbstractControl): Snapshot {
  return {
    disabled: control.disabled,
    invalid: control.invalid,
    touched: control.touched,
    required:
      control.hasValidator(Validators.required) || control.hasValidator(Validators.requiredTrue),
    errors: control.errors,
  };
}

/** Reactive-forms convention: an error value that is a string, or has a string `message`, is shown. */
function messagesFromErrors(errors: ValidationErrors | null): string[] {
  if (!errors) return [];
  return Object.values(errors).flatMap((value: unknown) => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'object' && value !== null && 'message' in value) {
      const message = value.message;
      return typeof message === 'string' ? [message] : [];
    }
    return [];
  });
}

/**
 * Reads the forms state of the host element from its `NgControl` (`formControl`,
 * `formControlName`, `ngModel`).
 * Must be called in an injection context of a directive/component on the control element.
 */
export function injectControlState(): UiControlState {
  const ngControl = inject(NgControl, { self: true, optional: true });
  const current = signal(EMPTY, { equal: sameSnapshot });
  let tracked: AbstractControl | null = null;
  let subscription: Subscription | undefined;
  inject(DestroyRef).onDestroy(() => subscription?.unsubscribe());

  const sync = (): void => {
    const control = ngControl?.control;
    if (!control) return;
    if (control !== tracked) {
      subscription?.unsubscribe();
      tracked = control;
      subscription = control.events.subscribe(() => current.set(snapshot(control)));
    }
    current.set(snapshot(control));
  };

  return {
    bound: ngControl !== null,
    disabled: computed(() => current().disabled),
    invalid: computed(() => current().invalid),
    touched: computed(() => current().touched),
    required: computed(() => current().required),
    errorMessages: computed(() => messagesFromErrors(current().errors)),
    sync,
  };
}

import { InjectionToken, Signal } from '@angular/core';

/**
 * Contract a control implements so that `ui-form-field` can wire up the label,
 * hint and error message. Provide it with `{ provide: UI_FORM_FIELD_CONTROL, useExisting: MyControl }`.
 */
export interface UiFormFieldControl {
  /** Id of the focusable element (target of `<label for>`). */
  readonly controlId: Signal<string>;
  /**
   * `for`: the form field renders `<label for="id">` (native inputs, checkbox, switch).
   * `labelledby`: the control references the label via `aria-labelledby` (groups).
   */
  readonly labelStrategy: 'for' | 'labelledby';
  readonly isDisabled: Signal<boolean>;
  readonly isRequired: Signal<boolean>;
  /** Whether the control is in an error state that should be shown to the user. */
  readonly showError: Signal<boolean>;
  /** Error messages supplied by the forms layer (Signal Forms `message`, or string-valued errors). */
  readonly errorMessages: Signal<readonly string[]>;
  focus(options?: FocusOptions): void;
}

export const UI_FORM_FIELD_CONTROL = new InjectionToken<UiFormFieldControl>('UiFormFieldControl');

/** What a control can read from its enclosing `ui-form-field`. */
export interface UiFormFieldContext {
  /** Id of the rendered label element. */
  readonly labelId: string;
  /** Space-separated ids of the hint and visible error messages, or `null`. */
  readonly describedBy: Signal<string | null>;
}

export const UI_FORM_FIELD = new InjectionToken<UiFormFieldContext>('UiFormField');

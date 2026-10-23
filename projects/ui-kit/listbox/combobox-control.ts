import { Directive, InjectionToken, Signal, inject } from '@angular/core';
import { UiListboxController } from './listbox-controller';

/**
 * What the inner control of a popup listbox field reads from the field for its combobox ARIA.
 * Provided by `ui-select`, `ui-multi-select`, `ui-autocomplete` and `ui-time-input` with
 * `useExisting`. Internal.
 */
export interface UiPopupListboxFieldState {
  /** Id of the inner control, the target of `<label for>`. */
  readonly controlId: Signal<string>;
  readonly ariaLabel: Signal<string>;
  readonly isRequired: Signal<boolean>;
  /** The field is readonly: its listbox is locked. */
  readonly readonly: Signal<boolean>;
  /** The error state shown to the user. */
  readonly showError: Signal<boolean>;
  /**
   * The app's own descriptions, then the hint or error of `ui-form-field`, or `null`: the
   * protected `describedBy` of `UiFormControlBase`, handed to the directive only.
   */
  readonly ɵdescribedBy: Signal<string | null>;
}

export const UI_POPUP_LISTBOX_FIELD = new InjectionToken<UiPopupListboxFieldState>(
  'UiPopupListboxField',
);

/**
 * The dynamic combobox ARIA of the inner `<input>` or `<button>` of a popup listbox field, from
 * the field and its listbox controller. Static attributes (`role`, `aria-haspopup`,
 * `aria-autocomplete`, `autocomplete`) and the native `readOnly` of an `<input>` stay in the
 * field's template, where the fields differ. `aria-readonly` is set on every field, also on an
 * `<input>` that already has the native `readonly`, so the four fields report it alike. Internal.
 */
@Directive({
  selector: '[uiComboboxControl]',
  host: {
    '[id]': 'field.controlId()',
    '[attr.aria-label]': 'field.ariaLabel() || null',
    '[attr.aria-expanded]': 'listbox.shown()',
    // A hidden list has no rendered panel or option to point at.
    '[attr.aria-controls]': 'listbox.shown() ? listbox.panelId() : null',
    '[attr.aria-activedescendant]': 'listbox.shown() ? listbox.activeId() : null',
    '[attr.aria-required]': "field.isRequired() ? 'true' : null",
    '[attr.aria-readonly]': "field.readonly() ? 'true' : null",
    '[attr.aria-invalid]': "field.showError() ? 'true' : null",
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class UiComboboxControl {
  protected readonly field = inject(UI_POPUP_LISTBOX_FIELD);
  protected readonly listbox = inject(UiListboxController);
  /** Template expressions cannot name a `ɵ` member. */
  protected readonly describedBy = this.field.ɵdescribedBy;
}

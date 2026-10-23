import { Directive, InjectionToken, Signal, inject } from '@angular/core';
import { UiListboxController } from './listbox-controller';

/**
 * What the inner control of a popup listbox field reads from the field for its combobox ARIA.
 * Provided by `ui-select`, `ui-multi-select`, `ui-autocomplete` and `ui-time-input` with
 * `useExisting`. Internal.
 */
export interface UiComboboxField {
  /** Id of the inner control, the target of `<label for>`. */
  readonly controlId: Signal<string>;
  readonly ariaLabel: Signal<string>;
}

export const UI_POPUP_LISTBOX_FIELD = new InjectionToken<UiComboboxField>('UiPopupListboxField');

/**
 * The dynamic combobox ARIA of the inner `<input>` or `<button>` of a popup listbox field, from
 * the field and its listbox controller. Static attributes (`role`, `aria-haspopup`,
 * `aria-autocomplete`, `autocomplete`) and `aria-readonly` stay in the field's template, where
 * the fields differ. Internal.
 */
@Directive({
  selector: '[uiComboboxControl]',
  host: {
    '[id]': 'field.controlId()',
    '[attr.aria-label]': 'field.ariaLabel() || null',
    '[attr.aria-expanded]': 'listbox.shown()',
  },
})
export class UiComboboxControl {
  protected readonly field = inject(UI_POPUP_LISTBOX_FIELD);
  protected readonly listbox = inject(UiListboxController);
}

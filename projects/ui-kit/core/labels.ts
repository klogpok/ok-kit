import { InjectionToken, Provider } from '@angular/core';

/** Built-in texts of kit components (close buttons, confirm dialogs, empty lists). */
export interface UiLabels {
  /** Close buttons of dialogs and toasts. */
  close: string;
  /** Confirm button of `UiDialog.confirm()`. */
  confirm: string;
  /** Cancel button of `UiDialog.confirm()`. */
  cancel: string;
  /** Shown by `ui-select` when no option matches the search. */
  noOptions: string;
  /** Accessible name of the toast region. */
  notifications: string;
}

export const UI_DEFAULT_LABELS: UiLabels = {
  close: 'Close',
  confirm: 'Confirm',
  cancel: 'Cancel',
  noOptions: 'No options',
  notifications: 'Notifications',
};

export const UI_LABELS = new InjectionToken<UiLabels>('UiLabels', {
  providedIn: 'root',
  factory: () => UI_DEFAULT_LABELS,
});

/**
 * Overrides the built-in texts, e.g. for a Hebrew app. Unset keys keep their English defaults.
 *
 * @example provideUiLabels({ close: 'סגירה', confirm: 'אישור', cancel: 'ביטול' })
 */
export function provideUiLabels(labels: Partial<UiLabels>): Provider {
  return { provide: UI_LABELS, useValue: { ...UI_DEFAULT_LABELS, ...labels } };
}

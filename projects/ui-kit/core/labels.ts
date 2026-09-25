import { InjectionToken, Provider, Signal, computed, isSignal, signal } from '@angular/core';

/** Built-in texts of kit components (close buttons, confirm dialogs, empty lists, ...). */
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
  /** Accessible name of `ui-spinner` when it has no `label`. */
  loading: string;
}

/** Hebrew texts, the default: the VPlans apps are in Hebrew. */
export const UI_LABELS_HE: UiLabels = {
  close: 'סגירה',
  confirm: 'אישור',
  cancel: 'ביטול',
  noOptions: 'אין תוצאות',
  notifications: 'התראות',
  loading: 'טוען',
};

export const UI_LABELS_EN: UiLabels = {
  close: 'Close',
  confirm: 'Confirm',
  cancel: 'Cancel',
  noOptions: 'No options',
  notifications: 'Notifications',
  loading: 'Loading',
};

/** Current texts. A signal, so components follow a runtime language switch. */
export const UI_LABELS = new InjectionToken<Signal<UiLabels>>('UiLabels', {
  providedIn: 'root',
  factory: () => signal(UI_LABELS_HE).asReadonly(),
});

/** Texts for `provideUiLabels()`: fixed values, a signal, or a factory run in an injection context. */
export type UiLabelsSource =
  | Partial<UiLabels>
  | Signal<Partial<UiLabels>>
  | (() => Partial<UiLabels> | Signal<Partial<UiLabels>>);

/**
 * Sets the built-in texts. Keys you leave out keep the Hebrew defaults (`UI_LABELS_HE`).
 * Works with any i18n setup:
 *
 * @example
 * // English app
 * provideUiLabels(UI_LABELS_EN)
 *
 * @example
 * // @angular/localize
 * provideUiLabels({ close: $localize`:@@ui.close:Close`, cancel: $localize`:@@ui.cancel:Cancel` })
 *
 * @example
 * // Transloco (or ngx-translate): follows the active language
 * provideUiLabels(() =>
 *   toSignal(inject(TranslocoService).selectTranslateObject('uiKit'), { initialValue: {} }),
 * )
 */
export function provideUiLabels(source: UiLabelsSource): Provider {
  return {
    provide: UI_LABELS,
    useFactory: (): Signal<UiLabels> => {
      const labels = isSignal(source) || typeof source !== 'function' ? source : source();
      return computed(() => ({ ...UI_LABELS_HE, ...(isSignal(labels) ? labels() : labels) }));
    },
  };
}

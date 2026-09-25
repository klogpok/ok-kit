import { InjectionToken, Provider, Signal, computed, isSignal, signal } from '@angular/core';

/**
 * Built-in texts of kit components (close buttons, confirm dialogs, empty lists, ...).
 * Texts with numbers are formatter functions.
 */
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
  /** Accessible name of the `ui-pagination` navigation landmark. */
  pagination: string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
  /** Label of the page size select of `ui-pagination`. */
  itemsPerPage: string;
  /** Accessible name of a page button, e.g. "Page 3". */
  pageLabel: (page: number) => string;
  /** Range summary of `ui-pagination`, e.g. "11–20 of 57". `start` is 1-based; 0 when empty. */
  pageRange: (start: number, end: number, length: number) => string;
  /** BCP 47 locale for dates: parsing, formatting, month and weekday names, first day of week. */
  locale: string;
  /** Calendar button and dialog of `ui-datepicker`. */
  chooseDate: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
}

/** Hebrew texts, the default: the VPlans apps are in Hebrew. */
export const UI_LABELS_HE: UiLabels = {
  close: 'סגירה',
  confirm: 'אישור',
  cancel: 'ביטול',
  noOptions: 'אין תוצאות',
  notifications: 'התראות',
  loading: 'טוען',
  pagination: 'עימוד',
  firstPage: 'עמוד ראשון',
  previousPage: 'עמוד קודם',
  nextPage: 'עמוד הבא',
  lastPage: 'עמוד אחרון',
  itemsPerPage: 'פריטים בעמוד',
  pageLabel: (page) => `עמוד ${page}`,
  // The isolate (LRI…PDI) keeps "51–75" from being reordered to "75–51" in RTL text.
  pageRange: (start, end, length) => `\u2066${start}–${end}\u2069 מתוך ${length}`,
  locale: 'he-IL',
  chooseDate: 'בחירת תאריך',
  previousMonth: 'חודש קודם',
  nextMonth: 'חודש הבא',
  previousYear: 'שנה קודמת',
  nextYear: 'שנה הבאה',
};

export const UI_LABELS_EN: UiLabels = {
  close: 'Close',
  confirm: 'Confirm',
  cancel: 'Cancel',
  noOptions: 'No options',
  notifications: 'Notifications',
  loading: 'Loading',
  pagination: 'Pagination',
  firstPage: 'First page',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  lastPage: 'Last page',
  itemsPerPage: 'Items per page',
  pageLabel: (page) => `Page ${page}`,
  pageRange: (start, end, length) => `${start}–${end} of ${length}`,
  locale: 'en-US',
  chooseDate: 'Choose date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
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

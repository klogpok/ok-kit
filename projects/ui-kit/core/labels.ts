import { InjectionToken, Provider, Signal, computed, isSignal, signal } from '@angular/core';

/**
 * Built-in texts of kit components (close buttons, confirm dialogs, empty lists, ...).
 * Texts with numbers are formatter functions.
 */
export interface UiLabels {
  /** Close buttons of dialogs and toasts. */
  close: string;
  /** Close button of a dismissible `ui-alert`. */
  dismiss: string;
  /** Confirm button of `UiDialog.confirm()`. */
  confirm: string;
  /** Cancel button of `UiDialog.confirm()`. */
  cancel: string;
  /** Shown by `ui-select` when no option matches the search. */
  noOptions: string;
  /** Clear buttons of `ui-select`, `ui-multi-select` and `ui-datepicker`. */
  clear: string;
  /** Accessible name of the toast region. */
  notifications: string;
  /**
   * Read after the label of a `ui-form-field` marked `required` whose control is not required
   * itself (e.g. a group where one choice is needed).
   */
  required: string;
  /** Accessible name of `ui-spinner` when it has no `label`. */
  loading: string;
  /** Accessible name of the `ui-pagination` navigation landmark. */
  pagination: string;
  /** Accessible name of the `nav[ui-breadcrumbs]` landmark. */
  breadcrumbs: string;
  /** Button that shows the collapsed items of `nav[ui-breadcrumbs]`. */
  showMore: string;
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
  /** Header checkbox of a table selection (`th[ui-table-select-all]`). */
  selectAll: string;
  /** Row checkbox of a table selection (`td[ui-table-select-row]`). */
  selectRow: string;
  /** Button of `td[ui-row-toggle]` that shows the detail row of a table row. */
  rowDetails: string;
  /** Name of the scrolling area of a `ui-table-container` whose table has no caption. */
  scrollableTable: string;
  /** Announced when a `th[ui-sort-header]` sorts its column in ascending order. */
  sortedAscending: (column: string) => string;
  /** Announced when a `th[ui-sort-header]` sorts its column in descending order. */
  sortedDescending: (column: string) => string;
  /** Announced when a `th[ui-sort-header]` removes the sort. */
  sortedNone: string;
  /** Accessible name of the "+N" counter of `ui-avatar-group`, e.g. "3 more". */
  moreCount: (count: number) => string;
  /** BCP 47 locale for dates: parsing, formatting, month and weekday names, first day of week. */
  locale: string;
  /** Calendar button and dialog of `ui-datepicker`. */
  chooseDate: string;
  /** Title button of `ui-calendar` that shows the months of the year. */
  chooseMonth: string;
  /** Title button of `ui-calendar` that shows a page of years. */
  chooseYear: string;
  /** Button of the `ui-datepicker` calendar that picks today. */
  today: string;
  /** Calendar button and dialog of `ui-date-range-picker`. */
  chooseDateRange: string;
  /** Start field of `ui-date-range-picker` and the first day of a calendar range. */
  startDate: string;
  /** End field of `ui-date-range-picker` and the last day of a calendar range. */
  endDate: string;
  /** Group of preset buttons in the `ui-date-range-picker` dialog. */
  dateRangePresets: string;
  /** Remove button of a removable `ui-chip`, e.g. "Remove Haifa". */
  removeChip: (label: string) => string;
  /** Announced when a chip is removed, e.g. "Haifa removed". */
  chipRemoved: (label: string) => string;
  /** Text of the `ui-file-upload` drop area. */
  dropFiles: string;
  /** Text of the `ui-file-upload` button (`variant="button"`). */
  chooseFiles: string;
  /** Remove button of a file in `ui-file-upload`, e.g. "Remove plan.pdf". */
  removeFile: (name: string) => string;
  /** Announced when a file is removed from `ui-file-upload`. */
  fileRemoved: (name: string) => string;
  /** Error of a file larger than `maxSize` (a formatted size, e.g. "10 MB"). */
  fileTooLarge: (name: string, maxSize: string) => string;
  /** Error of a file that `accept` does not allow. */
  fileTypeNotAllowed: (name: string) => string;
  /** Error when there are more files than `maxFiles`. */
  tooManyFiles: (max: number) => string;
  /** Stepper buttons of `ui-number-input`. */
  increment: string;
  decrement: string;
  /** Error of `ui-number-input` for text that is not a number. */
  invalidNumber: string;
  /** Error of `ui-datepicker` for text that is not an allowed date. */
  invalidDate: string;
  /** Error of `ui-date-range-picker` when the end is before the start. */
  invalidDateRange: string;
  /** Error of `ui-time-input` for text that is not an allowed time. */
  invalidTime: string;
  /** Name of the list of steps of `ui-stepper`. */
  steps: string;
  /** Shown under the label of an optional `ui-step`. */
  optional: string;
  /** Read after the label of a done step of `ui-stepper`. */
  stepCompleted: string;
  /** Read after the label of a `ui-stepper` step with errors. */
  stepError: string;
  /** Start thumb of `ui-range-slider`, read after the field label. */
  rangeStart: string;
  /** End thumb of `ui-range-slider`, read after the field label. */
  rangeEnd: string;
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
}

/** Hebrew texts, the default: the VPlans apps are in Hebrew. */
export const UI_LABELS_HE: UiLabels = {
  close: 'סגירה',
  dismiss: 'סגירת ההודעה',
  confirm: 'אישור',
  cancel: 'ביטול',
  noOptions: 'אין תוצאות',
  clear: 'ניקוי',
  notifications: 'התראות',
  required: 'חובה',
  loading: 'טוען',
  pagination: 'עימוד',
  breadcrumbs: 'נתיב ניווט',
  showMore: 'הצגת עוד',
  firstPage: 'עמוד ראשון',
  previousPage: 'עמוד קודם',
  nextPage: 'עמוד הבא',
  lastPage: 'עמוד אחרון',
  itemsPerPage: 'פריטים בעמוד',
  pageLabel: (page) => `עמוד ${page}`,
  // The isolate (LRI…PDI) keeps "51–75" from being reordered to "75–51" in RTL text.
  pageRange: (start, end, length) => `\u2066${start}–${end}\u2069 מתוך ${length}`,
  selectAll: 'בחירת הכול',
  selectRow: 'בחירת שורה',
  rowDetails: 'פרטים',
  scrollableTable: 'טבלה',
  sortedAscending: (column) => `ממוין לפי ${column}, בסדר עולה`,
  sortedDescending: (column) => `ממוין לפי ${column}, בסדר יורד`,
  sortedNone: 'המיון בוטל',
  moreCount: (count) => `עוד ${count}`,
  locale: 'he-IL',
  chooseDate: 'בחירת תאריך',
  chooseMonth: 'בחירת חודש',
  chooseYear: 'בחירת שנה',
  today: 'היום',
  chooseDateRange: 'בחירת טווח תאריכים',
  startDate: 'תאריך התחלה',
  endDate: 'תאריך סיום',
  dateRangePresets: 'טווחים מוכנים',
  removeChip: (label) => `הסרת ${label}`,
  chipRemoved: (label) => `${label} הוסר`,
  dropFiles: 'גררו קבצים לכאן או לחצו לבחירה',
  chooseFiles: 'בחירת קבצים',
  removeFile: (name) => `הסרת ${name}`,
  fileRemoved: (name) => `${name} הוסר`,
  // The isolates (FSI…PDI) keep a Latin file name or size from reordering the Hebrew text.
  fileTooLarge: (name, maxSize) => `\u2068${name}\u2069 גדול מ-\u2068${maxSize}\u2069`,
  fileTypeNotAllowed: (name) => `סוג הקובץ \u2068${name}\u2069 אינו נתמך`,
  tooManyFiles: (max) => `אפשר לצרף עד ${max} קבצים`,
  increment: 'הגדלה',
  decrement: 'הקטנה',
  invalidNumber: 'מספר לא תקין',
  invalidDate: 'תאריך לא תקין',
  invalidDateRange: 'תאריך הסיום מוקדם מתאריך ההתחלה',
  invalidTime: 'שעה לא תקינה',
  steps: 'שלבים',
  optional: 'אופציונלי',
  stepCompleted: 'הושלם',
  stepError: 'יש שגיאות',
  rangeStart: 'מינימום',
  rangeEnd: 'מקסימום',
  previousMonth: 'חודש קודם',
  nextMonth: 'חודש הבא',
  previousYear: 'שנה קודמת',
  nextYear: 'שנה הבאה',
};

export const UI_LABELS_EN: UiLabels = {
  close: 'Close',
  dismiss: 'Dismiss',
  confirm: 'Confirm',
  cancel: 'Cancel',
  noOptions: 'No options',
  clear: 'Clear',
  notifications: 'Notifications',
  required: 'required',
  loading: 'Loading',
  pagination: 'Pagination',
  breadcrumbs: 'Breadcrumbs',
  showMore: 'Show more',
  firstPage: 'First page',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  lastPage: 'Last page',
  itemsPerPage: 'Items per page',
  pageLabel: (page) => `Page ${page}`,
  pageRange: (start, end, length) => `${start}–${end} of ${length}`,
  selectAll: 'Select all',
  selectRow: 'Select row',
  rowDetails: 'Details',
  scrollableTable: 'Table',
  sortedAscending: (column) => `Sorted by ${column}, ascending`,
  sortedDescending: (column) => `Sorted by ${column}, descending`,
  sortedNone: 'Sort removed',
  moreCount: (count) => `${count} more`,
  locale: 'en-US',
  chooseDate: 'Choose date',
  chooseMonth: 'Choose month',
  chooseYear: 'Choose year',
  today: 'Today',
  chooseDateRange: 'Choose dates',
  startDate: 'Start date',
  endDate: 'End date',
  dateRangePresets: 'Quick ranges',
  removeChip: (label) => `Remove ${label}`,
  chipRemoved: (label) => `${label} removed`,
  dropFiles: 'Drop files here or click to browse',
  chooseFiles: 'Choose files',
  removeFile: (name) => `Remove ${name}`,
  fileRemoved: (name) => `${name} removed`,
  fileTooLarge: (name, maxSize) => `${name} is larger than ${maxSize}`,
  fileTypeNotAllowed: (name) => `${name} is not an allowed file type`,
  tooManyFiles: (max) => `Attach up to ${max} files`,
  increment: 'Increase',
  decrement: 'Decrease',
  invalidNumber: 'Enter a valid number',
  invalidDate: 'Enter a valid date',
  invalidDateRange: 'The end date is before the start date',
  invalidTime: 'Enter a valid time',
  steps: 'Steps',
  optional: 'Optional',
  stepCompleted: 'completed',
  stepError: 'has errors',
  rangeStart: 'Minimum',
  rangeEnd: 'Maximum',
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

import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UI_LABELS } from '@vplans/ui-kit/core';
import { UiIcon, uiIconArrowDown, uiIconArrowUp } from '@vplans/ui-kit/icon';

export type UiSortDirection = 'asc' | 'desc';

/** The sorted column and its direction. `null` means unsorted. */
export interface UiSortState {
  active: string;
  direction: UiSortDirection;
}

/**
 * Sort state of a table. Put it on the `<table>` and mark sortable columns with
 * `th[ui-sort-header]`. `sort` supports two-way binding.
 *
 * Clicking a header cycles ascending → descending → unsorted (without `clearable`, it toggles
 * between ascending and descending). Sort the rows yourself, e.g. with `uiSortData()`, or on the
 * server.
 *
 * @example <table ui-table uiSort [(sort)]="sort">...</table>
 */
@Directive({ selector: '[uiSort]', exportAs: 'uiSort' })
export class UiSort {
  readonly sort = model<UiSortState | null>(null);
  /** Whether a third click returns to the unsorted state. */
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Sorts by `column`, or moves an already sorted column to its next direction. */
  toggle(column: string): void {
    const current = this.sort();
    if (current?.active !== column) {
      this.sort.set({ active: column, direction: 'asc' });
    } else if (current.direction === 'asc') {
      this.sort.set({ active: column, direction: 'desc' });
    } else {
      this.sort.set(this.clearable() ? null : { active: column, direction: 'asc' });
    }
  }
}

/**
 * Sortable column header. The header text goes inside a button, so it works with the keyboard;
 * the cell gets `aria-sort` while its column is sorted. Requires `[uiSort]` on the table.
 *
 * Screen readers do not read a changed `aria-sort`, so a click also announces the new order
 * (the `sortedAscending`, `sortedDescending` and `sortedNone` labels with the header text).
 *
 * @example <th ui-sort-header="name">Name</th>
 */
@Component({
  selector: 'th[ui-sort-header]',
  imports: [UiIcon],
  template: `
    <button
      type="button"
      class="ui-sort-header__button"
      [disabled]="isDisabled()"
      (click)="onClick()"
    >
      <span #label class="ui-sort-header__label"><ng-content /></span>
      <ui-icon
        class="ui-sort-header__icon"
        size="sm"
        [icon]="direction() === 'desc' ? icons.desc : icons.asc"
      />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-sort-header',
    '[class.ui-sort-header--active]': '!!direction()',
    '[attr.aria-sort]': 'ariaSort()',
  },
})
export class UiSortHeader {
  protected readonly sort = inject(UiSort);
  private readonly labels = inject(UI_LABELS);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly label = viewChild.required<ElementRef<HTMLElement>>('label');
  protected readonly icons = { asc: uiIconArrowUp, desc: uiIconArrowDown };

  /** Column id stored in `UiSortState.active`. */
  readonly column = input.required<string>({ alias: 'ui-sort-header' });
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly isDisabled = computed(() => this.disabled() || this.sort.disabled());
  protected readonly direction = computed(() => {
    const state = this.sort.sort();
    return state?.active === this.column() ? state.direction : null;
  });
  protected readonly ariaSort = computed(() => {
    const direction = this.direction();
    return direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : null;
  });

  protected onClick(): void {
    this.sort.toggle(this.column());
    const column = (this.label().nativeElement.textContent ?? '').trim();
    const direction = this.direction();
    const labels = this.labels();
    const message =
      direction === 'asc'
        ? labels.sortedAscending(column)
        : direction === 'desc'
          ? labels.sortedDescending(column)
          : labels.sortedNone;
    void this.announcer.announce(message, 'polite');
  }
}

const isEmpty = (value: unknown): boolean =>
  value == null ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value)) ||
  (value instanceof Date && Number.isNaN(value.getTime()));

/**
 * Returns a sorted copy of `data`. Numbers, dates and booleans compare by value, everything else
 * as text with `Intl.Collator` (numeric, so "Plan 2" comes before "Plan 10"). Empty values
 * (`null`, `undefined`, `''`, `NaN`, an Invalid Date) always go last. The sort is stable.
 *
 * @param accessor Reads the value of a column; defaults to `item[column]`.
 * @param locale Collation locale; defaults to the runtime locale. Pass `labels().locale`
 *   (`inject(UI_LABELS)`) to sort like the rest of the kit.
 *
 * @example readonly rows = computed(() => uiSortData(this.plans(), this.sort()));
 */
export function uiSortData<T>(
  data: readonly T[],
  sort: UiSortState | null | undefined,
  accessor: (item: T, column: string) => unknown = (item, column) =>
    (item as Record<string, unknown>)[column],
  locale?: string,
): T[] {
  if (!sort) return [...data];
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  const factor = sort.direction === 'asc' ? 1 : -1;

  const compare = (a: unknown, b: unknown): number => {
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return collator.compare(String(a), String(b));
  };

  return [...data].sort((x, y) => {
    const a = accessor(x, sort.active);
    const b = accessor(y, sort.active);
    if (isEmpty(a) || isEmpty(b)) return Number(isEmpty(a)) - Number(isEmpty(b));
    return factor * compare(a, b);
  });
}

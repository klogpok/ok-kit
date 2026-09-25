import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Signal,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { UiSkeleton } from '@vplans/ui-kit/skeleton';

/** Row density of `table[ui-table]`. */
export type UiTableDensity = 'default' | 'compact';

/**
 * Styles a native `<table>`. Use regular `thead`/`tbody`/`tr`/`th`/`td`, with `scope` on the
 * header cells. Add the class `ui-table-numeric` to cells with numbers to align them to the end.
 *
 * - `loading` sets `aria-busy` and pulses a line under the header. Show `tr[ui-table-skeleton]` rows for the
 *   first load and `tr[ui-table-message]` for empty and error states.
 * - `stickyHeader` keeps the header visible while the page or a scrolling container scrolls.
 * - Sorting: `[uiSort]` on the table and `th[ui-sort-header]`.
 *
 * @example
 * <table ui-table uiSort [(sort)]="sort" [loading]="loading()">
 *   <caption class="ui-visually-hidden">Plans</caption>
 *   <thead><tr><th scope="col" ui-sort-header="name">Name</th></tr></thead>
 *   <tbody>
 *     @for (plan of rows(); track plan.id) { <tr><td>{{ plan.name }}</td></tr> }
 *     @empty { <tr ui-table-message>No plans yet</tr> }
 *   </tbody>
 * </table>
 */
@Component({
  selector: 'table[ui-table]',
  template: '<ng-content />',
  styleUrl: './table.scss',
  // Styles must reach the projected rows and cells; selectors are scoped under `.ui-table`.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-table',
    '[class]': '"ui-table--" + density()',
    '[class.ui-table--sticky-header]': 'stickyHeader()',
    '[class.ui-table--loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class UiTable {
  readonly density = input<UiTableDensity>('default');
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
}

/** Number of columns of the table that contains `row`, read from its first header row. */
function countColumns(row: HTMLElement): number {
  const table = row.closest('table');
  const header = table?.tHead?.rows[0] ?? table?.rows[0];
  const cells = header && header !== row ? [...header.cells] : [];
  return Math.max(
    1,
    cells.reduce((sum, cell) => sum + cell.colSpan, 0),
  );
}

/**
 * Column count of the table around the host row. Read live on first render, then updated when
 * header cells are added or removed (e.g. columns toggled with `@if`).
 */
function injectColumnCount(): Signal<number> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const observed = signal<number | null>(null);
  let observer: MutationObserver | undefined;
  afterNextRender(() => {
    const table = host.closest('table');
    if (!table || typeof MutationObserver === 'undefined') return;
    observer = new MutationObserver(() => observed.set(countColumns(host)));
    observer.observe(table.tHead ?? table, {
      childList: true,
      subtree: true,
      attributeFilter: ['colspan'],
    });
  });
  inject(DestroyRef).onDestroy(() => observer?.disconnect());
  return computed(() => observed() ?? countColumns(host));
}

const optionalNumber = (value: unknown): number | undefined =>
  value == null || value === '' ? undefined : numberAttribute(value);

/**
 * Full-width row for empty, error or "no results" states. Spans every column; the count comes
 * from the header row unless `colspan` is set.
 *
 * @example
 * @empty { <tr ui-table-message>No plans match the filter</tr> }
 */
@Component({
  selector: 'tr[ui-table-message]',
  template: `
    <td class="ui-table-message__cell" [attr.colspan]="span()">
      <ng-content />
    </td>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-table-message' },
})
export class UiTableMessage {
  private readonly columnCount = injectColumnCount();
  readonly colspan = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  protected readonly span = computed(() => this.colspan() ?? this.columnCount());
}

const SKELETON_WIDTHS = ['70%', '90%', '55%', '80%'];

/**
 * Placeholder row shown while the first page loads. One skeleton bar per column; the count
 * comes from the header row unless `columns` is set. Hidden from assistive technologies: set
 * `loading` on the table (it sets `aria-busy`).
 *
 * @example
 * @if (loading()) { @for (i of [1, 2, 3]; track i) { <tr ui-table-skeleton></tr> } }
 */
@Component({
  selector: 'tr[ui-table-skeleton]',
  imports: [UiSkeleton],
  template: `
    @for (width of widths(); track $index) {
      <td><ui-skeleton [width]="width" /></td>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-table-skeleton', 'aria-hidden': 'true' },
})
export class UiTableSkeleton {
  private readonly columnCount = injectColumnCount();
  readonly columns = input<number | undefined, unknown>(undefined, { transform: optionalNumber });

  protected readonly widths = computed(() => {
    const count = this.columns() ?? this.columnCount();
    return Array.from({ length: count }, (_, i) => SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]);
  });
}

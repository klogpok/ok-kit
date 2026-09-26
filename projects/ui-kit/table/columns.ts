import {
  DestroyRef,
  ElementRef,
  Injectable,
  Signal,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

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
 * Header changes of a `table[ui-table]`, watched once for all its message and skeleton rows.
 * Internal.
 */
@Injectable()
export class UiTableColumns {
  private readonly version = signal(0);

  constructor() {
    const table = inject<ElementRef<HTMLTableElement>>(ElementRef).nativeElement;
    let observer: MutationObserver | undefined;
    afterNextRender(() => {
      if (typeof MutationObserver === 'undefined') return;
      observer = new MutationObserver(() => this.version.update((v) => v + 1));
      observer.observe(table.tHead ?? table, {
        childList: true,
        subtree: true,
        attributeFilter: ['colspan'],
      });
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  countFor(row: HTMLElement): Signal<number> {
    return computed(() => {
      this.version();
      return countColumns(row);
    });
  }
}

/**
 * Column count of the table around the host row. Read live on first render, then updated when
 * header cells are added or removed (e.g. columns toggled with `@if`).
 */
export function injectColumnCount(): Signal<number> {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const shared = inject(UiTableColumns, { optional: true });
  if (shared) return shared.countFor(host);
  // A row in a plain table (not `table[ui-table]`) watches the header itself.
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

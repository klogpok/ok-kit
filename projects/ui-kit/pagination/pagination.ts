import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  untracked,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UI_LABELS } from '@vplans/ui-kit/core';
import {
  UiIcon,
  uiIconChevronLeft,
  uiIconChevronRight,
  uiIconChevronsLeft,
  uiIconChevronsRight,
} from '@vplans/ui-kit/icon';
import { UiOption, UiSelect } from '@vplans/ui-kit/select';

/** Emitted by `ui-pagination` when the page or the page size changes. */
export interface UiPageEvent {
  pageIndex: number;
  previousPageIndex: number;
  pageSize: number;
  length: number;
}

/** A page button or a gap ("…") in `ui-pagination`. */
export type UiPageItem = { kind: 'page'; index: number } | { kind: 'gap'; key: 'start' | 'end' };

/**
 * Builds the page buttons: the first and last page, the current page with `siblings` on each
 * side, and gaps. A gap that would hide a single page shows that page instead, so the number of
 * items stays the same while paging.
 */
export function uiPageItems(pageCount: number, current: number, siblings: number): UiPageItem[] {
  const page = (index: number): UiPageItem => ({ kind: 'page', index });
  if (pageCount <= siblings * 2 + 5) return Array.from({ length: pageCount }, (_, i) => page(i));

  const last = pageCount - 1;
  const start = Math.max(Math.min(current - siblings, last - siblings * 2 - 2), 2);
  const end = Math.min(Math.max(current + siblings, siblings * 2 + 2), last - 2);
  const items: UiPageItem[] = [page(0)];
  items.push(start > 2 ? { kind: 'gap', key: 'start' } : page(1));
  for (let i = start; i <= end; i++) items.push(page(i));
  items.push(end < last - 2 ? { kind: 'gap', key: 'end' } : page(last - 1));
  items.push(page(last));
  return items;
}

/**
 * Navigation between pages of a list or a table. `pageIndex` (0-based) and `pageSize` support
 * two-way binding; `page` fires on every change with the previous index.
 *
 * The host is a `navigation` landmark. The current page has `aria-current="page"` and the range
 * summary is announced when it changes. The chevrons mirror in RTL. When a button becomes
 * disabled after use (Next on the last page), focus moves to the current page.
 *
 * @example
 * <ui-pagination [length]="total()" [(pageIndex)]="page" [(pageSize)]="size"
 *   [pageSizeOptions]="[10, 25, 50]" (page)="load($event)" />
 */
@Component({
  selector: 'ui-pagination',
  imports: [UiIcon, UiIconButton, UiSelect, UiOption],
  template: `
    <div class="ui-pagination__summary">
      @if (pageSizeOptions().length) {
        <span class="ui-pagination__size-label" aria-hidden="true">{{
          labels().itemsPerPage
        }}</span>
        <ui-select
          class="ui-pagination__size"
          size="sm"
          [aria-label]="labels().itemsPerPage"
          [value]="pageSize()"
          [disabled]="disabled()"
          (valueChange)="onPageSize($event)"
        >
          @for (option of pageSizeOptions(); track option) {
            <ui-option [value]="option">{{ option }}</ui-option>
          }
        </ui-select>
      }
      <span class="ui-pagination__range">{{ range() }}</span>
    </div>

    <div class="ui-pagination__pages">
      @if (showFirstLast()) {
        <button
          ui-icon-button
          size="sm"
          [label]="labels().firstPage"
          [disabled]="disabled() || isFirst()"
          (click)="onPage(0, true)"
        >
          <ui-icon [icon]="icons.first" flipRtl />
        </button>
      }
      <button
        ui-icon-button
        size="sm"
        [label]="labels().previousPage"
        [disabled]="disabled() || isFirst()"
        (click)="onPage(current() - 1, true)"
      >
        <ui-icon [icon]="icons.previous" flipRtl />
      </button>

      @for (item of items(); track item.kind === 'page' ? item.index : item.key) {
        @if (item.kind === 'page') {
          <button
            type="button"
            class="ui-pagination__page"
            [class.ui-pagination__page--current]="item.index === current()"
            [attr.aria-current]="item.index === current() ? 'page' : null"
            [attr.aria-label]="labels().pageLabel(item.index + 1)"
            [disabled]="disabled()"
            (click)="onPage(item.index)"
          >
            {{ item.index + 1 }}
          </button>
        } @else {
          <span class="ui-pagination__gap" aria-hidden="true">…</span>
        }
      }

      <button
        ui-icon-button
        size="sm"
        [label]="labels().nextPage"
        [disabled]="disabled() || isLast()"
        (click)="onPage(current() + 1, true)"
      >
        <ui-icon [icon]="icons.next" flipRtl />
      </button>
      @if (showFirstLast()) {
        <button
          ui-icon-button
          size="sm"
          [label]="labels().lastPage"
          [disabled]="disabled() || isLast()"
          (click)="onPage(pageCount() - 1, true)"
        >
          <ui-icon [icon]="icons.last" flipRtl />
        </button>
      }
    </div>
  `,
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-pagination',
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel() || labels().pagination',
  },
})
export class UiPagination {
  protected readonly labels = inject(UI_LABELS);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly icons = {
    first: uiIconChevronsLeft,
    previous: uiIconChevronLeft,
    next: uiIconChevronRight,
    last: uiIconChevronsRight,
  };

  /** Total number of items. */
  readonly length = input(0, { transform: numberAttribute });
  /** 0-based index of the current page. */
  readonly pageIndex = model(0);
  readonly pageSize = model(10);
  /** Choices for the page size select. Empty hides the select. */
  readonly pageSizeOptions = input<readonly number[]>([]);
  /** Pages shown on each side of the current page. */
  readonly siblingCount = input(1, { transform: numberAttribute });
  readonly showFirstLast = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Name of the navigation landmark. Defaults to the `pagination` label. */
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly page = output<UiPageEvent>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.length() / Math.max(1, this.pageSize()))),
  );
  /** The page index clamped to the existing pages. */
  protected readonly current = computed(() =>
    Math.min(Math.max(0, Math.floor(this.pageIndex()) || 0), this.pageCount() - 1),
  );
  protected readonly isFirst = computed(() => this.current() === 0);
  protected readonly isLast = computed(() => this.current() === this.pageCount() - 1);
  protected readonly items = computed(() =>
    uiPageItems(this.pageCount(), this.current(), Math.max(0, this.siblingCount())),
  );
  protected readonly range = computed(() => {
    const length = this.length();
    const size = Math.max(1, this.pageSize());
    const start = length === 0 ? 0 : this.current() * size + 1;
    const end = Math.min(length, (this.current() + 1) * size);
    return this.labels().pageRange(start, end, length);
  });

  constructor() {
    // When the list shrinks (e.g. a filter), move the parent to the last existing page. Not while
    // `length` is 0: that is usually "not loaded yet", and a restored page index must survive it.
    effect(() => {
      const index = this.pageIndex();
      const current = this.current();
      if (this.length() === 0 || index === current) return;
      untracked(() => {
        this.pageIndex.set(current);
        this.emit(index);
      });
    });
  }

  /**
   * Goes to a page (clamped to the existing ones). With `keepFocus`, focus moves to the current
   * page button when the button that was used becomes disabled.
   */
  goTo(index: number, keepFocus = false): void {
    const target = Math.min(Math.max(0, index), this.pageCount() - 1);
    const previous = this.current();
    if (target === previous) return;
    this.pageIndex.set(target);
    this.emit(previous);
    if (keepFocus && (target === 0 || target === this.pageCount() - 1)) {
      afterNextRender(
        { write: () => this.host.querySelector<HTMLElement>('[aria-current="page"]')?.focus() },
        { injector: this.injector },
      );
    }
  }

  /** A page button: go there and say the new range (not for data refreshes or code). */
  protected onPage(index: number, keepFocus = false): void {
    const before = this.current();
    this.goTo(index, keepFocus);
    if (this.current() !== before) this.announceRange();
  }

  protected onPageSize(size: number | null): void {
    const before = this.pageSize();
    this.changePageSize(size);
    if (this.pageSize() !== before) this.announceRange();
  }

  private announceRange(): void {
    void this.announcer.announce(this.range(), 'polite');
  }

  private changePageSize(size: number | null): void {
    if (size == null || size === this.pageSize()) return;
    const previous = this.current();
    // Keep the first item of the current page visible.
    const firstItem = previous * this.pageSize();
    this.pageSize.set(size);
    this.pageIndex.set(Math.floor(firstItem / size));
    this.emit(previous);
  }

  private emit(previousPageIndex: number): void {
    this.page.emit({
      pageIndex: this.current(),
      previousPageIndex,
      pageSize: this.pageSize(),
      length: this.length(),
    });
  }
}

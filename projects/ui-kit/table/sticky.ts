import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { UI_LABELS } from '@vplans/ui-kit/core';

/** Side a sticky column sticks to. `start` is the left side in LTR and the right side in RTL. */
export type UiStickySide = 'start' | 'end';

/** Offsets of the sticky columns of a table, by column index. */
interface StickyLayout {
  offsets: ReadonlyMap<number, number>;
  /** Total width of the `start` and of the `end` columns. */
  startWidth: number;
  endWidth: number;
}

const EMPTY_LAYOUT: StickyLayout = {
  offsets: new Map(),
  startWidth: 0,
  endWidth: 0,
};

interface StickyCell {
  element: HTMLTableCellElement;
  side: () => UiStickySide;
}

/**
 * Sticky cells of a `table[ui-table]`. Measures the sticky columns so that a second sticky column
 * sticks next to the first one. Provided by `UiTable`. Internal.
 */
@Injectable()
export class UiTableSticky {
  private readonly cells = signal<readonly StickyCell[]>([]);
  /** Bumped when a sticky cell changes size. */
  private readonly version = signal(0);
  private readonly observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => this.version.update((v) => v + 1));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  readonly layout = computed<StickyLayout>(() => {
    this.version();
    const cells = this.cells();
    if (!cells.length) return EMPTY_LAYOUT;
    // Cells of one column have one width; colspans are not supported.
    const columns = new Map<number, { side: UiStickySide; width: number }>();
    for (const cell of cells) {
      const index = cell.element.cellIndex;
      if (index < 0) continue;
      const width = cell.element.getBoundingClientRect().width;
      const known = columns.get(index);
      columns.set(index, { side: cell.side(), width: Math.max(width, known?.width ?? 0) });
    }
    const offsets = new Map<number, number>();
    const place = (indexes: number[]): number => {
      let total = 0;
      for (const index of indexes) {
        offsets.set(index, total);
        total += columns.get(index)?.width ?? 0;
      }
      return total;
    };
    const all = [...columns.keys()].sort((a, b) => a - b);
    const start = all.filter((index) => columns.get(index)?.side === 'start');
    const end = all.filter((index) => columns.get(index)?.side === 'end').reverse();
    return {
      offsets,
      startWidth: place(start),
      endWidth: place(end),
    };
  });

  register(cell: StickyCell): () => void {
    this.cells.update((cells) => [...cells, cell]);
    this.observer?.observe(cell.element);
    return () => {
      this.observer?.unobserve(cell.element);
      this.cells.update((cells) => cells.filter((c) => c !== cell));
    };
  }
}

/**
 * Keeps a column visible while a `ui-table-container` scrolls sideways. Mark the header cell and
 * the body cells of the column. Several columns can stick to one side; each one sticks next to
 * the previous one. The container draws a shadow next to them while content scrolls under them.
 *
 * @example
 * <th scope="col" uiSticky>Name</th>
 * <td uiSticky>{{ plan.name }}</td>
 * <td uiSticky="end"><button ui-icon-button label="Edit">...</button></td>
 */
@Directive({
  selector: 'th[uiSticky], td[uiSticky]',
  host: {
    class: 'ui-sticky',
    '[class.ui-sticky--start]': 'side() === "start"',
    '[class.ui-sticky--end]': 'side() === "end"',
    '[style.inset-inline-start.px]': 'side() === "start" ? offset() : null',
    '[style.inset-inline-end.px]': 'side() === "end" ? offset() : null',
  },
})
export class UiSticky {
  private readonly element = inject<ElementRef<HTMLTableCellElement>>(ElementRef).nativeElement;
  private readonly sticky = inject(UiTableSticky, { optional: true });

  readonly side = input<UiStickySide, UiStickySide | ''>('start', {
    alias: 'uiSticky',
    transform: (value) => value || 'start',
  });

  protected readonly offset = computed(
    () => this.sticky?.layout().offsets.get(this.element.cellIndex) ?? 0,
  );

  constructor() {
    const release = this.sticky?.register({ element: this.element, side: () => this.side() });
    if (release) inject(DestroyRef).onDestroy(release);
  }
}

/**
 * Scrolls a wide `table[ui-table]` sideways inside its own box, with a shadow at an edge while
 * there is more content behind it. Combine it with `uiSticky` columns.
 *
 * While the table is wider than the box, the scrolling area is focusable (so keyboard users can
 * scroll it) and is a region named by `label`, by the table caption, or by the `scrollableTable`
 * label. Give the container a `max-block-size` to scroll long tables vertically too, with a
 * `stickyHeader`.
 *
 * @example
 * <ui-table-container label="Plans" style="max-block-size: 30rem">
 *   <table ui-table stickyHeader>...</table>
 * </ui-table-container>
 */
@Component({
  selector: 'ui-table-container',
  template: `
    <div
      #scroller
      class="ui-table-container__scroller"
      [attr.tabindex]="overflowing() ? 0 : null"
      [attr.role]="overflowing() ? 'region' : null"
      [attr.aria-label]="overflowing() && !captionId() ? label() || labels().scrollableTable : null"
      [attr.aria-labelledby]="overflowing() ? captionId() : null"
      (scroll)="measure()"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './table-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-table-container',
    '[class.ui-table-container--scroll-start]': 'hiddenStart()',
    '[class.ui-table-container--scroll-end]': 'hiddenEnd()',
    '[style.--_sticky-start]': 'stickyStart()',
    '[style.--_sticky-end]': 'stickyEnd()',
  },
})
export class UiTableContainer {
  protected readonly labels = inject(UI_LABELS);
  private readonly ids = inject(_IdGenerator);

  /** Name of the scrolling region. Defaults to the table caption. */
  readonly label = input('');

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');
  private readonly sticky = contentChild(UiTableSticky, { descendants: true });

  protected readonly overflowing = signal(false);
  protected readonly hiddenStart = signal(false);
  protected readonly hiddenEnd = signal(false);
  protected readonly captionId = signal<string | null>(null);

  protected readonly stickyStart = computed(() => `${this.sticky()?.layout().startWidth ?? 0}px`);
  protected readonly stickyEnd = computed(() => `${this.sticky()?.layout().endWidth ?? 0}px`);

  constructor() {
    let observer: ResizeObserver | undefined;
    afterNextRender(() => {
      const scroller = this.scroller().nativeElement;
      this.measure();
      if (typeof ResizeObserver === 'undefined') return;
      observer = new ResizeObserver(() => this.measure());
      observer.observe(scroller);
      for (const child of scroller.children) observer.observe(child);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  /** Reads the scroll position; runs on scroll and resize. */
  protected measure(): void {
    const scroller = this.scroller().nativeElement;
    const max = scroller.scrollWidth - scroller.clientWidth;
    // RTL scrolls from 0 to negative values.
    const position = Math.abs(scroller.scrollLeft);
    const overflowing = max > 1;
    this.overflowing.set(overflowing);
    this.hiddenStart.set(overflowing && position > 1);
    this.hiddenEnd.set(overflowing && position < max - 1);
    const caption = !this.label() ? scroller.querySelector('table > caption') : null;
    if (caption && !caption.id) caption.id = this.ids.getId('ui-table-caption-');
    this.captionId.set(caption?.id ?? null);
  }
}

import {
  Directive,
  ElementRef,
  EmbeddedViewRef,
  ViewContainerRef,
  afterEveryRender,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { UI_LABELS } from '@vplans/ui-kit/core';

/**
 * Turns a `cdk-virtual-scroll-viewport` around a `table[ui-table]` into the table's scrolling
 * region, for tables with thousands of rows. Render the body rows with `*cdkVirtualFor`; only
 * the rows in view are in the page.
 *
 * - The table gets `aria-rowcount` (header rows plus every data row) and each rendered row of
 *   `*cdkVirtualFor` its `aria-rowindex`, so screen readers announce the position in the whole
 *   table. Other body rows (a message row, a totals body) get no index.
 * - The viewport is a focusable region (keyboard users can scroll it) named by its `aria-label`,
 *   by the table caption, or by the `scrollableTable` label.
 *
 * Every row must have the height given in `itemSize`; detail rows (`uiExpandableRow`) do not fit.
 * Give the viewport a `block-size`, and use `stickyHeader` to keep the header in view.
 *
 * @example
 * <cdk-virtual-scroll-viewport uiTableViewport itemSize="44" style="block-size: 30rem">
 *   <table ui-table stickyHeader>
 *     <caption class="ui-visually-hidden">Units</caption>
 *     <thead><tr><th scope="col">Unit</th></tr></thead>
 *     <tbody>
 *       <tr *cdkVirtualFor="let unit of units; trackBy: trackId"><td>{{ unit.name }}</td></tr>
 *     </tbody>
 *   </table>
 * </cdk-virtual-scroll-viewport>
 */
@Directive({
  selector: 'cdk-virtual-scroll-viewport[uiTableViewport]',
  host: {
    class: 'ui-table-viewport',
    role: 'region',
    tabindex: '0',
    '[attr.aria-label]': 'ariaLabel() || (captionId() ? null : labels().scrollableTable)',
    '[attr.aria-labelledby]': 'ariaLabel() ? null : captionId()',
  },
})
export class UiTableViewport {
  protected readonly labels = inject(UI_LABELS);
  private readonly ids = inject(_IdGenerator);
  private readonly viewport = inject(CdkVirtualScrollViewport);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Name of the scrolling region. Defaults to the table caption. */
  readonly ariaLabel = input('', { alias: 'aria-label' });

  protected readonly captionId = signal<string | null>(null);
  /** Holds the rendered views of `*cdkVirtualFor`, in list order. */
  private readonly rows = contentChild(CdkVirtualForOf, {
    read: ViewContainerRef,
    descendants: true,
  });

  constructor() {
    // The rows are the app's own and change with every scroll, so update them after each render.
    afterEveryRender({
      earlyRead: () => this.host.querySelector('thead')?.getBoundingClientRect().height ?? 0,
      write: (headerSize) => this.update(headerSize),
    });
  }

  private update(headerSize: number): void {
    // The viewport moves the table with a transform, which sticky positioning ignores: the header
    // would stick relative to the untransformed table. Pull it back by the same distance.
    const offset = this.viewport.getOffsetToRenderedContentStart();
    if (offset !== null) setStyle(this.host, '--_header-offset', `${-offset}px`);
    // The viewport makes room for the rows only, so the header would hide the last row.
    setStyle(this.host, '--_header-size', `${headerSize}px`);

    const table = this.host.querySelector('table');
    if (!table) return;
    const caption = table.caption;
    if (caption && !caption.id) caption.id = this.ids.getId('ui-table-caption-');
    this.captionId.set(caption?.id ?? null);

    const headRows = table.tHead ? [...table.tHead.rows] : [];
    setAttribute(table, 'aria-rowcount', headRows.length + this.viewport.getDataLength());
    headRows.forEach((row, i) => setAttribute(row, 'aria-rowindex', i + 1));
    const dataRows = this.dataRows();
    for (const body of table.tBodies) {
      for (const row of body.rows) {
        if (!dataRows.includes(row)) row.removeAttribute('aria-rowindex');
      }
    }
    const start = headRows.length + this.viewport.getRenderedRange().start + 1;
    dataRows.forEach((row, i) => setAttribute(row, 'aria-rowindex', start + i));
  }

  /** The rendered rows of `*cdkVirtualFor`. */
  private dataRows(): HTMLTableRowElement[] {
    const container = this.rows();
    if (!container) return [];
    const rows: HTMLTableRowElement[] = [];
    for (let i = 0; i < container.length; i++) {
      const view = container.get(i) as EmbeddedViewRef<unknown>;
      for (const node of view.rootNodes) if (node instanceof HTMLTableRowElement) rows.push(node);
    }
    return rows;
  }
}

function setAttribute(element: Element, name: string, value: number): void {
  if (element.getAttribute(name) !== String(value)) element.setAttribute(name, String(value));
}

function setStyle(element: HTMLElement, name: string, value: string): void {
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}

import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Renderer2,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UI_LABELS } from '@vplans/ui-kit/core';

// The row cell comes first: Storybook compiles in JIT mode, where the `contentChildren` query
// of `UiTableSelection` reads the class when it is declared.
/**
 * Cell with the checkbox of one row. Marks its row (`tr`) with `aria-selected` and the
 * `ui-table-row--selected` class. Requires `[uiTableSelection]` on the table.
 *
 * @example <td [ui-table-select-row]="plan" [label]="'Select ' + plan.name"></td>
 */
@Component({
  selector: 'td[ui-table-select-row]',
  imports: [UiCheckbox],
  template: `
    <ui-checkbox
      class="ui-table-select__checkbox"
      [checked]="selected()"
      [disabled]="isDisabled()"
      [aria-label]="label() || labels().selectRow"
      (checkedChange)="onToggle()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-table-select ui-table-select-row',
    // Shift is read before the checkbox changes, from the pointer or the Space key.
    '(pointerdown)': 'range = $event.shiftKey',
    '(keydown)': 'range = $event.shiftKey',
  },
})
export class UiTableSelectRow<T = unknown> {
  private readonly selection = inject<UiTableSelection<T>>(UiTableSelection);
  protected readonly labels = inject(UI_LABELS);

  /** The row value stored in the selection. */
  readonly row = input.required<T>({ alias: 'ui-table-select-row' });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the checkbox; defaults to the `selectRow` label. */
  readonly label = input('');

  readonly isDisabled = computed(() => this.disabled() || this.selection.disabled());
  protected readonly selected = computed(() => this.selection.isSelected(this.row()));
  protected range = false;

  constructor() {
    const cell = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);
    // The state belongs to the row, which is the app's element.
    effect(() => {
      const row = cell.parentElement;
      if (!row) return;
      const selected = this.selected();
      renderer.setAttribute(row, 'aria-selected', String(selected));
      if (selected) renderer.addClass(row, 'ui-table-row--selected');
      else renderer.removeClass(row, 'ui-table-row--selected');
    });
  }

  protected onToggle(): void {
    this.selection.toggle(this.row(), this.range);
    this.range = false;
  }
}

/**
 * Row selection of a table. Put it on the `<table>` with the selected rows, add
 * `th[ui-table-select-all]` to the header and `td[ui-table-select-row]` to every row.
 * `uiTableSelection` supports two-way binding and holds a new array on every change.
 *
 * - A row checkbox toggles its row; Shift+click (or Shift+Space) sets every row between the
 *   last toggled row and this one to the new state.
 * - The header checkbox selects or deselects the rows on screen. Selected rows that are not on
 *   screen (e.g. other pages) stay selected.
 * - Rows are compared with `selectionCompareWith(row, selected)`, e.g. by id when the data is
 *   reloaded.
 *
 * @example
 * <table ui-table [(uiTableSelection)]="selected">
 *   <thead><tr><th ui-table-select-all></th><th scope="col">Name</th></tr></thead>
 *   <tbody>
 *     @for (plan of rows(); track plan.id) {
 *       <tr><td [ui-table-select-row]="plan"></td><td>{{ plan.name }}</td></tr>
 *     }
 *   </tbody>
 * </table>
 */
@Directive({ selector: 'table[uiTableSelection]', exportAs: 'uiTableSelection' })
export class UiTableSelection<T = unknown> {
  readonly selection = model<readonly T[]>([], { alias: 'uiTableSelection' });
  /** Compares a row with a selected row; defaults to `Object.is`. */
  readonly compareWith = input<(row: T, selected: T) => boolean>(Object.is, {
    alias: 'selectionCompareWith',
  });
  /** Disables every checkbox of the selection. */
  readonly disabled = input(false, { alias: 'selectionDisabled', transform: booleanAttribute });

  private readonly cells = contentChildren<UiTableSelectRow<T>>(UiTableSelectRow, {
    descendants: true,
  });
  /** Row values on screen that can be toggled, in DOM order. */
  private readonly rows = computed(() =>
    this.cells()
      .filter((cell) => !cell.isDisabled())
      .map((cell) => cell.row()),
  );
  /** Every row on screen that can be toggled is selected. */
  readonly allSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every((row) => this.isSelected(row));
  });
  /** Some, but not all, rows on screen are selected. */
  readonly someSelected = computed(
    () => !this.allSelected() && this.rows().some((row) => this.isSelected(row)),
  );
  /** Whether there is a row the header checkbox can toggle. */
  readonly hasRows = computed(() => this.rows().length > 0);

  /** The last row toggled one by one; the other end of a Shift range. */
  private anchor: { row: T } | null = null;

  isSelected(row: T): boolean {
    return this.selection().some((selected) => this.compareWith()(row, selected));
  }

  /**
   * Toggles a row. With `range`, every row between the previously toggled row and this one gets
   * the new state of this row.
   */
  toggle(row: T, range = false): void {
    const target = !this.isSelected(row);
    const rows = this.rows();
    const anchor = this.anchor;
    const from = range && anchor ? rows.findIndex((r) => this.compareWith()(r, anchor.row)) : -1;
    const to = rows.findIndex((r) => this.compareWith()(r, row));
    const affected =
      from >= 0 && to >= 0 ? rows.slice(Math.min(from, to), Math.max(from, to) + 1) : [row];
    this.anchor = { row };
    this.setSelected(affected, target);
  }

  /** Selects the rows on screen, or deselects them when they are all selected. */
  toggleAll(): void {
    this.anchor = null;
    this.setSelected(this.rows(), !this.allSelected());
  }

  select(...rows: T[]): void {
    this.setSelected(rows, true);
  }

  deselect(...rows: T[]): void {
    this.setSelected(rows, false);
  }

  clear(): void {
    this.anchor = null;
    if (this.selection().length) this.selection.set([]);
  }

  private setSelected(rows: readonly T[], selected: boolean): void {
    const current = this.selection();
    const compare = this.compareWith();
    let next: T[];
    if (selected) {
      next = [...current];
      for (const row of rows) if (!next.some((s) => compare(row, s))) next.push(row);
    } else {
      next = current.filter((s) => !rows.some((row) => compare(row, s)));
    }
    if (next.length !== current.length) this.selection.set(next);
  }
}

/**
 * Header cell with a checkbox that selects the rows on screen. It is checked when all of them
 * are selected and mixed when some are. Requires `[uiTableSelection]` on the table.
 *
 * @example <th ui-table-select-all></th>
 */
@Component({
  selector: 'th[ui-table-select-all]',
  imports: [UiCheckbox],
  template: `
    <ui-checkbox
      class="ui-table-select__checkbox"
      [checked]="selection.allSelected()"
      [indeterminate]="selection.someSelected()"
      [disabled]="selection.disabled() || !selection.hasRows()"
      [aria-label]="label() || labels().selectAll"
      (checkedChange)="selection.toggleAll()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-table-select ui-table-select-all', scope: 'col' },
})
export class UiTableSelectAll {
  protected readonly selection = inject(UiTableSelection);
  protected readonly labels = inject(UI_LABELS);
  /** Accessible name of the checkbox; defaults to the `selectAll` label. */
  readonly label = input('');
}

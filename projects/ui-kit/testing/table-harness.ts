import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessLoader,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

/** A column of a table: the text of its header cell, or its index from 0. */
export type UiTableColumn = string | number;

/** State of the select-all checkbox in the header of a table. */
export type UiTableSelectAllState = 'checked' | 'partial' | 'unchecked';

/** The sort state a table shows: the name of the sorted column and its direction. */
export interface UiTableHarnessSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface UiTableCellHarnessFilters extends BaseHarnessFilters {
  /** The text of the cell. */
  text?: string | RegExp;
}

/**
 * A body cell (`td`, or a row header `th`) of `table[ui-table]`. Get it from
 * `UiTableRowHarness.getCell()`; `getHarness()` loads harnesses inside it, e.g. a button.
 */
export class UiTableCellHarness extends UiHarness {
  // The ancestors sit inside `:is()`: jsdom (nwsapi) finds nothing for `tbody > tr > td` when it
  // searches inside a row.
  static hostSelector = ':is(td, th):is(.ui-table > tbody > tr > *)';

  static with<T extends UiTableCellHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTableCellHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }
}

export interface UiTableRowHarnessFilters extends BaseHarnessFilters {
  /**
   * Text of cells by column, e.g. `{ Name: 'Tower A' }`. Column names work on rows from
   * `UiTableHarness.getRows()`; elsewhere use the index (`{ 0: 'Tower A' }`).
   */
  cells?: Record<string, string | RegExp>;
  selected?: boolean;
  expanded?: boolean;
}

/**
 * A data row of `table[ui-table]`: a body row that is not a message, skeleton or detail row. Get it
 * from `UiTableHarness.getRows()`, so that its cells can be read by column name.
 */
export class UiTableRowHarness extends UiHarness {
  // The ancestors sit inside `:is()`, as in `UiTableCellHarness`.
  static hostSelector =
    'tr:is(.ui-table > tbody > *):not(.ui-table-message, .ui-table-skeleton, .ui-row-detail)';

  /** Column names of the table, set by `UiTableHarness`. Internal. */
  ɵcolumns: readonly string[] | null = null;

  static with<T extends UiTableRowHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTableRowHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('cells', options.cells, async (harness, cells) => {
        for (const [column, text] of Object.entries(cells)) {
          const index = /^\d+$/.test(column) ? Number(column) : column;
          const matches = await HarnessPredicate.stringMatches(harness.getCellText(index), text);
          if (!matches) return false;
        }
        return true;
      })
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      )
      .addOption(
        'expanded',
        options.expanded,
        async (harness, expanded) => (await harness.isExpanded()) === expanded,
      );
  }

  /** The cells, in order. */
  async getCells(filters: UiTableCellHarnessFilters = {}): Promise<UiTableCellHarness[]> {
    return this.locatorForAll(UiTableCellHarness.with(filters))();
  }

  /** The cell of a column. Cells are matched to the header by position; colspans are not counted. */
  async getCell(column: UiTableColumn): Promise<UiTableCellHarness> {
    const index = this.columnIndex(column);
    const cells = await this.getCells();
    if (index < 0 || index >= cells.length) {
      throw Error(`The row has no cell in column ${column}.`);
    }
    return cells[index];
  }

  async getCellText(column: UiTableColumn): Promise<string> {
    return (await this.getCell(column)).getText();
  }

  async getCellTexts(): Promise<string[]> {
    return Promise.all((await this.getCells()).map((cell) => cell.getText()));
  }

  /** The text of each cell under the name of its column. */
  async getCellTextByColumn(): Promise<Record<string, string>> {
    const columns = this.columnNames();
    const texts = await this.getCellTexts();
    return Object.fromEntries(columns.map((column, i) => [column, texts[i] ?? '']));
  }

  /** Whether the row is selected (`uiTableSelection`). */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Whether the checkbox of the row is disabled; `false` for a row without one. */
  async isSelectionDisabled(): Promise<boolean> {
    return (await (await this.checkbox())?.getProperty<boolean>('disabled')) ?? false;
  }

  /** Checks the checkbox of the row unless the row is selected. */
  async select(): Promise<void> {
    if (!(await this.isSelected())) await this.toggleSelection();
  }

  /** Unchecks the checkbox of the row if the row is selected. */
  async deselect(): Promise<void> {
    if (await this.isSelected()) await this.toggleSelection();
  }

  /**
   * Clicks the checkbox of the row. A harness click carries no Shift on `pointerdown`, so Shift
   * range selection is not available here.
   */
  async toggleSelection(): Promise<void> {
    const checkbox = await this.checkbox();
    if (!checkbox) throw Error('The row has no selection checkbox (td[ui-table-select-row]).');
    if (await checkbox.getProperty<boolean>('disabled')) {
      throw Error('The selection checkbox of the row is disabled.');
    }
    await checkbox.click();
  }

  /** Whether the row has a detail toggle (`td[ui-row-toggle]`). */
  async isExpandable(): Promise<boolean> {
    return (await this.toggle()) !== null;
  }

  async isExpanded(): Promise<boolean> {
    return (await (await this.toggle())?.getAttribute('aria-expanded')) === 'true';
  }

  async expand(): Promise<void> {
    if (!(await this.isExpanded())) await this.clickToggle();
  }

  async collapse(): Promise<void> {
    if (await this.isExpanded()) await this.clickToggle();
  }

  /** The text of the detail row (`tr[ui-row-detail]`) while it is shown, otherwise `null`. */
  async getDetailText(): Promise<string | null> {
    const detail = await this.detail();
    if (!detail || (await detail.getProperty<boolean>('hidden'))) return null;
    return (await detail.text()).trim().replace(/\s+/g, ' ');
  }

  /** Loads harnesses in the detail row, e.g. a button in the detail. */
  async getDetailLoader(): Promise<HarnessLoader> {
    const id = await this.detailId();
    if (!id) throw Error('The row has no detail row (tr[ui-row-detail]).');
    return this.documentRootLocatorFactory().harnessLoaderFor(`[id="${id}"]`);
  }

  private toggle() {
    return this.locatorForOptional('.ui-row-toggle__button')();
  }

  private async clickToggle(): Promise<void> {
    const toggle = await this.toggle();
    if (!toggle) throw Error('The row cannot expand: it has no td[ui-row-toggle].');
    await toggle.click();
  }

  private async detailId(): Promise<string | null> {
    return (await (await this.toggle())?.getAttribute('aria-controls')) ?? null;
  }

  private async detail(): Promise<TestElement | null> {
    const id = await this.detailId();
    return id ? this.documentRootLocatorFactory().locatorForOptional(`[id="${id}"]`)() : null;
  }

  private checkbox() {
    return this.locatorForOptional('.ui-table-select-row .ui-checkbox__input')();
  }

  private columnNames(): readonly string[] {
    if (!this.ɵcolumns) {
      throw Error('Get the row from UiTableHarness.getRows() to read cells by column name.');
    }
    return this.ɵcolumns;
  }

  private columnIndex(column: UiTableColumn): number {
    if (typeof column === 'number') return column;
    const index = this.columnNames().indexOf(column);
    if (index < 0) throw Error(`The table has no column "${column}".`);
    return index;
  }
}

export interface UiTableHarnessFilters extends BaseHarnessFilters {
  /** The table caption, or its `aria-label`. */
  label?: string | RegExp;
}

/**
 * Harness for `table[ui-table]`. Reads the rows and their cells by column.
 *
 * In a virtual scroll viewport (`uiTableViewport`) only the rendered rows are in the page, so
 * `getRows()` finds those; `getTotalRowCount()` reads the count of every row.
 */
export class UiTableHarness extends UiHarness {
  static hostSelector = '.ui-table';

  static with<T extends UiTableHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTableHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** The caption text, the `aria-label`, or the text `aria-labelledby` refers to. */
  async getLabel(): Promise<string | null> {
    const caption = await this.locatorForOptional(':scope > caption')();
    if (caption) return (await caption.text()).trim();
    const host = await this.host();
    return (await host.getAttribute('aria-label')) ?? this.labelledByText(host);
  }

  /** Whether the table is busy (`loading`). */
  async isLoading(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-busy')) === 'true';
  }

  /** The text of the message row (`tr[ui-table-message]`), e.g. the empty state. */
  async getMessage(): Promise<string | null> {
    const message = await this.locatorForOptional('.ui-table-message')();
    return message ? (await message.text()).trim() : null;
  }

  /** The texts of the header cells of the last header row. */
  async getColumnNames(): Promise<string[]> {
    const cells = await this.locatorForAll(':scope > thead > tr:last-child > th')();
    return Promise.all(cells.map(async (cell) => (await cell.text()).trim()));
  }

  /** The data rows on screen, in order. */
  async getRows(filters: UiTableRowHarnessFilters = {}): Promise<UiTableRowHarness[]> {
    const columns = await this.getColumnNames();
    const rows = await this.locatorForAll(UiTableRowHarness)();
    for (const row of rows) row.ɵcolumns = columns;
    return UiTableRowHarness.with(filters).filter(rows);
  }

  /**
   * The number of data rows. In a virtual scroll viewport it counts every row, also those that
   * are not rendered (from `aria-rowcount`).
   */
  async getTotalRowCount(): Promise<number> {
    const count = await (await this.host()).getAttribute('aria-rowcount');
    if (count === null) return (await this.locatorForAll(UiTableRowHarness)()).length;
    return Number(count) - (await this.locatorForAll(':scope > thead > tr')()).length;
  }

  /** The first data row that matches the filters. */
  async getRow(filters: UiTableRowHarnessFilters = {}): Promise<UiTableRowHarness> {
    const row = (await this.getRows(filters)).at(0);
    if (!row) throw Error(`No table row matches ${JSON.stringify(filters)}.`);
    return row;
  }

  /** The texts of a column in every data row, e.g. to check the sort order. */
  async getColumnTexts(column: UiTableColumn): Promise<string[]> {
    return Promise.all((await this.getRows()).map((row) => row.getCellText(column)));
  }

  /**
   * The state of the header checkbox (`th[ui-table-select-all]`): `partial` while some rows on
   * screen are selected; `null` without one.
   */
  async getSelectAllState(): Promise<UiTableSelectAllState | null> {
    const checkbox = await this.selectAllCheckbox();
    if (!checkbox) return null;
    if (await checkbox.getProperty<boolean>('indeterminate')) return 'partial';
    return (await checkbox.getProperty<boolean>('checked')) ? 'checked' : 'unchecked';
  }

  /** Selects every row on screen with the header checkbox. */
  async selectAll(): Promise<void> {
    await this.clickSelectAllUntil('checked');
  }

  /** Deselects every row on screen with the header checkbox (a mixed one takes two clicks). */
  async deselectAll(): Promise<void> {
    await this.clickSelectAllUntil('unchecked');
  }

  private async clickSelectAllUntil(state: UiTableSelectAllState): Promise<void> {
    const checkbox = await this.selectAllCheckbox();
    if (!checkbox) throw Error('The table has no select-all checkbox (th[ui-table-select-all]).');
    for (let clicks = 0; clicks < 2 && (await this.getSelectAllState()) !== state; clicks++) {
      if (await checkbox.getProperty<boolean>('disabled')) {
        throw Error('The select-all checkbox is disabled.');
      }
      await checkbox.click();
    }
  }

  private selectAllCheckbox() {
    return this.locatorForOptional('.ui-table-select-all .ui-checkbox__input')();
  }

  /** The names of the columns with a sort header (`th[ui-sort-header]`). */
  async getSortableColumns(): Promise<string[]> {
    const headers = await this.locatorForAll('.ui-sort-header')();
    return Promise.all(headers.map(async (header) => (await header.text()).trim()));
  }

  /** The sorted column, by its name, and the direction; `null` while unsorted. */
  async getSort(): Promise<UiTableHarnessSort | null> {
    const header = await this.locatorForOptional('.ui-sort-header[aria-sort]')();
    if (!header) return null;
    const sort = await header.getAttribute('aria-sort');
    return {
      column: (await header.text()).trim(),
      direction: sort === 'descending' ? 'desc' : 'asc',
    };
  }

  /**
   * Clicks the header of a column, as the user does. Without `direction` it clicks once (the next
   * direction); with a direction, or `null` for unsorted, it clicks until the column gets there.
   */
  async sortBy(column: string, direction?: 'asc' | 'desc' | null): Promise<void> {
    const index = (await this.getSortableColumns()).indexOf(column);
    if (index < 0) throw Error(`The table has no sortable column "${column}".`);
    const button = (await this.locatorForAll('.ui-sort-header__button')())[index];
    if (await button.getProperty<boolean>('disabled')) {
      throw Error(`Sorting by "${column}" is disabled.`);
    }
    if (direction === undefined) return button.click();
    const current = async () => {
      const sort = await this.getSort();
      return sort?.column === column ? sort.direction : null;
    };
    // A header cycles through at most three states.
    for (let clicks = 0; clicks < 3; clicks++) {
      if ((await current()) === direction) return;
      await button.click();
    }
    if ((await current()) !== direction) {
      throw Error(`The column "${column}" cannot be sorted ${direction ?? 'off'}.`);
    }
  }
}

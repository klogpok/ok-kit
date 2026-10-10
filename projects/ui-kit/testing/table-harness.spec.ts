import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { UiButton } from '@vplans/ui-kit/button';
import {
  UiExpandableRow,
  UiRowDetail,
  UiRowToggle,
  UiSort,
  UiSortHeader,
  UiSortState,
  UiTable,
  UiTableMessage,
  UiTableSelectAll,
  UiTableSelectRow,
  UiTableSelection,
  UiTableViewport,
  uiSortData,
} from '@vplans/ui-kit/table';
import { UiButtonHarness } from './button-harness';
import { UiTableHarness } from './table-harness';

interface Plan {
  id: number;
  name: string;
  units: number;
}

const PLANS: Plan[] = [
  { id: 1, name: 'Tower A', units: 40 },
  { id: 2, name: 'Tower B', units: 12 },
  { id: 3, name: 'Villas', units: 8 },
];

@Component({
  imports: [UiButton, UiTable, UiTableMessage],
  template: `
    <table ui-table [loading]="loading()">
      <caption>
        Plans
      </caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col" class="ui-table-numeric">Units</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (plan of plans(); track plan.id) {
          <tr>
            <th scope="row">{{ plan.name }}</th>
            <td class="ui-table-numeric">{{ plan.units }}</td>
            <td><button ui-button type="button">Edit</button></td>
          </tr>
        } @empty {
          <tr ui-table-message>
            No plans yet
          </tr>
        }
      </tbody>
    </table>
    <table ui-table aria-label="Empty">
      <thead>
        <tr>
          <th scope="col">Name</th>
        </tr>
      </thead>
      <tbody>
        <tr ui-table-message>
          No plans yet
        </tr>
      </tbody>
    </table>
  `,
})
class Host {
  readonly plans = signal(PLANS);
  readonly loading = signal(false);
}

describe('UiTableHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds tables by label and reads their state', async () => {
    expect(await loader.getAllHarnesses(UiTableHarness)).toHaveLength(2);
    const plans = await loader.getHarness(UiTableHarness.with({ label: 'Plans' }));
    expect(await plans.isLoading()).toBe(false);
    expect(await plans.getMessage()).toBeNull();
    host.loading.set(true);
    expect(await plans.isLoading()).toBe(true);
    const empty = await loader.getHarness(UiTableHarness.with({ label: 'Empty' }));
    expect(await empty.getMessage()).toBe('No plans yet');
    expect(await empty.getRows()).toHaveLength(0);
  });

  it('reads the columns, a column and the rows by column', async () => {
    const table = await loader.getHarness(UiTableHarness.with({ label: 'Plans' }));
    expect(await table.getColumnNames()).toEqual(['Name', 'Units', 'Actions']);
    expect(await table.getColumnTexts('Units')).toEqual(['40', '12', '8']);
    const rows = await table.getRows();
    expect(rows).toHaveLength(3);
    expect(await rows[1].getCellTexts()).toEqual(['Tower B', '12', 'Edit']);
    expect(await rows[1].getCellTextByColumn()).toEqual({
      Name: 'Tower B',
      Units: '12',
      Actions: 'Edit',
    });
    expect(await rows[2].getCellText('Units')).toBe('8');
    expect(await rows[2].getCellText(0)).toBe('Villas');
    await expect(rows[2].getCellText('Owner')).rejects.toThrow(/Owner/);
  });

  it('finds rows by the text of their cells and harnesses inside a cell', async () => {
    const table = await loader.getHarness(UiTableHarness.with({ label: 'Plans' }));
    const row = await table.getRow({ cells: { Name: 'Villas' } });
    expect(await row.getCellText('Units')).toBe('8');
    expect(await table.getRows({ cells: { Name: /^Tower/ } })).toHaveLength(2);
    expect(await table.getRows({ cells: { Name: 'Tower A', Units: '12' } })).toHaveLength(0);
    const cell = await row.getCell('Actions');
    expect(await cell.getText()).toBe('Edit');
    expect(await (await cell.getHarness(UiButtonHarness)).getText()).toBe('Edit');
    expect(await row.getCells({ text: 'Villas' })).toHaveLength(1);
  });
});

@Component({
  imports: [UiTable, UiSort, UiSortHeader],
  template: `
    <table ui-table aria-label="Plans" uiSort [(sort)]="sort" [clearable]="clearable()">
      <thead>
        <tr>
          <th scope="col" ui-sort-header="name">Name</th>
          <th scope="col" ui-sort-header="units" [disabled]="unitsLocked()">Units</th>
          <th scope="col">Owner</th>
        </tr>
      </thead>
      <tbody>
        @for (plan of rows(); track plan.id) {
          <tr>
            <td>{{ plan.name }}</td>
            <td>{{ plan.units }}</td>
            <td>Dana</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class SortHost {
  readonly sort = signal<UiSortState | null>(null);
  readonly clearable = signal(true);
  readonly unitsLocked = signal(false);
  readonly rows = computed(() => uiSortData(PLANS, this.sort()));
}

describe('UiTableHarness sorting', () => {
  let loader: HarnessLoader;
  let host: SortHost;

  beforeEach(() => {
    const fixture = TestBed.createComponent(SortHost);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('reads the sortable columns and the sort state', async () => {
    const table = await loader.getHarness(UiTableHarness);
    expect(await table.getSortableColumns()).toEqual(['Name', 'Units']);
    expect(await table.getSort()).toBeNull();
    host.sort.set({ active: 'units', direction: 'desc' });
    expect(await table.getSort()).toEqual({ column: 'Units', direction: 'desc' });
  });

  it('sorts by a column, in the given direction or to the next one', async () => {
    const table = await loader.getHarness(UiTableHarness);
    await table.sortBy('Units');
    expect(host.sort()).toEqual({ active: 'units', direction: 'asc' });
    expect(await table.getColumnTexts('Units')).toEqual(['8', '12', '40']);
    await table.sortBy('Units', 'desc');
    expect(await table.getColumnTexts('Units')).toEqual(['40', '12', '8']);
    await table.sortBy('Units', 'desc');
    expect(host.sort()).toEqual({ active: 'units', direction: 'desc' });
    await table.sortBy('Units', null);
    expect(await table.getSort()).toBeNull();
    await table.sortBy('Name', 'desc');
    expect(await table.getSort()).toEqual({ column: 'Name', direction: 'desc' });
  });

  it('refuses a column that cannot be sorted or a direction it cannot reach', async () => {
    const table = await loader.getHarness(UiTableHarness);
    await expect(table.sortBy('Owner')).rejects.toThrow(/Owner/);
    host.unitsLocked.set(true);
    await expect(table.sortBy('Units')).rejects.toThrow(/Units/);
    host.clearable.set(false);
    await table.sortBy('Name');
    await expect(table.sortBy('Name', null)).rejects.toThrow(/Name/);
  });
});

@Component({
  imports: [UiTable, UiTableSelection, UiTableSelectAll, UiTableSelectRow],
  template: `
    <table ui-table aria-label="Plans" [(uiTableSelection)]="selected">
      <thead>
        <tr>
          <th ui-table-select-all></th>
          <th scope="col">Name</th>
        </tr>
      </thead>
      <tbody>
        @for (plan of plans; track plan.id) {
          <tr>
            <td [ui-table-select-row]="plan" [disabled]="plan.id === 3"></td>
            <td>{{ plan.name }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class SelectionHost {
  readonly plans = [...PLANS, { id: 4, name: 'Park', units: 2 }];
  readonly selected = signal<readonly Plan[]>([]);
}

describe('UiTableHarness selection', () => {
  let loader: HarnessLoader;
  let host: SelectionHost;
  const names = () => host.selected().map((plan) => plan.name);

  beforeEach(() => {
    const fixture = TestBed.createComponent(SelectionHost);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('selects and deselects rows and reads their state', async () => {
    const table = await loader.getHarness(UiTableHarness);
    const row = await table.getRow({ cells: { Name: 'Tower B' } });
    expect(await row.isSelected()).toBe(false);
    await row.select();
    await row.select();
    expect(names()).toEqual(['Tower B']);
    expect(await row.isSelected()).toBe(true);
    expect(await table.getRows({ selected: true })).toHaveLength(1);
    await row.deselect();
    expect(names()).toEqual([]);
    const locked = await table.getRow({ cells: { Name: 'Villas' } });
    expect(await locked.isSelectionDisabled()).toBe(true);
    await expect(locked.select()).rejects.toThrow(/disabled/);
  });

  it('toggles rows one by one', async () => {
    const table = await loader.getHarness(UiTableHarness);
    const [first, , , last] = await table.getRows();
    await first.toggleSelection();
    await last.toggleSelection();
    expect(names()).toEqual(['Tower A', 'Park']);
    await first.toggleSelection();
    expect(names()).toEqual(['Park']);
  });

  it('selects all rows on screen and reads the header checkbox', async () => {
    const table = await loader.getHarness(UiTableHarness);
    expect(await table.getSelectAllState()).toBe('unchecked');
    await (await table.getRow({ cells: { Name: 'Park' } })).select();
    expect(await table.getSelectAllState()).toBe('partial');
    await table.selectAll();
    expect(await table.getSelectAllState()).toBe('checked');
    expect(names()).toEqual(['Park', 'Tower A', 'Tower B']);
    await table.deselectAll();
    expect(names()).toEqual([]);
    await (await table.getRow({ cells: { Name: 'Park' } })).select();
    await table.deselectAll();
    expect(await table.getSelectAllState()).toBe('unchecked');
  });
});

@Component({
  imports: [UiButton, UiTable, UiExpandableRow, UiRowToggle, UiRowDetail],
  template: `
    <table ui-table aria-label="Plans">
      <thead>
        <tr>
          <th scope="col"><span class="ui-visually-hidden">Details</span></th>
          <th scope="col">Name</th>
        </tr>
      </thead>
      <tbody>
        @for (plan of plans; track plan.id) {
          @if (plan.id === 3) {
            <tr>
              <td></td>
              <td>{{ plan.name }}</td>
            </tr>
          } @else {
            <tr uiExpandableRow #row="uiExpandableRow">
              <td ui-row-toggle></td>
              <td>{{ plan.name }}</td>
            </tr>
            <tr [ui-row-detail]="row">
              {{
                plan.units
              }}
              units
              <button ui-button type="button">Open {{ plan.name }}</button>
            </tr>
          }
        }
      </tbody>
    </table>
  `,
})
class ExpansionHost {
  readonly plans = PLANS;
}

describe('UiTableHarness expansion', () => {
  let loader: HarnessLoader;

  beforeEach(() => {
    loader = TestbedHarnessEnvironment.loader(TestBed.createComponent(ExpansionHost));
  });

  it('expands and collapses a row and reads its detail', async () => {
    const table = await loader.getHarness(UiTableHarness);
    // Detail rows are not data rows.
    expect(await table.getColumnTexts('Name')).toEqual(['Tower A', 'Tower B', 'Villas']);
    const row = await table.getRow({ cells: { Name: 'Tower B' } });
    expect(await row.isExpandable()).toBe(true);
    expect(await row.isExpanded()).toBe(false);
    expect(await row.getDetailText()).toBeNull();
    await row.expand();
    await row.expand();
    expect(await row.isExpanded()).toBe(true);
    expect(await table.getRows({ expanded: true })).toHaveLength(1);
    expect(await row.getDetailText()).toBe('12 units Open Tower B');
    const detail = await row.getDetailLoader();
    expect(await (await detail.getHarness(UiButtonHarness)).getText()).toBe('Open Tower B');
    await row.collapse();
    expect(await row.isExpanded()).toBe(false);
    expect(await row.getDetailText()).toBeNull();
  });

  it('counts the rows of a table without a virtual viewport', async () => {
    expect(await (await loader.getHarness(UiTableHarness)).getTotalRowCount()).toBe(3);
  });

  it('reports a row without a detail', async () => {
    const table = await loader.getHarness(UiTableHarness);
    const row = await table.getRow({ cells: { Name: 'Villas' } });
    expect(await row.isExpandable()).toBe(false);
    expect(await row.isExpanded()).toBe(false);
    await expect(row.expand()).rejects.toThrow(/expand/);
  });
});

@Component({
  imports: [
    UiTable,
    UiTableViewport,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
  ],
  template: `
    <cdk-virtual-scroll-viewport uiTableViewport itemSize="40" style="block-size: 400px">
      <table ui-table aria-label="Units">
        <thead>
          <tr>
            <th scope="col">Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr *cdkVirtualFor="let unit of units">
            <td>{{ unit }}</td>
          </tr>
        </tbody>
      </table>
    </cdk-virtual-scroll-viewport>
  `,
})
class VirtualHost {
  readonly units = Array.from({ length: 1000 }, (_, i) => `Unit ${i + 1}`);
}

describe('UiTableHarness in a virtual scroll viewport', () => {
  it('finds the rendered rows and counts every row', async () => {
    const fixture = TestBed.createComponent(VirtualHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    // The viewport renders its window in an animation frame.
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const table = await loader.getHarness(UiTableHarness.with({ label: 'Units' }));
    const rows = await table.getRows();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(100);
    expect(await rows[0].getCellText('Unit')).toBe('Unit 1');
    expect(await table.getTotalRowCount()).toBe(1000);
    root.remove();
  });
});

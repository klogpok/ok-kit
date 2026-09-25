import { Component, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSort, UiSortHeader, UiSortState, uiSortData } from './sort';
import { UiTable, UiTableDensity, UiTableMessage, UiTableSkeleton } from './table';

interface Plan {
  id: number;
  name: string;
  units: number | null;
}

const PLANS: Plan[] = [
  { id: 1, name: 'Plan 10', units: 4 },
  { id: 2, name: 'plan 2', units: null },
  { id: 3, name: 'Plan 1', units: 12 },
];

describe('uiSortData', () => {
  const names = (rows: Plan[]) => rows.map((p) => p.id);

  it('returns a copy in the original order without a sort', () => {
    const result = uiSortData(PLANS, null);
    expect(result).toEqual(PLANS);
    expect(result).not.toBe(PLANS);
  });

  it('sorts text numerically and case-insensitively', () => {
    expect(names(uiSortData(PLANS, { active: 'name', direction: 'asc' }))).toEqual([3, 2, 1]);
    expect(names(uiSortData(PLANS, { active: 'name', direction: 'desc' }))).toEqual([1, 2, 3]);
  });

  it('sorts numbers by value and keeps empty values last in both directions', () => {
    expect(names(uiSortData(PLANS, { active: 'units', direction: 'asc' }))).toEqual([1, 3, 2]);
    expect(names(uiSortData(PLANS, { active: 'units', direction: 'desc' }))).toEqual([3, 1, 2]);
  });

  it('sorts dates and supports a custom accessor', () => {
    const rows = [{ at: new Date(2026, 5, 1) }, { at: new Date(2025, 0, 1) }];
    expect(uiSortData(rows, { active: 'at', direction: 'asc' })[0]).toBe(rows[1]);
    const byLength = uiSortData(PLANS, { active: 'len', direction: 'asc' }, (p) => p.name.length);
    expect(byLength[0].id).toBe(2);
  });
});

@Component({
  imports: [UiTable, UiSort, UiSortHeader, UiTableMessage, UiTableSkeleton],
  template: `
    <table
      ui-table
      uiSort
      [(sort)]="sort"
      [clearable]="clearable()"
      [loading]="loading()"
      [density]="density()"
      stickyHeader
    >
      <thead>
        <tr>
          <th scope="col" ui-sort-header="name">Name</th>
          <th scope="col" ui-sort-header="units" class="ui-table-numeric">Units</th>
          <th scope="col">Owner</th>
          @if (showStatus()) {
            <th scope="col">Status</th>
          }
        </tr>
      </thead>
      <tbody>
        @if (loading()) {
          <tr ui-table-skeleton></tr>
          <tr ui-table-skeleton columns="2"></tr>
        } @else {
          @for (plan of rows(); track plan.id) {
            <tr>
              <td>{{ plan.name }}</td>
              <td class="ui-table-numeric">{{ plan.units }}</td>
              <td>Dana</td>
            </tr>
          } @empty {
            <tr ui-table-message>
              No plans yet
            </tr>
          }
        }
      </tbody>
    </table>
  `,
})
class Host {
  readonly data = signal(PLANS);
  readonly sort = signal<UiSortState | null>(null);
  readonly clearable = signal(true);
  readonly loading = signal(false);
  readonly density = signal<UiTableDensity>('default');
  readonly showStatus = signal(false);
  readonly rows = computed(() => uiSortData(this.data(), this.sort()));
}

describe('UiTable', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const table = () => fixture.nativeElement.querySelector('table') as HTMLTableElement;
  const header = (i: number) => table().tHead!.rows[0].cells[i];
  const sortButton = (i: number) => header(i).querySelector('button')!;
  const firstColumn = () => [...table().tBodies[0].rows].map((r) => r.cells[0].textContent!.trim());
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('styles the native table with density and sticky header', async () => {
    expect([...table().classList]).toEqual(
      expect.arrayContaining(['ui-table', 'ui-table--default', 'ui-table--sticky-header']),
    );
    host.density.set('compact');
    await settle();
    expect(table().classList).toContain('ui-table--compact');
    expect(table().classList).not.toContain('ui-table--default');
  });

  it('puts the header text in a button and marks only the sorted column with aria-sort', async () => {
    expect(sortButton(0).textContent).toContain('Name');
    expect(sortButton(0).type).toBe('button');
    expect(header(2).querySelector('button')).toBeNull();
    expect(header(0).hasAttribute('aria-sort')).toBe(false);

    sortButton(0).click();
    await settle();
    expect(host.sort()).toEqual({ active: 'name', direction: 'asc' });
    expect(header(0).getAttribute('aria-sort')).toBe('ascending');
    expect(header(1).hasAttribute('aria-sort')).toBe(false);
    expect(firstColumn()).toEqual(['Plan 1', 'plan 2', 'Plan 10']);
  });

  it('cycles ascending, descending and unsorted', async () => {
    sortButton(1).click();
    await settle();
    sortButton(1).click();
    await settle();
    expect(host.sort()).toEqual({ active: 'units', direction: 'desc' });
    expect(header(1).getAttribute('aria-sort')).toBe('descending');
    expect(header(1).classList).toContain('ui-sort-header--active');

    sortButton(1).click();
    await settle();
    expect(host.sort()).toBeNull();
    expect(header(1).hasAttribute('aria-sort')).toBe(false);
  });

  it('toggles between the two directions when not clearable', async () => {
    host.clearable.set(false);
    host.sort.set({ active: 'name', direction: 'desc' });
    await settle();
    sortButton(0).click();
    await settle();
    expect(host.sort()).toEqual({ active: 'name', direction: 'asc' });
  });

  it('switches to another column in ascending order', async () => {
    host.sort.set({ active: 'name', direction: 'desc' });
    await settle();
    sortButton(1).click();
    await settle();
    expect(host.sort()).toEqual({ active: 'units', direction: 'asc' });
  });

  it('shows a message row spanning every column when empty', async () => {
    host.data.set([]);
    await settle();
    const cell = table().querySelector('tr.ui-table-message > td')!;
    expect(cell.textContent!.trim()).toBe('No plans yet');
    expect(cell.getAttribute('colspan')).toBe('3');
  });

  it('follows header cells added later', async () => {
    host.data.set([]);
    await settle();
    host.showStatus.set(true);
    await settle();
    await settle();
    const cell = table().querySelector('tr.ui-table-message > td')!;
    expect(cell.getAttribute('colspan')).toBe('4');
  });

  it('marks the table busy and renders hidden skeleton rows while loading', async () => {
    host.loading.set(true);
    await settle();
    expect(table().getAttribute('aria-busy')).toBe('true');
    const [auto, fixed] = [...table().querySelectorAll('tr.ui-table-skeleton')];
    expect(auto.getAttribute('aria-hidden')).toBe('true');
    expect(auto.querySelectorAll('td ui-skeleton')).toHaveLength(3);
    expect(fixed.querySelectorAll('td')).toHaveLength(2);

    host.loading.set(false);
    await settle();
    expect(table().hasAttribute('aria-busy')).toBe(false);
  });
});

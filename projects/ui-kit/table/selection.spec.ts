import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTableSelectAll, UiTableSelectRow, UiTableSelection } from './selection';
import { UiTable } from './table';

interface Plan {
  id: number;
  name: string;
}

const plans = (...ids: number[]): Plan[] => ids.map((id) => ({ id, name: `Plan ${id}` }));

@Component({
  imports: [UiTable, UiTableSelection, UiTableSelectAll, UiTableSelectRow],
  template: `
    <table
      ui-table
      [(uiTableSelection)]="selected"
      [selectionCompareWith]="byId"
      [selectionDisabled]="disabled()"
    >
      <thead>
        <tr>
          <th ui-table-select-all></th>
          <th scope="col">Name</th>
        </tr>
      </thead>
      <tbody>
        @for (plan of rows(); track plan.id) {
          <tr>
            <td
              [ui-table-select-row]="plan"
              [disabled]="plan.id === lockedId()"
              [label]="labelled() ? 'Select ' + plan.name : ''"
            ></td>
            <td>{{ plan.name }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class Host {
  readonly rows = signal(plans(1, 2, 3, 4, 5));
  readonly selected = signal<readonly Plan[]>([]);
  readonly disabled = signal(false);
  readonly lockedId = signal<number | null>(null);
  readonly labelled = signal(false);
  readonly byId = (row: Plan, selected: Plan) => row.id === selected.id;
}

describe('UiTableSelection', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const all = () => root().querySelector<HTMLInputElement>('th input[type=checkbox]')!;
  const rowBox = (i: number) =>
    root().querySelectorAll<HTMLInputElement>('tbody input[type=checkbox]')[i];
  const tr = (i: number) => root().querySelectorAll('tbody tr')[i];
  const ids = () => host.selected().map((plan) => plan.id);
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const shiftClick = async (i: number) => {
    rowBox(i).dispatchEvent(new MouseEvent('pointerdown', { shiftKey: true, bubbles: true }));
    rowBox(i).click();
    await settle();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('renders labelled checkboxes and marks nothing selected', () => {
    expect(all().getAttribute('aria-label')).toBe('בחירת הכול');
    expect(all().checked).toBe(false);
    expect(rowBox(0).getAttribute('aria-label')).toBe('בחירת שורה');
    expect(tr(0).getAttribute('aria-selected')).toBe('false');
    expect(root().querySelector('th')!.getAttribute('scope')).toBe('col');
  });

  it('takes a custom checkbox label', async () => {
    host.labelled.set(true);
    await settle();
    expect(rowBox(1).getAttribute('aria-label')).toBe('Select Plan 2');
  });

  it('toggles a row and marks it selected', async () => {
    rowBox(1).click();
    await settle();
    expect(ids()).toEqual([2]);
    expect(tr(1).getAttribute('aria-selected')).toBe('true');
    expect(tr(1).classList).toContain('ui-table-row--selected');
    expect(all().indeterminate).toBe(true);

    rowBox(1).click();
    await settle();
    expect(ids()).toEqual([]);
    expect(tr(1).classList).not.toContain('ui-table-row--selected');
  });

  it('selects and deselects all rows from the header', async () => {
    rowBox(0).click();
    await settle();
    all().click();
    await settle();
    expect(ids()).toEqual([1, 2, 3, 4, 5]);
    expect(all().checked).toBe(true);
    expect(all().indeterminate).toBe(false);

    all().click();
    await settle();
    expect(ids()).toEqual([]);
  });

  it('selects a range with Shift', async () => {
    rowBox(1).click();
    await settle();
    await shiftClick(3);
    expect(ids()).toEqual([2, 3, 4]);

    // The range takes the new state of the clicked row and starts at the last toggled row.
    await shiftClick(2);
    expect(ids()).toEqual([2]);
    await shiftClick(0);
    expect(ids()).toEqual([2, 1, 3]);
  });

  it('toggles one row with Shift when there is no previous row', async () => {
    await shiftClick(2);
    expect(ids()).toEqual([3]);
  });

  it('keeps rows that are not on screen and compares rows by id', async () => {
    host.selected.set(plans(9));
    host.rows.set(plans(1, 2));
    await settle();
    all().click();
    await settle();
    expect(ids()).toEqual([9, 1, 2]);

    // New objects for the same rows after a reload.
    host.rows.set(plans(1, 2));
    await settle();
    expect(all().checked).toBe(true);
    all().click();
    await settle();
    expect(ids()).toEqual([9]);
  });

  it('skips disabled rows and disables the header without rows', async () => {
    host.lockedId.set(3);
    await settle();
    expect(rowBox(2).disabled).toBe(true);
    all().click();
    await settle();
    expect(ids()).toEqual([1, 2, 4, 5]);
    expect(all().checked).toBe(true);

    host.rows.set([]);
    await settle();
    expect(all().disabled).toBe(true);
  });

  it('disables every checkbox with selectionDisabled', async () => {
    host.disabled.set(true);
    await settle();
    expect(all().disabled).toBe(true);
    expect(rowBox(0).disabled).toBe(true);
  });

  it('offers select, deselect and clear', () => {
    const selection = fixture.debugElement
      .query((el) => el.name === 'table')
      .injector.get<UiTableSelection<Plan>>(UiTableSelection);
    const [first, second] = host.rows();
    selection.select(first, second, first);
    expect(ids()).toEqual([1, 2]);
    selection.deselect(first);
    expect(ids()).toEqual([2]);
    selection.clear();
    expect(ids()).toEqual([]);
  });
});

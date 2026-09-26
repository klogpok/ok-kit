import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiExpandableRow, UiRowDetail, UiRowToggle } from './expandable-row';
import { UiTable } from './table';

@Component({
  imports: [UiTable, UiExpandableRow, UiRowToggle, UiRowDetail],
  template: `
    <table ui-table>
      <thead>
        <tr>
          <th scope="col"><span class="ui-visually-hidden">Details</span></th>
          <th scope="col">Name</th>
          <th scope="col">Units</th>
        </tr>
      </thead>
      <tbody>
        @for (plan of plans; track plan) {
          <tr uiExpandableRow #row="uiExpandableRow" [(expanded)]="expanded[$index]">
            <td ui-row-toggle [label]="plan === 'B' ? 'Details of B' : ''"></td>
            <td>{{ plan }}</td>
            <td>4</td>
          </tr>
          @if (withDetail()) {
            <tr [ui-row-detail]="row">
              Detail of
              {{
                plan
              }}
            </tr>
          }
        }
      </tbody>
    </table>
  `,
})
class Host {
  readonly plans = ['A', 'B'];
  readonly expanded = [false, true];
  readonly withDetail = signal(true);
}

describe('UiExpandableRow', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const button = (i: number) =>
    root().querySelectorAll<HTMLButtonElement>('.ui-row-toggle button')[i];
  const detail = (i: number) => root().querySelectorAll<HTMLElement>('tr.ui-row-detail')[i];
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

  it('links the toggle to a detail row that spans every column', () => {
    expect(button(0).getAttribute('aria-label')).toBe('פרטים');
    expect(button(1).getAttribute('aria-label')).toBe('Details of B');
    expect(button(0).getAttribute('aria-controls')).toBe(detail(0).id);
    expect(detail(0).querySelector('td')!.getAttribute('colspan')).toBe('3');
  });

  it('shows the detail row of an expanded row only', () => {
    expect(button(0).getAttribute('aria-expanded')).toBe('false');
    expect(detail(0).hidden).toBe(true);
    expect(button(1).getAttribute('aria-expanded')).toBe('true');
    expect(detail(1).hidden).toBe(false);
    expect(detail(1).previousElementSibling!.classList).toContain('ui-expandable-row--expanded');
  });

  it('toggles the row and updates the two-way binding', async () => {
    button(0).click();
    await settle();
    expect(host.expanded[0]).toBe(true);
    expect(detail(0).hidden).toBe(false);
    expect(button(0).getAttribute('aria-expanded')).toBe('true');

    button(0).click();
    await settle();
    expect(host.expanded[0]).toBe(false);
    expect(detail(0).hidden).toBe(true);
  });

  it('drops aria-controls when the detail row is not rendered', async () => {
    host.withDetail.set(false);
    await settle();
    expect(button(0).hasAttribute('aria-controls')).toBe(false);
    expect(button(0).getAttribute('aria-expanded')).toBe('false');
  });

  it('offers expand, collapse and toggle', () => {
    const row = fixture.debugElement
      .query((el) => el.name === 'tr' && el.classes['ui-expandable-row'])
      .injector.get(UiExpandableRow);
    row.expand();
    expect(row.expanded()).toBe(true);
    row.collapse();
    expect(row.expanded()).toBe(false);
    row.toggle();
    expect(row.expanded()).toBe(true);
  });
});

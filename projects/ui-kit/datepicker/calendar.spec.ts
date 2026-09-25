import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiCalendar } from './calendar';
import { UiDateFilter } from './date-utils';

@Component({
  imports: [UiCalendar],
  template: `
    <div [attr.dir]="dir()">
      <ui-calendar
        [(selected)]="selected"
        [min]="min()"
        [max]="max()"
        [dateFilter]="filter()"
        (dateSelected)="picked.push($event)"
      />
    </div>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly selected = signal<Date | null>(new Date(2026, 8, 16));
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly filter = signal<UiDateFilter | null>(null);
  readonly picked: Date[] = [];
}

describe('UiCalendar', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () => fixture.nativeElement as HTMLElement;
  const title = () => root().querySelector('.ui-calendar__title')!.textContent!.trim();
  const cell = (key: string) => root().querySelector<HTMLElement>(`td[data-date="${key}"]`)!;
  const focused = () => (document.activeElement as HTMLElement | null)?.dataset['date'];
  const button = (label: string) =>
    root().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const key = async (key: string, init: KeyboardEventInit = {}) => {
    const target = document.activeElement as HTMLElement;
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
    );
    await settle();
  };

  const create = async (providers: unknown[] = [provideUiLabels(UI_LABELS_EN)]) => {
    TestBed.configureTestingModule({ providers: providers as never[] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    document.body.appendChild(root());
    await settle();
  };

  afterEach(() => root().remove());

  it('renders the month as a labelled grid with weekday headers from the locale', async () => {
    await create();
    const grid = root().querySelector('table')!;
    expect(grid.getAttribute('role')).toBe('grid');
    expect(title()).toBe('September 2026');
    expect(document.getElementById(grid.getAttribute('aria-labelledby')!)!.textContent).toContain(
      'September 2026',
    );
    const headers = [...grid.querySelectorAll('th')];
    expect(headers.map((th) => th.getAttribute('abbr'))[0]).toBe('Sunday');
    expect(headers.map((th) => th.textContent!.trim())).toEqual([
      'S',
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
    ]);
    // September 1, 2026 is a Tuesday: two blank cells first.
    expect(grid.querySelectorAll('tbody tr:first-child .ui-calendar__blank')).toHaveLength(2);
  });

  it('starts the week on Monday for locales that do', async () => {
    await create([provideUiLabels({ ...UI_LABELS_EN, locale: 'en-GB' })]);
    expect(root().querySelector('th')!.getAttribute('abbr')).toBe('Monday');
  });

  it('defaults to Hebrew names', async () => {
    await create([]);
    expect(title()).toBe('ספטמבר 2026');
    expect(root().querySelector('th')!.getAttribute('abbr')).toBe('יום ראשון');
  });

  it('marks the selected day, today and the roving tab stop', async () => {
    await create();
    const selected = cell('2026-09-16');
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(selected.getAttribute('tabindex')).toBe('0');
    expect(selected.getAttribute('aria-label')).toBe('Wednesday, September 16, 2026');
    expect(root().querySelectorAll('td[tabindex="0"]')).toHaveLength(1);

    host.selected.set(null);
    await settle();
    const today = root().querySelector('td[aria-current="date"]')!;
    expect(today).not.toBeNull();
    expect(today.getAttribute('tabindex')).toBe('0');
  });

  it('picks a day on click and emits dateSelected', async () => {
    await create();
    cell('2026-09-22').click();
    await settle();
    expect(host.selected()).toEqual(new Date(2026, 8, 22));
    cell('2026-09-22').click();
    expect(host.picked).toHaveLength(2);
  });

  it('blocks days outside min/max and rejected by the filter', async () => {
    await create();
    host.min.set(new Date(2026, 8, 10));
    host.max.set(new Date(2026, 8, 25));
    host.filter.set((d) => d.getDay() !== 5 && d.getDay() !== 6);
    await settle();
    for (const day of ['2026-09-09', '2026-09-26', '2026-09-18']) {
      expect(cell(day).getAttribute('aria-disabled')).toBe('true');
      cell(day).click();
    }
    await settle();
    expect(host.picked).toHaveLength(0);
    for (const label of ['Previous month', 'Next month', 'Previous year']) {
      expect(button(label).getAttribute('aria-disabled')).toBe('true');
    }
  });

  it('moves by day and week with the arrows and picks with Enter', async () => {
    await create();
    cell('2026-09-16').focus();
    await key('ArrowRight');
    expect(focused()).toBe('2026-09-17');
    await key('ArrowDown');
    expect(focused()).toBe('2026-09-24');
    await key('ArrowLeft');
    await key('ArrowUp');
    expect(focused()).toBe('2026-09-16');
    await key('ArrowDown');
    await key('ArrowDown');
    expect(focused()).toBe('2026-09-30');
    await key('ArrowRight');
    expect(focused()).toBe('2026-10-01');
    expect(title()).toBe('October 2026');

    await key('Enter');
    expect(host.selected()).toEqual(new Date(2026, 9, 1));
  });

  it('mirrors Left and Right in RTL', async () => {
    await create();
    host.dir.set('rtl');
    await settle();
    cell('2026-09-16').focus();
    await key('ArrowLeft');
    expect(focused()).toBe('2026-09-17');
    await key('ArrowRight');
    await key('ArrowRight');
    expect(focused()).toBe('2026-09-15');
  });

  it('jumps with Home/End, PageUp/PageDown and Shift for years', async () => {
    await create();
    cell('2026-09-16').focus();
    await key('Home');
    expect(focused()).toBe('2026-09-13');
    await key('End');
    expect(focused()).toBe('2026-09-19');
    await key('PageDown');
    expect(focused()).toBe('2026-10-19');
    await key('PageUp', { shiftKey: true });
    expect(focused()).toBe('2025-10-19');
    await key(' ');
    expect(host.selected()).toEqual(new Date(2025, 9, 19));
  });

  it('keeps the active day inside min and max', async () => {
    await create();
    host.max.set(new Date(2026, 8, 20));
    await settle();
    cell('2026-09-16').focus();
    await key('ArrowDown');
    expect(focused()).toBe('2026-09-20');
  });

  it('changes the month with the header buttons', async () => {
    await create();
    button('Next month').click();
    await settle();
    expect(title()).toBe('October 2026');
    button('Previous year').click();
    await settle();
    expect(title()).toBe('October 2025');
  });

  it('keeps focus on a header button that reaches the min month', async () => {
    await create();
    host.min.set(new Date(2026, 7, 10));
    await settle();
    const previous = button('Previous month');
    previous.focus();
    previous.click();
    await settle();
    expect(title()).toBe('August 2026');
    expect(previous.disabled).toBe(false);
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(previous);

    previous.click();
    await settle();
    expect(title()).toBe('August 2026');
  });
});

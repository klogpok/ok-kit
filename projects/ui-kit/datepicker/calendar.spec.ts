import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiCalendar } from './calendar';
import { UiDateFilter, UiDateRange } from './date-utils';

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
  const title = () => root().querySelector('.ui-calendar__title')!.textContent?.trim();
  const cell = (key: string) => root().querySelector<HTMLElement>(`td[data-date="${key}"]`)!;
  const focused = () => (document.activeElement as HTMLElement | null)?.dataset['date'];
  const focusedPeriod = () => (document.activeElement as HTMLElement | null)?.dataset['period'];
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
    expect(headers.map((th) => th.textContent?.trim())).toEqual([
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
    expect(root().querySelectorAll('td[aria-selected]')).toHaveLength(1);
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

  it('shows the current month for an Invalid Date', async () => {
    await create();
    host.selected.set(new Date('not a date'));
    await settle();
    expect(root().querySelectorAll('td[data-date]').length).toBeGreaterThan(27);
    expect(root().querySelectorAll('td[tabindex="0"]')).toHaveLength(1);
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

  it('switches to the months and years from the title and back to the days', async () => {
    await create();
    const titleButton = () => root().querySelector<HTMLButtonElement>('button.ui-calendar__title');
    expect(titleButton()?.getAttribute('aria-label')).toBe('September 2026, Choose month');
    titleButton()!.click();
    await settle();

    // Month view: 12 months of the year in rows of 4, the selected month focused.
    expect(title()).toBe('2026');
    const months = [...root().querySelectorAll<HTMLElement>('td[data-period]')];
    expect(months).toHaveLength(12);
    expect(root().querySelectorAll('.ui-calendar__periods tr')).toHaveLength(3);
    expect(months[8].getAttribute('aria-selected')).toBe('true');
    expect(months[8].getAttribute('aria-label')).toBe('September 2026');
    expect(document.activeElement).toBe(months[8]);
    expect(button('Previous month')).toBeNull();

    // Year view: a page of 24 years.
    titleButton()!.click();
    await settle();
    expect(root().querySelectorAll('td[data-period]')).toHaveLength(24);
    expect(root().querySelector('.ui-calendar__title--static')?.textContent).toContain(
      '2016 – 2039',
    );
    expect(focusedPeriod()).toBe('2026');

    // Picking a year shows its months, picking a month shows its days.
    root().querySelector<HTMLElement>('td[data-period="2028"]')!.click();
    await settle();
    expect(title()).toBe('2028');
    root().querySelector<HTMLElement>('td[data-period="2028-03"]')!.click();
    await settle();
    expect(title()).toBe('March 2028');
    expect(focused()).toBe('2028-03-16');
    expect(host.picked).toEqual([]);
  });

  it('moves through months and years with the keyboard', async () => {
    await create();
    root().querySelector<HTMLButtonElement>('button.ui-calendar__title')!.click();
    await settle();
    await key('ArrowRight');
    expect(focusedPeriod()).toBe('2026-10');
    await key('ArrowDown');
    expect(focusedPeriod()).toBe('2027-02');
    await key('Home');
    expect(focusedPeriod()).toBe('2027-01');
    await key('End');
    expect(focusedPeriod()).toBe('2027-04');
    await key('PageUp');
    expect(focusedPeriod()).toBe('2026-04');
    await key('Escape');
    expect(title()).toBe('April 2026');
    expect(focused()).toBe('2026-04-16');

    root().querySelector<HTMLButtonElement>('button.ui-calendar__title')!.click();
    await settle();
    root().querySelector<HTMLButtonElement>('button.ui-calendar__title')!.click();
    await settle();
    await key('ArrowUp');
    expect(focusedPeriod()).toBe('2022');
    await key('PageDown');
    expect(focusedPeriod()).toBe('2046');
    await key('Enter');
    expect(title()).toBe('2046');
  });

  it('mirrors the arrows in RTL and disables months outside min and max', async () => {
    await create();
    host.dir.set('rtl');
    host.min.set(new Date(2026, 5, 10));
    await settle();
    root().querySelector<HTMLButtonElement>('button.ui-calendar__title')!.click();
    await settle();
    await key('ArrowLeft');
    expect(focusedPeriod()).toBe('2026-10');
    const may = root().querySelector<HTMLElement>('td[data-period="2026-05"]')!;
    expect(may.getAttribute('aria-disabled')).toBe('true');
    expect(root().querySelector('td[data-period="2026-06"]')?.hasAttribute('aria-disabled')).toBe(
      false,
    );
    may.click();
    await settle();
    expect(title()).toBe('2026');
    expect(button('Previous year').getAttribute('aria-disabled')).toBe('true');
  });
});

@Component({
  imports: [UiCalendar],
  template: `
    <ui-calendar
      range
      [(selectedRange)]="range"
      [months]="months()"
      [min]="min()"
      [max]="max()"
      (rangeSelected)="picked.push($event)"
    />
  `,
})
class RangeHost {
  readonly range = signal<UiDateRange | null>(null);
  readonly months = signal(1);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly picked: UiDateRange[] = [];
}

describe('UiCalendar range', () => {
  let fixture: ComponentFixture<RangeHost>;
  let host: RangeHost;
  const root = () => fixture.nativeElement as HTMLElement;
  const cell = (key: string) => root().querySelector<HTMLElement>(`td[data-date="${key}"]`)!;
  const titles = () =>
    [...root().querySelectorAll('.ui-calendar__title')].map((t) => t.textContent?.trim());
  const keys = (selector: string) =>
    [...root().querySelectorAll<HTMLElement>(selector)].map((td) => td.dataset['date']);
  const focused = () => (document.activeElement as HTMLElement | null)?.dataset['date'];
  const button = (label: string) =>
    root().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const key = async (key: string) => {
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );
    await settle();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    fixture = TestBed.createComponent(RangeHost);
    host = fixture.componentInstance;
    host.range.set({ start: new Date(2026, 8, 10), end: null });
    document.body.appendChild(root());
    await settle();
  });

  afterEach(() => root().remove());

  it('picks the start and then the end', async () => {
    cell('2026-09-14').click();
    await settle();
    expect(host.range()).toEqual({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 14) });
    expect(host.picked.at(-1)).toEqual(host.range());

    // A third pick starts a new range.
    cell('2026-09-20').click();
    await settle();
    expect(host.range()).toEqual({ start: new Date(2026, 8, 20), end: null });
  });

  it('starts again when the second day is before the start', async () => {
    cell('2026-09-03').click();
    await settle();
    expect(host.range()).toEqual({ start: new Date(2026, 8, 3), end: null });
  });

  it('marks the range and names its ends', async () => {
    host.range.set({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 13) });
    await settle();
    expect(keys('.ui-calendar__day--in-range')).toEqual(['2026-09-11', '2026-09-12']);
    expect(keys('.ui-calendar__day--selected')).toEqual(['2026-09-10', '2026-09-13']);
    expect(keys('[aria-selected="true"]')).toEqual([
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
    expect(cell('2026-09-10').classList).toContain('ui-calendar__day--range-start');
    expect(cell('2026-09-13').classList).toContain('ui-calendar__day--range-end');
    expect(cell('2026-09-10').getAttribute('aria-label')).toBe(
      'Thursday, September 10, 2026, Start date',
    );
    expect(cell('2026-09-13').getAttribute('aria-label')).toBe(
      'Sunday, September 13, 2026, End date',
    );
  });

  it('previews the end under the pointer and on the focused day', async () => {
    cell('2026-09-12').dispatchEvent(new Event('pointerenter'));
    await settle();
    expect(keys('.ui-calendar__day--in-range')).toEqual(['2026-09-11']);
    expect(cell('2026-09-12').classList).toContain('ui-calendar__day--preview');
    // A preview is not a selection.
    expect(keys('[aria-selected="true"]')).toEqual(['2026-09-10']);

    root().querySelector('table')!.dispatchEvent(new Event('pointerleave'));
    cell('2026-09-10').focus();
    await key('ArrowRight');
    await key('ArrowRight');
    expect(focused()).toBe('2026-09-12');
    expect(keys('.ui-calendar__day--in-range')).toEqual(['2026-09-11']);
    await key('Enter');
    expect(host.range()).toEqual({ start: new Date(2026, 8, 10), end: new Date(2026, 8, 12) });
    expect(keys('.ui-calendar__day--preview')).toEqual([]);
  });

  it('does not preview days before the start or days that cannot be picked', async () => {
    cell('2026-09-05').dispatchEvent(new Event('pointerenter'));
    await settle();
    expect(keys('.ui-calendar__day--in-range')).toEqual([]);
    host.max.set(new Date(2026, 8, 20));
    cell('2026-09-24').dispatchEvent(new Event('pointerenter'));
    await settle();
    expect(keys('.ui-calendar__day--in-range')).toEqual([]);
  });

  it('shows several months and moves them together', async () => {
    host.months.set(2);
    await settle();
    expect(titles()).toEqual(['September 2026', 'October 2026']);
    const grids = [...root().querySelectorAll('table')];
    expect(grids).toHaveLength(2);
    expect(document.getElementById(grids[1].getAttribute('aria-labelledby')!)!.textContent).toBe(
      'October 2026',
    );
    expect(root().querySelector('.ui-calendar__live')!.textContent).toBe(
      'September 2026 – October 2026',
    );
    expect(root().querySelectorAll('td[tabindex="0"]')).toHaveLength(1);
    // The previous buttons are on the first month, the next buttons on the last.
    const headers = [...root().querySelectorAll('.ui-calendar__header')];
    expect(headers[0].querySelector('[aria-label="Previous month"]')).not.toBeNull();
    expect(headers[0].querySelector('[aria-label="Next month"]')).toBeNull();
    expect(headers[1].querySelector('[aria-label="Next month"]')).not.toBeNull();

    button('Next month').click();
    await settle();
    expect(titles()).toEqual(['October 2026', 'November 2026']);
    button('Previous year').click();
    await settle();
    expect(titles()).toEqual(['October 2025', 'November 2025']);
  });

  it('moves the focus into the next month without moving the months', async () => {
    host.months.set(2);
    host.range.set({ start: new Date(2026, 8, 30), end: null });
    await settle();
    cell('2026-09-30').focus();
    await key('ArrowRight');
    expect(focused()).toBe('2026-10-01');
    expect(titles()).toEqual(['September 2026', 'October 2026']);
    // A pick in the second month keeps the months and the focus.
    await key('Enter');
    expect(host.range()!.end).toEqual(new Date(2026, 9, 1));
    expect(titles()).toEqual(['September 2026', 'October 2026']);
    expect(focused()).toBe('2026-10-01');

    await key('PageDown');
    expect(focused()).toBe('2026-11-01');
    expect(titles()).toEqual(['October 2026', 'November 2026']);
    await key('PageUp');
    await key('PageUp');
    expect(focused()).toBe('2026-09-01');
    expect(titles()).toEqual(['September 2026', 'October 2026']);
  });

  it('disables moving to months outside the limits', async () => {
    host.months.set(2);
    host.max.set(new Date(2026, 9, 20));
    await settle();
    expect(button('Next month').getAttribute('aria-disabled')).toBe('true');
    host.max.set(new Date(2026, 10, 2));
    await settle();
    expect(button('Next month').getAttribute('aria-disabled')).toBeNull();
  });

  it('widens the month and year grids to the months shown', async () => {
    host.months.set(2);
    await settle();
    const calendar = root().querySelector<HTMLElement>('ui-calendar')!;
    expect(calendar.style.getPropertyValue('--_months')).toBe('2');
    root().querySelector<HTMLButtonElement>('.ui-calendar__title')!.click();
    await settle();
    expect(root().querySelectorAll('table')).toHaveLength(1);
    // Picking a month shows it first.
    root().querySelector<HTMLElement>('td[data-period="2026-12"]')!.click();
    await settle();
    expect(titles()).toEqual(['December 2026', 'January 2027']);
  });
});

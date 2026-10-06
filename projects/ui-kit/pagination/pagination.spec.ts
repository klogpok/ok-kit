import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiPageEvent, UiPageItem, UiPagination, uiPageItems } from './pagination';

const describeItems = (items: UiPageItem[]) =>
  items.map((item) => (item.kind === 'page' ? item.index + 1 : '…')).join(' ');

describe('uiPageItems', () => {
  it('shows every page when they fit', () => {
    expect(describeItems(uiPageItems(1, 0, 1))).toBe('1');
    expect(describeItems(uiPageItems(7, 3, 1))).toBe('1 2 3 4 5 6 7');
  });

  it('keeps a constant number of items and never hides a single page', () => {
    expect(describeItems(uiPageItems(10, 0, 1))).toBe('1 2 3 4 5 … 10');
    expect(describeItems(uiPageItems(10, 3, 1))).toBe('1 2 3 4 5 … 10');
    expect(describeItems(uiPageItems(10, 4, 1))).toBe('1 … 4 5 6 … 10');
    expect(describeItems(uiPageItems(10, 6, 1))).toBe('1 … 6 7 8 9 10');
    expect(describeItems(uiPageItems(10, 9, 1))).toBe('1 … 6 7 8 9 10');
    expect(describeItems(uiPageItems(20, 10, 2))).toBe('1 … 9 10 11 12 13 … 20');
  });
});

@Component({
  imports: [UiPagination],
  template: `
    <ui-pagination
      [length]="length()"
      [(pageIndex)]="pageIndex"
      [(pageSize)]="pageSize"
      [pageSizeOptions]="options()"
      [disabled]="disabled()"
      (page)="events.push($event)"
    />
  `,
})
class Host {
  readonly length = signal(95);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly options = signal<number[]>([10, 25, 50]);
  readonly disabled = signal(false);
  readonly events: UiPageEvent[] = [];
}

describe('UiPagination', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  const root = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('ui-pagination')!;
  const button = (label: string) =>
    root().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const pages = () =>
    [...root().querySelectorAll<HTMLButtonElement>('.ui-pagination__page')].map((b) =>
      b.textContent?.trim(),
    );
  const current = () => root().querySelector<HTMLButtonElement>('[aria-current="page"]');
  const range = () => root().querySelector('.ui-pagination__range')!.textContent?.trim();
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  let announce: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    announce = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        provideUiLabels(UI_LABELS_EN),
        { provide: LiveAnnouncer, useValue: { announce } },
      ],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle();
  });

  it('is a named navigation landmark with the current page marked', () => {
    expect(root().getAttribute('role')).toBe('navigation');
    expect(root().getAttribute('aria-label')).toBe('Pagination');
    expect(pages()).toEqual(['1', '2', '3', '4', '5', '10']);
    expect(current()?.textContent?.trim()).toBe('1');
    expect(current()?.getAttribute('aria-label')).toBe('Page 1');
    expect(root().querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('shows the range', async () => {
    expect(range()).toBe('1–10 of 95');
    host.pageIndex.set(9);
    await settle();
    expect(range()).toBe('91–95 of 95');
    host.length.set(0);
    await settle();
    expect(range()).toBe('0–0 of 0');
    expect(pages()).toEqual(['1']);
  });

  it('announces the range only when the user changes the page', async () => {
    host.length.set(120);
    host.pageIndex.set(2);
    await settle();
    expect(announce).not.toHaveBeenCalled();
    button('Next page').click();
    await settle();
    expect(announce).toHaveBeenCalledWith('31–40 of 120', 'polite');
  });

  it('keeps the range sensible for a page size of 0', async () => {
    host.pageSize.set(0);
    await settle();
    expect(range()).toBe('1–1 of 95');
  });

  it('navigates with the buttons, updates the model and emits page', async () => {
    button('Next page').click();
    await settle();
    expect(host.pageIndex()).toBe(1);
    expect(host.events.at(-1)).toEqual({
      pageIndex: 1,
      previousPageIndex: 0,
      pageSize: 10,
      length: 95,
    });

    button('Page 5').click();
    await settle();
    expect(host.pageIndex()).toBe(4);
    expect(pages()).toEqual(['1', '4', '5', '6', '10']);

    button('Last page').click();
    await settle();
    expect(host.pageIndex()).toBe(9);
    button('Previous page').click();
    await settle();
    expect(host.pageIndex()).toBe(8);
    button('First page').click();
    await settle();
    expect(host.pageIndex()).toBe(0);
    expect(host.events).toHaveLength(5);
  });

  it('disables the edge buttons and moves focus to the current page', async () => {
    expect(button('First page').disabled).toBe(true);
    expect(button('Previous page').disabled).toBe(true);
    expect(button('Next page').disabled).toBe(false);

    button('Last page').focus();
    button('Last page').click();
    await settle();
    expect(button('Last page').disabled).toBe(true);
    expect(button('Next page').disabled).toBe(true);
    expect(document.activeElement).toBe(current());
  });

  it('moves an out of range page index to the last page and reports it', async () => {
    host.pageIndex.set(40);
    await settle();
    expect(current()?.textContent?.trim()).toBe('10');
    expect(host.pageIndex()).toBe(9);
    expect(host.events.at(-1)).toMatchObject({ pageIndex: 9, previousPageIndex: 40 });
  });

  it('follows a shrinking list but keeps the page index while the length is 0', async () => {
    host.pageIndex.set(5);
    await settle();
    host.length.set(0);
    await settle();
    expect(host.pageIndex()).toBe(5);

    host.length.set(12);
    await settle();
    expect(host.pageIndex()).toBe(1);
    expect(current()?.textContent?.trim()).toBe('2');
  });

  it('changes the page size and keeps the first item visible', async () => {
    host.pageIndex.set(5);
    await settle();
    const combobox = root().querySelector('ui-select [role="combobox"]')!;
    expect(combobox.getAttribute('aria-label')).toBe('Items per page');

    const pagination = fixture.debugElement.query((d) => d.name === 'ui-pagination')
      .componentInstance as { changePageSize(size: number): void };
    pagination.changePageSize(25);
    await settle();
    expect(host.pageSize()).toBe(25);
    expect(host.pageIndex()).toBe(2);
    expect(range()).toBe('51–75 of 95');
    expect(host.events.at(-1)).toEqual({
      pageIndex: 2,
      previousPageIndex: 5,
      pageSize: 25,
      length: 95,
    });
  });

  it('hides the page size select without options', async () => {
    host.options.set([]);
    await settle();
    expect(root().querySelector('ui-select')).toBeNull();
  });

  it('disables every control', async () => {
    host.disabled.set(true);
    host.pageIndex.set(3);
    await settle();
    const buttons = [...root().querySelectorAll('button')];
    expect(buttons.every((b) => b.disabled)).toBe(true);
  });
});

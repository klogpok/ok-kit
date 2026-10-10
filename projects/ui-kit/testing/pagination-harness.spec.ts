import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiPagination } from '@vplans/ui-kit/pagination';
import { UiPaginationHarness } from './pagination-harness';

@Component({
  imports: [UiPagination],
  template: `
    <ui-pagination
      [length]="95"
      [(pageIndex)]="page"
      [(pageSize)]="size"
      [pageSizeOptions]="[10, 25, 50]"
    />
    <ui-pagination
      aria-label="Comments pages"
      [length]="30"
      [pageSize]="10"
      [showFirstLast]="false"
      [disabled]="disabled()"
    />
  `,
})
class Host {
  readonly page = signal(0);
  readonly size = signal(10);
  readonly disabled = signal(false);
}

describe('UiPaginationHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds paginators by label and reads the page, the page size and the range', async () => {
    expect(await loader.getAllHarnesses(UiPaginationHarness)).toHaveLength(2);
    const pages = await loader.getHarness(UiPaginationHarness.with({ label: 'Pagination' }));
    expect(await pages.getCurrentPage()).toBe(1);
    expect(await pages.getPageNumbers()).toEqual([1, 2, 3, 4, 5, 10]);
    expect(await pages.getPageSize()).toBe(10);
    expect(await pages.getRangeText()).toBe('1–10 of 95');
    expect(await pages.isPreviousPageDisabled()).toBe(true);
    expect(await pages.isNextPageDisabled()).toBe(false);
    expect(await pages.isDisabled()).toBe(false);

    const comments = await loader.getHarness(UiPaginationHarness.with({ label: 'Comments pages' }));
    expect(await comments.getPageSize()).toBeNull();
    expect(await comments.getPageNumbers()).toEqual([1, 2, 3]);
    host.disabled.set(true);
    expect(await comments.isDisabled()).toBe(true);
    expect(await loader.getAllHarnesses(UiPaginationHarness.with({ disabled: true }))).toHaveLength(
      1,
    );
  });

  it('moves between pages as the user does', async () => {
    const pages = await loader.getHarness(UiPaginationHarness.with({ label: 'Pagination' }));
    await pages.goToNextPage();
    expect(await pages.getCurrentPage()).toBe(2);
    expect(host.page()).toBe(1);
    await pages.goToLastPage();
    expect(await pages.getCurrentPage()).toBe(10);
    expect(await pages.isNextPageDisabled()).toBe(true);
    await pages.goToPreviousPage();
    expect(await pages.getCurrentPage()).toBe(9);
    await pages.goToPage(7);
    expect(await pages.getRangeText()).toBe('61–70 of 95');
    await pages.goToFirstPage();
    expect(await pages.getCurrentPage()).toBe(1);
    await expect(pages.goToPage(8)).rejects.toThrow('Page 8 is not shown');

    const comments = await loader.getHarness(UiPaginationHarness.with({ label: 'Comments pages' }));
    await expect(comments.goToLastPage()).rejects.toThrow('no first and last page buttons');
  });

  it('changes the page size through its select', async () => {
    const pages = await loader.getHarness(UiPaginationHarness.with({ label: 'Pagination' }));
    await pages.goToPage(3);
    await pages.setPageSize(25);
    expect(await pages.getPageSize()).toBe(25);
    expect(host.size()).toBe(25);
    expect(await pages.getCurrentPage()).toBe(1);
    expect(await pages.getRangeText()).toBe('1–25 of 95');

    const comments = await loader.getHarness(UiPaginationHarness.with({ label: 'Comments pages' }));
    await expect(comments.setPageSize(25)).rejects.toThrow('no page size select');
  });
});

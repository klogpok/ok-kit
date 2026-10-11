import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';
import { UiSelectHarness } from './select-harness';

export interface UiPaginationHarnessFilters extends BaseHarnessFilters {
  /** The name of the landmark: its `aria-label`, or the `pagination` label. */
  label?: string | RegExp;
  disabled?: boolean;
}

/**
 * Harness for `ui-pagination`. Pages are 1-based, as the user sees them. The arrow buttons are
 * found by their classes, so the harness works with any labels.
 */
export class UiPaginationHarness extends UiHarness {
  static hostSelector = '.ui-pagination';

  private readonly pageButtons = this.locatorForAll('.ui-pagination__page');
  private readonly sizeSelect = this.locatorForOptional(UiSelectHarness);

  static with<T extends UiPaginationHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiPaginationHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** The current page, 1-based. */
  async getCurrentPage(): Promise<number> {
    const current = await this.locatorFor('.ui-pagination__page[aria-current="page"]')();
    return Number((await current.text()).trim());
  }

  /** The numbers of the page buttons shown, in order; gaps ("…") are skipped. */
  async getPageNumbers(): Promise<number[]> {
    const buttons = await this.pageButtons();
    return Promise.all(buttons.map(async (button) => Number((await button.text()).trim())));
  }

  /** The range summary, e.g. "11–20 of 95". */
  async getRangeText(): Promise<string> {
    return (await (await this.locatorFor('.ui-pagination__range')()).text()).trim();
  }

  /**
   * The value of the page size select, or `null` when there is no select. Without the select the
   * user sees no page size: the range text ("1–10 of 95") is not one on the last page, so read
   * `getRangeText()` instead.
   */
  async getPageSize(): Promise<number | null> {
    const select = await this.sizeSelect();
    return select ? Number(await select.getValueText()) : null;
  }

  /** Chooses a page size in the select. Throws without `pageSizeOptions`. */
  async setPageSize(size: number): Promise<void> {
    const select = await this.sizeSelect();
    if (!select) throw Error('The paginator has no page size select.');
    await select.clickOptions({ text: String(size) });
  }

  /** Clicks the button of a page (1-based). Throws when the page has no button now. */
  async goToPage(page: number): Promise<void> {
    for (const button of await this.pageButtons()) {
      if (Number((await button.text()).trim()) === page) {
        await button.click();
        return;
      }
    }
    throw Error(`Page ${page} is not shown.`);
  }

  async goToPreviousPage(): Promise<void> {
    await (await this.arrow('previous')).click();
  }

  async goToNextPage(): Promise<void> {
    await (await this.arrow('next')).click();
  }

  /** Throws when `showFirstLast` is off. */
  async goToFirstPage(): Promise<void> {
    await (await this.arrow('first')).click();
  }

  /** Throws when `showFirstLast` is off. */
  async goToLastPage(): Promise<void> {
    await (await this.arrow('last')).click();
  }

  /** On the first page, or the paginator is disabled. */
  async isPreviousPageDisabled(): Promise<boolean> {
    return (await this.arrow('previous')).getProperty<boolean>('disabled');
  }

  /** On the last page, or the paginator is disabled. */
  async isNextPageDisabled(): Promise<boolean> {
    return (await this.arrow('next')).getProperty<boolean>('disabled');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('ui-pagination--disabled');
  }

  private async arrow(which: 'first' | 'previous' | 'next' | 'last'): Promise<TestElement> {
    const arrow = await this.locatorForOptional(`.ui-pagination__${which}`)();
    if (!arrow) throw Error('The paginator has no first and last page buttons.');
    return arrow;
  }
}

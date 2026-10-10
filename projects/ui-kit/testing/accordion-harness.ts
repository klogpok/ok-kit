import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiAccordionItemHarnessFilters extends BaseHarnessFilters {
  /** The header text. */
  label?: string | RegExp;
  expanded?: boolean;
  disabled?: boolean;
}

/**
 * Harness for `ui-accordion-item`, inside a `ui-accordion` or alone. `getHarness()` finds
 * harnesses in its panel; lazy content exists once the item has been expanded.
 */
export class UiAccordionItemHarness extends UiHarness {
  static hostSelector = '.ui-accordion-item';

  private readonly trigger = this.locatorFor('.ui-accordion-item__trigger');

  static with<T extends UiAccordionItemHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiAccordionItemHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'expanded',
        options.expanded,
        async (harness, expanded) => (await harness.isExpanded()) === expanded,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  async getLabel(): Promise<string> {
    return (await (await this.locatorFor('.ui-accordion-item__label')()).text()).trim();
  }

  async isExpanded(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await this.trigger()).getProperty<boolean>('disabled');
  }

  /** Clicks the header. A disabled item does not change. */
  async toggle(): Promise<void> {
    await (await this.trigger()).click();
  }

  /** Clicks the header unless the item is expanded. */
  async expand(): Promise<void> {
    if (!(await this.isExpanded())) await this.toggle();
  }

  /** Clicks the header unless the item is collapsed. */
  async collapse(): Promise<void> {
    if (await this.isExpanded()) await this.toggle();
  }

  protected override focusTarget(): Promise<TestElement> {
    return this.trigger();
  }
}

/**
 * Harness for `ui-accordion`. Its items are `UiAccordionItemHarness`; items of an accordion
 * nested in an item are included too.
 */
export class UiAccordionHarness extends UiHarness {
  static hostSelector = '.ui-accordion';

  static with<T extends UiAccordionHarness>(
    this: ComponentHarnessConstructor<T>,
    options: BaseHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  async getItems(filters: UiAccordionItemHarnessFilters = {}): Promise<UiAccordionItemHarness[]> {
    return this.locatorForAll(UiAccordionItemHarness.with(filters))();
  }

  /** The first item that matches the filters; throws when none does. */
  async getItem(filters: UiAccordionItemHarnessFilters): Promise<UiAccordionItemHarness> {
    const item = (await this.getItems(filters)).at(0);
    if (!item) throw Error(`No accordion item matches ${JSON.stringify(filters)}.`);
    return item;
  }

  /** The labels of the expanded items, in order. */
  async getExpandedLabels(): Promise<string[]> {
    const expanded = await this.getItems({ expanded: true });
    return Promise.all(expanded.map((item) => item.getLabel()));
  }

  /** Expands the first item that matches the filters. */
  async expand(filters: UiAccordionItemHarnessFilters): Promise<void> {
    await (await this.getItem(filters)).expand();
  }

  /** Collapses the first item that matches the filters. */
  async collapse(filters: UiAccordionItemHarnessFilters): Promise<void> {
    await (await this.getItem(filters)).collapse();
  }
}

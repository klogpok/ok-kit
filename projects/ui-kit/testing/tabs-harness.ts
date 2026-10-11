import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiTabHarnessFilters extends BaseHarnessFilters {
  /** The text of the tab (a `uiTabLabel` template included). */
  label?: string | RegExp;
  selected?: boolean;
  disabled?: boolean;
}

/** A tab of `ui-tab-group`. Get it from `UiTabGroupHarness.getTabs()`. */
export class UiTabHarness extends UiHarness {
  static hostSelector = '.ui-tabs__tab';

  static with<T extends UiTabHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTabHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  /** The text of the tab, with runs of white space collapsed. */
  async getLabel(): Promise<string> {
    return (await (await this.host()).text()).replace(/\s+/g, ' ').trim();
  }

  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Clicks the tab. A disabled tab is not selected. */
  async select(): Promise<void> {
    await (await this.host()).click();
  }
}

export interface UiTabGroupHarnessFilters extends BaseHarnessFilters {
  /** The name of the tab list: its `aria-label`, or the text `aria-labelledby` points to. */
  label?: string | RegExp;
}

/**
 * Harness for `ui-tab-group`. `getHarness()` finds harnesses in the selected panel; the others are
 * not rendered.
 */
export class UiTabGroupHarness extends UiHarness {
  static hostSelector = '.ui-tab-group';

  static with<T extends UiTabGroupHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTabGroupHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  async getLabel(): Promise<string | null> {
    const list = await this.locatorFor('.ui-tabs__list')();
    return (await list.getAttribute('aria-label')) ?? this.labelledByText(list);
  }

  async getTabs(filters: UiTabHarnessFilters = {}): Promise<UiTabHarness[]> {
    return this.locatorForAll(UiTabHarness.with(filters))();
  }

  async getSelectedTab(): Promise<UiTabHarness> {
    return this.locatorFor(UiTabHarness.with({ selected: true }))();
  }

  async getSelectedLabel(): Promise<string> {
    return (await this.getSelectedTab()).getLabel();
  }

  /** Clicks the first tab that matches the filters. */
  async selectTab(filters: UiTabHarnessFilters): Promise<void> {
    const tab = (await this.getTabs(filters)).at(0);
    if (!tab) throw Error(`No tab matches ${JSON.stringify(filters)}.`);
    await tab.select();
  }
}

export interface UiTabLinkHarnessFilters extends BaseHarnessFilters {
  text?: string | RegExp;
  /** The current page (`aria-current="page"`). */
  active?: boolean;
  disabled?: boolean;
}

/** A link of `nav[ui-tab-nav]`. Get it from `UiTabNavHarness.getLinks()`. */
export class UiTabLinkHarness extends UiHarness {
  static hostSelector = '.ui-tab-link';

  static with<T extends UiTabLinkHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTabLinkHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'active',
        options.active,
        async (harness, active) => (await harness.isActive()) === active,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** The `href` of the link; `null` while it is disabled. */
  async getHref(): Promise<string | null> {
    return (await this.host()).getAttribute('href');
  }

  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-current')) === 'page';
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Clicks the link. A disabled link does not navigate. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export interface UiTabNavHarnessFilters extends BaseHarnessFilters {
  /** The `aria-label` of the `nav`. */
  label?: string | RegExp;
}

/** Harness for `nav[ui-tab-nav]`, tab-styled links between routes. */
export class UiTabNavHarness extends UiHarness {
  static hostSelector = '.ui-tab-nav';

  static with<T extends UiTabNavHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTabNavHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  async getLabel(): Promise<string | null> {
    const host = await this.host();
    return (await host.getAttribute('aria-label')) ?? this.labelledByText(host);
  }

  async getLinks(filters: UiTabLinkHarnessFilters = {}): Promise<UiTabLinkHarness[]> {
    return this.locatorForAll(UiTabLinkHarness.with(filters))();
  }

  /** The text of the active link, or `null` when none is active. */
  async getActiveText(): Promise<string | null> {
    const active = await this.locatorForOptional(UiTabLinkHarness.with({ active: true }))();
    return active ? active.getText() : null;
  }

  /** Clicks the first link that matches the filters. */
  async clickLink(filters: UiTabLinkHarnessFilters): Promise<void> {
    const link = (await this.getLinks(filters)).at(0);
    if (!link) throw Error(`No tab link matches ${JSON.stringify(filters)}.`);
    await link.click();
  }
}

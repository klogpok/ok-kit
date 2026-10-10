import {
  BaseHarnessFilters,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiBreadcrumbHarnessFilters extends BaseHarnessFilters {
  /** The text of the link. */
  text?: string | RegExp;
  /** The last link, the current page. */
  current?: boolean;
  /** Hidden behind the "…" menu button. */
  collapsed?: boolean;
}

/** A link of `nav[ui-breadcrumbs]`. Get it from `UiBreadcrumbsHarness.getItems()`. */
export class UiBreadcrumbHarness extends ComponentHarness {
  static hostSelector = '.ui-breadcrumb';

  static with<T extends UiBreadcrumbHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiBreadcrumbHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'current',
        options.current,
        async (harness, current) => (await harness.isCurrent()) === current,
      )
      .addOption(
        'collapsed',
        options.collapsed,
        async (harness, collapsed) => (await harness.isCollapsed()) === collapsed,
      );
  }

  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** The `href` of the link; `null` for a current page without one. */
  async getHref(): Promise<string | null> {
    return (await this.host()).getAttribute('href');
  }

  async isCurrent(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-current')) === 'page';
  }

  async isCollapsed(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('hidden');
  }

  /**
   * Clicks the link. A collapsed link is not visible to the user: follow it with
   * `UiBreadcrumbsHarness.followCollapsed()`.
   */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export interface UiBreadcrumbsHarnessFilters extends BaseHarnessFilters {
  /** The name of the landmark: its `aria-label`, or the `breadcrumbs` label. */
  label?: string | RegExp;
}

/** Harness for `nav[ui-breadcrumbs]`. */
export class UiBreadcrumbsHarness extends UiHarness {
  static hostSelector = '.ui-breadcrumbs';

  private readonly moreButton = this.locatorForOptional('.ui-breadcrumbs__more-button');

  static with<T extends UiBreadcrumbsHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiBreadcrumbsHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Every link in order, collapsed ones included. */
  async getItems(filters: UiBreadcrumbHarnessFilters = {}): Promise<UiBreadcrumbHarness[]> {
    return this.locatorForAll(UiBreadcrumbHarness.with(filters))();
  }

  /** The texts of the links the user sees, in order. */
  async getVisibleTexts(): Promise<string[]> {
    return this.textsOf({ collapsed: false });
  }

  /** The texts of the links behind the "…" menu button, in order. */
  async getCollapsedTexts(): Promise<string[]> {
    return this.textsOf({ collapsed: true });
  }

  /** The text of the current page (the last link), or `null` without links. */
  async getCurrentText(): Promise<string | null> {
    const current = await this.locatorForOptional(UiBreadcrumbHarness.with({ current: true }))();
    return current ? current.getText() : null;
  }

  async hasCollapsedItems(): Promise<boolean> {
    return !!(await this.moreButton());
  }

  /** Opens the "…" menu and chooses the collapsed link with this text, as the user does. */
  async followCollapsed(text: string | RegExp): Promise<void> {
    const button = await this.moreButton();
    if (!button) throw Error(`No collapsed link matches ${String(text)}.`);
    if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();
    const menuId = await button.getAttribute('aria-controls');
    const items = menuId
      ? await this.documentRootLocatorFactory().locatorForAll(`[id="${menuId}"] .ui-menu-item`)()
      : [];
    for (const item of items) {
      if (await HarnessPredicate.stringMatches((await item.text()).trim(), text)) {
        await item.click();
        return;
      }
    }
    await button.click();
    throw Error(`No collapsed link matches ${String(text)}.`);
  }

  private async textsOf(filters: UiBreadcrumbHarnessFilters): Promise<string[]> {
    const items = await this.getItems(filters);
    return Promise.all(items.map((item) => item.getText()));
  }
}

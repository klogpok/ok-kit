import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiMenuHarnessFilters extends BaseHarnessFilters {
  /** Text of the trigger. */
  text?: string | RegExp;
  /** `aria-label` of the trigger (e.g. the `label` of an icon button). */
  label?: string | RegExp;
}

export interface UiMenuItemHarnessFilters extends BaseHarnessFilters {
  /** The label text (without the icon). */
  text?: string | RegExp;
  disabled?: boolean;
  /** A checkbox or radio item that is checked. */
  checked?: boolean;
}

/** Role of a menu item: an action, a checkbox item or a radio item. */
export type UiMenuItemRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';

/**
 * Harness for a menu: the element with `[uiMenuTriggerFor]`, which the menu opens from. The menu
 * lives in an overlay, found from the document root; open it before reading its items.
 */
export class UiMenuHarness extends UiHarness {
  static hostSelector = '.ui-menu-trigger';

  static with<T extends UiMenuHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiMenuHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      );
  }

  /** Text of the trigger. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** `aria-label` of the trigger; `null` without one. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the menu by clicking the trigger, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.host()).click();
  }

  /** Closes the menu with Escape, unless it is closed. */
  async close(): Promise<void> {
    const panel = await this.panel();
    if (panel) await panel.sendKeys(TestKey.ESCAPE);
  }

  /** Items of the open menu, in groups too; `[]` while it is closed. */
  async getItems(filters: UiMenuItemHarnessFilters = {}): Promise<UiMenuItemHarness[]> {
    const id = await this.panelId();
    if (!id) return [];
    return this.documentRootLocatorFactory().locatorForAll(
      UiMenuItemHarness.with({ ...filters, ancestor: `#${id}` }),
    )();
  }

  /**
   * Opens the menu and clicks the first matching item. With more filters, the item opens a
   * submenu and the next filters pick the item in it. Throws when no item matches.
   */
  async clickItem(
    filters: UiMenuItemHarnessFilters,
    ...subItemFilters: UiMenuItemHarnessFilters[]
  ): Promise<void> {
    await this.open();
    const items = await this.getItems(filters);
    if (!items.length) throw Error(`No item matches ${JSON.stringify(filters)}.`);
    const item = items[0];
    if (!subItemFilters.length) {
      await item.click();
      return;
    }
    const submenu = await item.getSubmenu();
    if (!submenu) throw Error(`The item ${JSON.stringify(filters)} has no submenu.`);
    await submenu.clickItem(subItemFilters[0], ...subItemFilters.slice(1));
  }

  /** `id` of the open menu (`aria-controls` of the trigger). */
  private async panelId(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-controls');
  }

  private async panel(): Promise<TestElement | null> {
    const id = await this.panelId();
    return id ? this.documentRootLocatorFactory().locatorForOptional(`#${id}`)() : null;
  }
}

/** Harness for an item of a `ui-menu` (from `UiMenuHarness.getItems()`). */
export class UiMenuItemHarness extends UiHarness {
  static hostSelector = '.ui-menu-item';

  static with<T extends UiMenuItemHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiMenuItemHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      )
      .addOption(
        'checked',
        options.checked,
        async (harness, checked) => (await harness.isChecked()) === checked,
      );
  }

  /**
   * Clicks the item like a user: an action runs `triggered` and closes the menu, a checkbox or
   * radio item toggles; a disabled item ignores it.
   */
  async click(): Promise<void> {
    await (await this.host()).click();
  }

  async getText(): Promise<string> {
    return (await this.locatorFor('.ui-menu-item__label')()).text();
  }

  async getRole(): Promise<UiMenuItemRole> {
    return (await (await this.host()).getAttribute('role')) as UiMenuItemRole;
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether a checkbox or radio item is checked; `false` for an action. */
  async isChecked(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-checked')) === 'true';
  }

  async isDanger(): Promise<boolean> {
    return (await this.host()).hasClass('ui-menu-item--danger');
  }

  async hasSubmenu(): Promise<boolean> {
    return (await this.host()).hasClass('ui-menu-trigger');
  }

  /** The submenu this item opens, as a menu harness; `null` for an item without one. */
  async getSubmenu(): Promise<UiMenuHarness | null> {
    return (await this.hasSubmenu()) ? new UiMenuHarness(this.locatorFactory) : null;
  }
}

import {
  BaseHarnessFilters,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  LocatorFactory,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiOptionHarnessFilters extends BaseHarnessFilters {
  /** The label text (without the description). */
  text?: string | RegExp;
  selected?: boolean;
  disabled?: boolean;
}

/** Harness for `ui-option` in the list of a `ui-select`, `ui-autocomplete` or `ui-time-input`. */
export class UiOptionHarness extends UiHarness {
  static hostSelector = '.ui-option';

  static with<T extends UiOptionHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiOptionHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
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

  /** Clicks the option like a user; a disabled option ignores it. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }

  async getText(): Promise<string> {
    return (await this.locatorFor('.ui-option__label')()).text();
  }

  /** Text of the `uiOptionDescription` slot. */
  async getDescription(): Promise<string> {
    return (await this.locatorFor('.ui-option__description')()).text();
  }

  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** The option highlighted by the keyboard (`aria-activedescendant` of the trigger). */
  async isActive(): Promise<boolean> {
    const id = await (await this.host()).getAttribute('id');
    if (!id) return false;
    const control = await this.documentRootLocatorFactory().locatorForOptional(
      `[aria-activedescendant="${id}"]`,
    )();
    return control !== null;
  }
}

/**
 * Harness for the popup listbox (`ui-listbox`, `role="listbox"`) of a combobox field. Internal:
 * not in the public API. Reach it through `UiPopupListbox`.
 */
export class UiListboxHarness extends ComponentHarness {
  static hostSelector = '[role="listbox"]';

  /** Options shown in the list; options hidden by the search are skipped. */
  async getOptions(filters: UiOptionHarnessFilters = {}): Promise<UiOptionHarness[]> {
    return this.locatorForAll(
      UiOptionHarness.with({ ...filters, selector: `${filters.selector ?? ''}:not([hidden])` }),
    )();
  }
}

/**
 * The popup listbox of a combobox field, reached from the field's control: `aria-controls`
 * names the open listbox and `aria-activedescendant` its active option. The listbox renders in
 * an overlay, so it is looked up from the document root. Internal: not in the public API.
 *
 * @example
 * private readonly listbox = new UiPopupListbox(this.input, this.documentRootLocatorFactory());
 */
export class UiPopupListbox {
  constructor(
    private readonly control: () => Promise<TestElement>,
    private readonly root: LocatorFactory,
  ) {}

  /** The open listbox; `null` while it is closed. */
  async panel(): Promise<UiListboxHarness | null> {
    const id = await (await this.control()).getAttribute('aria-controls');
    if (!id) return null;
    return this.root.locatorForOptional(
      new HarnessPredicate(UiListboxHarness, { selector: `[id="${id}"]` }),
    )();
  }

  /** Options of the open list; `[]` while it is closed. Options hidden by the search are skipped. */
  async getOptions(filters: UiOptionHarnessFilters = {}): Promise<UiOptionHarness[]> {
    const panel = await this.panel();
    return panel ? panel.getOptions(filters) : [];
  }

  /** The option the keyboard is on; `null` when there is none or the list is closed. */
  async getActiveOption(): Promise<UiOptionHarness | null> {
    const id = await (await this.control()).getAttribute('aria-activedescendant');
    if (!id) return null;
    return this.root.locatorForOptional(UiOptionHarness.with({ selector: `[id="${id}"]` }))();
  }

  /**
   * The "Add «…»" leading action of the open list, whatever the language of its label; `null`
   * while it is not offered or the list is closed.
   */
  async getCreateAction(): Promise<UiOptionHarness | null> {
    return (await this.getOptions({ selector: '.ui-listbox__create' }))[0] ?? null;
  }

  /**
   * The "Select all" leading action of the open list; `null` while it is not offered (no option
   * to act on) or the list is closed. `isSelected()` is true while every option it acts on is.
   */
  async getSelectAllAction(): Promise<UiOptionHarness | null> {
    return (await this.getOptions({ selector: '.ui-listbox__select-all' }))[0] ?? null;
  }

  /**
   * Clicks the first matching option of the open list, or every one with `all`. Throws
   * `No <noun> matches <filters>.` when none matches.
   */
  async clickOptions(
    filters: UiOptionHarnessFilters,
    { all = false, noun = 'option' }: { all?: boolean; noun?: string } = {},
  ): Promise<void> {
    const options = await this.getOptions(filters);
    if (!options.length) throw Error(`No ${noun} matches ${JSON.stringify(filters)}.`);
    for (const option of all ? options : options.slice(0, 1)) await option.click();
  }
}

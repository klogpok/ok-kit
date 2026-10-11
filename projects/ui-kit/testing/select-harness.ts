import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import type { UiSize } from '@vplans/ui-kit/core';
import { UiHarness } from './harness';
import { UiOptionHarness, UiOptionHarnessFilters, UiPopupListbox } from './listbox-harness';
import { uiModifier } from './modifier';

export { UiOptionHarness } from './listbox-harness';
export type { UiOptionHarnessFilters } from './listbox-harness';

export interface UiSelectHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the `label[for]` (e.g. from `ui-form-field`). */
  label?: string | RegExp;
  /** Text of the selected value(s) in the trigger. */
  value?: string | RegExp;
  disabled?: boolean;
  /** Only `ui-multi-select` (`true`) or only `ui-select` (`false`). */
  multiple?: boolean;
}

const SIZES: readonly UiSize[] = ['sm', 'md', 'lg'];

/**
 * Harness for `ui-select` and `ui-multi-select`. The options live in an overlay; open the list
 * before reading them.
 */
export class UiSelectHarness extends UiHarness {
  static hostSelector = '.ui-select';

  private readonly trigger = this.locatorFor('.ui-select__trigger');
  private readonly control = this.locatorFor('.ui-select__control');
  private readonly listbox = new UiPopupListbox(this.control, this.documentRootLocatorFactory());

  static with<T extends UiSelectHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiSelectHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption('value', options.value, (harness, value) =>
        HarnessPredicate.stringMatches(harness.getValueText(), value),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      )
      .addOption(
        'multiple',
        options.multiple,
        async (harness, multiple) => (await harness.isMultiple()) === multiple,
      );
  }

  protected override focusTarget(): Promise<TestElement> {
    return this.control();
  }

  async getLabel(): Promise<string | null> {
    return this.controlLabel(await this.control());
  }

  /**
   * Text of the selected value(s) in the trigger; `''` when nothing is selected. While a
   * `searchable` list is open the field shows the search text, so read it with the list closed.
   */
  async getValueText(): Promise<string> {
    const control = await this.control();
    if (await this.isSearchable()) return control.getProperty<string>('value');
    const value = await this.locatorFor('.ui-select__value')();
    return (await value.hasClass('ui-select__value--placeholder')) ? '' : value.text();
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the list by clicking the trigger, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }

  /** Closes the list with Escape, unless it is closed. */
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.control()).sendKeys(TestKey.ESCAPE);
  }

  /** Options of the open list; `[]` while it is closed. Options hidden by the search are skipped. */
  async getOptions(filters: UiOptionHarnessFilters = {}): Promise<UiOptionHarness[]> {
    return this.listbox.getOptions(filters);
  }

  /** The option the keyboard is on; `null` when there is none or the list is closed. */
  async getActiveOption(): Promise<UiOptionHarness | null> {
    return this.listbox.getActiveOption();
  }

  /**
   * Opens the list and clicks the matching options: the first one in a `ui-select`, all of them
   * in a `ui-multi-select`. Throws when no option matches.
   */
  async clickOptions(filters: UiOptionHarnessFilters = {}): Promise<void> {
    await this.open();
    await this.listbox.clickOptions(filters, { all: await this.isMultiple() });
  }

  /** Types into the field of a `searchable` select, replacing the search text. */
  async search(text: string): Promise<void> {
    if (!(await this.isSearchable())) throw Error('The select is not searchable.');
    const control = await this.control();
    await control.clear();
    if (text) await control.sendKeys(text);
  }

  /** Clicks the clear button of a `clearable` select. Throws when it is not shown. */
  async clear(): Promise<void> {
    const button = await this.locatorForOptional('.ui-select__clear')();
    if (!button) throw Error('The select has no clear button (not clearable, empty or disabled).');
    await button.click();
  }

  async isMultiple(): Promise<boolean> {
    return (await this.host()).hasClass('ui-multi-select');
  }

  async isSearchable(): Promise<boolean> {
    return (await (await this.control()).getProperty<string>('tagName')) === 'INPUT';
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('ui-select--disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await this.host()).hasClass('ui-select--readonly');
  }

  async isRequired(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-required')) === 'true';
  }

  /** The error state: invalid and touched with forms, or the `invalid` input. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.control()).getAttribute('aria-invalid')) === 'true';
  }

  async isLoading(): Promise<boolean> {
    return (await this.locatorForOptional('.ui-select__spinner')()) !== null;
  }

  async getSize(): Promise<UiSize> {
    return (await uiModifier(await this.host(), 'ui-select--', SIZES))!;
  }
}

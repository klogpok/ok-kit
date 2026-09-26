import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import type { UiSize } from '@vplans/ui-kit/core';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiOptionHarnessFilters extends BaseHarnessFilters {
  /** The label text (without the description). */
  text?: string | RegExp;
  selected?: boolean;
  disabled?: boolean;
}

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

/** Harness for `ui-option` in the list of a `ui-select` or `ui-multi-select`. */
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
    return (await this.host()).hasClass('ui-option--active');
  }
}

/**
 * Harness for `ui-select` and `ui-multi-select`. The options live in an overlay; open the list
 * before reading them.
 */
export class UiSelectHarness extends UiHarness {
  static hostSelector = '.ui-select';

  private readonly trigger = this.locatorFor('.ui-select__trigger');
  private readonly control = this.locatorFor('.ui-select__control');

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
    const panelId = await (await this.control()).getAttribute('aria-controls');
    if (!panelId) return [];
    return this.documentRootLocatorFactory().locatorForAll(
      UiOptionHarness.with({
        ...filters,
        ancestor: `#${panelId}`,
        selector: `${filters.selector ?? ''}:not([hidden])`,
      }),
    )();
  }

  /**
   * Opens the list and clicks the matching options: the first one in a `ui-select`, all of them
   * in a `ui-multi-select`. Throws when no option matches.
   */
  async clickOptions(filters: UiOptionHarnessFilters = {}): Promise<void> {
    await this.open();
    const options = await this.getOptions(filters);
    if (!options.length) throw Error(`No option matches ${JSON.stringify(filters)}.`);
    if (await this.isMultiple()) {
      for (const option of options) await option.click();
    } else {
      await options[0].click();
    }
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

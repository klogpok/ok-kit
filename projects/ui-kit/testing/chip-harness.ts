import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiChipHarnessFilters extends BaseHarnessFilters {
  /** The chip text (without the remove button). */
  text?: string | RegExp;
  /** Only filter chips that are (or are not) selected. */
  selected?: boolean;
  disabled?: boolean;
}

export interface UiChipInputHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the `label[for]` (e.g. from `ui-form-field`). */
  label?: string | RegExp;
  disabled?: boolean;
}

/** Harness for `ui-chip` and `button[ui-filter-chip]`. */
export class UiChipHarness extends UiHarness {
  static hostSelector = '.ui-chip';

  private readonly label = this.locatorFor('.ui-chip__label');
  private readonly removeButton = this.locatorForOptional('.ui-chip__remove');

  static with<T extends UiChipHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiChipHarnessFilters = {},
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

  protected override async focusTarget(): Promise<TestElement> {
    return (await this.removeButton()) ?? this.host();
  }

  async getText(): Promise<string> {
    return (await this.label()).text();
  }

  async isFilter(): Promise<boolean> {
    return (await this.host()).hasClass('ui-filter-chip');
  }

  /** Whether a filter chip is pressed; `false` for other chips. */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-pressed')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('ui-chip--disabled');
  }

  async isRemovable(): Promise<boolean> {
    return (await this.removeButton()) !== null;
  }

  /** Clicks the remove button. Throws when the chip is not removable. */
  async remove(): Promise<void> {
    const button = await this.removeButton();
    if (!button) throw Error('The chip is not removable.');
    await button.click();
  }

  /** Clicks a filter chip. Throws for other chips. */
  async toggle(): Promise<void> {
    if (!(await this.isFilter())) throw Error('Only filter chips can be toggled.');
    await (await this.host()).click();
  }
}

/** Harness for `ui-chip-input`. */
export class UiChipInputHarness extends UiHarness {
  static hostSelector = '.ui-chip-input';

  private readonly input = this.locatorFor('.ui-chip-input__input');

  static with<T extends UiChipInputHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiChipInputHarnessFilters = {},
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

  protected override focusTarget(): Promise<TestElement> {
    return this.input();
  }

  async getLabel(): Promise<string | null> {
    return this.controlLabel(await this.input());
  }

  async getChips(filters: UiChipHarnessFilters = {}): Promise<UiChipHarness[]> {
    return this.locatorForAll(UiChipHarness.with(filters))();
  }

  /** Texts of the chips in order. */
  async getValues(): Promise<string[]> {
    return Promise.all((await this.getChips()).map((chip) => chip.getText()));
  }

  /** Types the text and presses Enter, like a user adding a chip. */
  async add(text: string): Promise<void> {
    const input = await this.input();
    await input.clear();
    await input.sendKeys(text, TestKey.ENTER);
  }

  /** Clicks the remove button of the first chip with this text. */
  async removeChip(text: string | RegExp): Promise<void> {
    const chip = (await this.getChips({ text })).at(0);
    if (!chip) throw Error(`No chip matches ${String(text)}.`);
    await chip.remove();
  }

  /** The text typed but not added yet. */
  async getText(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('readOnly');
  }

  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }
}

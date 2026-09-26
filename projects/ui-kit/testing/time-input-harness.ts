import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';
import { UiOptionHarness, UiOptionHarnessFilters } from './select-harness';

export interface UiTimeInputHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the `label[for]` (e.g. from `ui-form-field`). */
  label?: string | RegExp;
  /** The text in the field, e.g. "14:30" or "2:30 PM". */
  value?: string | RegExp;
  disabled?: boolean;
}

/** Harness for `ui-time-input`. The list of times lives in an overlay; open it to read it. */
export class UiTimeInputHarness extends UiHarness {
  static hostSelector = '.ui-time-input';

  private readonly input = this.locatorFor('.ui-time-input__input');

  static with<T extends UiTimeInputHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTimeInputHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption('value', options.value, (harness, value) =>
        HarnessPredicate.stringMatches(harness.getText(), value),
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

  /** The text in the field, in the locale format. */
  async getText(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  /** Types the text like a user, replacing the old text. Call `blur()` to commit it. */
  async setText(text: string): Promise<void> {
    const input = await this.input();
    await input.clear();
    if (text) await input.sendKeys(text);
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the list of times (Alt+ArrowDown), without moving the active time. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      await (await this.input()).sendKeys({ alt: true }, TestKey.DOWN_ARROW);
    }
  }

  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.input()).sendKeys(TestKey.ESCAPE);
  }

  /** The times in the list. Opens it. */
  async getOptions(filters: UiOptionHarnessFilters = {}): Promise<UiOptionHarness[]> {
    await this.open();
    const id = await (await this.input()).getAttribute('aria-controls');
    return this.documentRootLocatorFactory().locatorForAll(
      UiOptionHarness.with({ ...filters, ancestor: `[id="${id}"]` }),
    )();
  }

  /** Clicks the first time in the list that matches the filters, e.g. `{ text: '14:30' }`. */
  async selectOption(filters: UiOptionHarnessFilters): Promise<void> {
    const option = (await this.getOptions(filters)).at(0);
    if (!option) throw Error(`No time matches ${JSON.stringify(filters)}.`);
    await option.click();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('readOnly');
  }

  async isRequired(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-required')) === 'true';
  }

  /** The error state, including text that is not a time. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }
}

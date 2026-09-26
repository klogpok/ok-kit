import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiNumberInputHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the `label[for]` (e.g. from `ui-form-field`). */
  label?: string | RegExp;
  /** The shown text, e.g. "1,234.5". */
  value?: string | RegExp;
  disabled?: boolean;
}

/** Harness for `ui-number-input`. */
export class UiNumberInputHarness extends UiHarness {
  static hostSelector = '.ui-number-input';

  private readonly input = this.locatorFor('.ui-number-input__input');

  static with<T extends UiNumberInputHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiNumberInputHarnessFilters = {},
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

  /** The value (`aria-valuenow`); `null` while the field is empty or not a number. */
  async getValue(): Promise<number | null> {
    const now = await (await this.input()).getAttribute('aria-valuenow');
    return now === null ? null : Number(now);
  }

  /** Types the text like a user, replacing the old text. Call `blur()` to commit it. */
  async setText(text: string): Promise<void> {
    const input = await this.input();
    await input.clear();
    if (text) await input.sendKeys(text);
  }

  /** Presses ArrowUp (or PageUp with `large`) in the field. */
  async increment(large = false): Promise<void> {
    await (await this.input()).sendKeys(large ? TestKey.PAGE_UP : TestKey.UP_ARROW);
  }

  /** Presses ArrowDown (or PageDown with `large`) in the field. */
  async decrement(large = false): Promise<void> {
    await (await this.input()).sendKeys(large ? TestKey.PAGE_DOWN : TestKey.DOWN_ARROW);
  }

  /** Clicks the + or − button. Throws when the steppers are hidden. */
  async clickStepper(direction: 'up' | 'down'): Promise<void> {
    const buttons = await this.locatorForAll('.ui-number-input__step')();
    if (buttons.length < 2) throw Error('The number input has no stepper buttons.');
    await buttons[direction === 'up' ? 1 : 0].click();
  }

  async getMin(): Promise<number | null> {
    const min = await (await this.input()).getAttribute('aria-valuemin');
    return min === null ? null : Number(min);
  }

  async getMax(): Promise<number | null> {
    const max = await (await this.input()).getAttribute('aria-valuemax');
    return max === null ? null : Number(max);
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

  /** The error state, including text that is not a number. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }
}

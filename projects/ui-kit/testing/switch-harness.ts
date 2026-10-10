import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiSwitchHarnessFilters extends BaseHarnessFilters {
  /** The projected label text, or the `aria-label` / `label[for]` when there is none. */
  label?: string | RegExp;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
}

/** Harness for `ui-switch`. */
export class UiSwitchHarness extends UiHarness {
  static hostSelector = 'ui-switch';

  private readonly input = this.locatorFor('.ui-switch__input');

  static with<T extends UiSwitchHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiSwitchHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption('name', options.name, async (harness, name) => (await harness.getName()) === name)
      .addOption(
        'checked',
        options.checked,
        async (harness, checked) => (await harness.isChecked()) === checked,
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

  /** The projected text, or the `aria-label` / `label[for]` of a switch without text. */
  async getLabel(): Promise<string> {
    const text = (await (await this.locatorFor('.ui-switch__text')()).text()).trim();
    return text || ((await this.controlLabel(await this.input())) ?? '');
  }

  async getName(): Promise<string | null> {
    return (await this.input()).getAttribute('name');
  }

  async isChecked(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('checked');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  async isRequired(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('required');
  }

  async isReadonly(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-readonly')) === 'true';
  }

  /** The error state: invalid and touched with forms, or the `invalid` input. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  /** Clicks the switch like a user. Does nothing visible when it is disabled or readonly. */
  async toggle(): Promise<void> {
    await (await this.input()).click();
  }

  /** Turns the switch on unless it is on already. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) await this.toggle();
  }

  /** Turns the switch off unless it is off already. */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) await this.toggle();
  }
}

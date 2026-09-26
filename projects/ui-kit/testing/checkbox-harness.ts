import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiCheckboxHarnessFilters extends BaseHarnessFilters {
  /** The projected label text, or `aria-label` when there is none. */
  label?: string | RegExp;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
}

/** Harness for `ui-checkbox`. */
export class UiCheckboxHarness extends UiHarness {
  static hostSelector = 'ui-checkbox';

  private readonly input = this.locatorFor('.ui-checkbox__input');

  static with<T extends UiCheckboxHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiCheckboxHarnessFilters = {},
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

  async getLabel(): Promise<string> {
    const text = await (await this.locatorFor('.ui-checkbox__text')()).text();
    return text || ((await (await this.input()).getAttribute('aria-label')) ?? '');
  }

  async getName(): Promise<string | null> {
    return (await this.input()).getAttribute('name');
  }

  async isChecked(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('checked');
  }

  async isIndeterminate(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('indeterminate');
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

  /** Clicks the checkbox like a user. Does nothing visible when it is disabled or readonly. */
  async toggle(): Promise<void> {
    await (await this.input()).click();
  }

  /** Checks the checkbox unless it is checked already. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) await this.toggle();
  }

  /** Unchecks the checkbox unless it is unchecked already. */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) await this.toggle();
  }
}

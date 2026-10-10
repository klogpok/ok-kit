import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiRadioHarnessFilters extends BaseHarnessFilters {
  /** The projected label text, or the `aria-label` of the radio when it has one. */
  label?: string | RegExp;
  checked?: boolean;
  disabled?: boolean;
}

/** Harness for `ui-radio`, also from `UiRadioGroupHarness.getRadios()`. */
export class UiRadioHarness extends UiHarness {
  static hostSelector = '.ui-radio';

  private readonly input = this.locatorFor('.ui-radio__input');

  static with<T extends UiRadioHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiRadioHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
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

  /** The `aria-label` of the radio, or its projected text: what a screen reader announces. */
  async getLabel(): Promise<string> {
    const ariaLabel = await (await this.input()).getAttribute('aria-label');
    return ariaLabel ?? (await (await this.locatorFor('.ui-radio__text')()).text()).trim();
  }

  async isChecked(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('checked');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  /** Clicks the radio like a user. A disabled radio or a readonly group keeps the selection. */
  async check(): Promise<void> {
    await (await this.input()).click();
  }
}

export interface UiRadioGroupHarnessFilters extends BaseHarnessFilters {
  /** The group label: the `aria-label`, or the label of `ui-form-field`. */
  label?: string | RegExp;
  /** The `name` shared by the radios. */
  name?: string;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/** Harness for `ui-radio-group`. */
export class UiRadioGroupHarness extends UiHarness {
  static hostSelector = '.ui-radio-group';

  static with<T extends UiRadioGroupHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiRadioGroupHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption('name', options.name, async (harness, name) => (await harness.getName()) === name)
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      )
      .addOption(
        'orientation',
        options.orientation,
        async (harness, orientation) => (await harness.getOrientation()) === orientation,
      );
  }

  /** The checked radio, or the first enabled one: where Tab lands. */
  protected override async focusTarget(): Promise<TestElement> {
    const inputs = await this.locatorForAll('.ui-radio__input')();
    for (const input of inputs) if (await input.getProperty<boolean>('checked')) return input;
    for (const input of inputs) if (!(await input.getProperty<boolean>('disabled'))) return input;
    return this.host();
  }

  async getLabel(): Promise<string | null> {
    const host = await this.host();
    return (await host.getAttribute('aria-label')) ?? this.labelledByText(host);
  }

  /** The `name` shared by the radios, or `null` for an empty group. */
  async getName(): Promise<string | null> {
    const input = await this.locatorForOptional('.ui-radio__input')();
    return input ? input.getAttribute('name') : null;
  }

  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    return (await (await this.host()).hasClass('ui-radio-group--horizontal'))
      ? 'horizontal'
      : 'vertical';
  }

  async getRadios(filters: UiRadioHarnessFilters = {}): Promise<UiRadioHarness[]> {
    return this.locatorForAll(UiRadioHarness.with(filters))();
  }

  /** The label of the checked radio, or `null` when none is checked. */
  async getCheckedLabel(): Promise<string | null> {
    const checked = await this.locatorForOptional(UiRadioHarness.with({ checked: true }))();
    return checked ? checked.getLabel() : null;
  }

  /** Clicks the first radio that matches the filters, e.g. `{ label: 'Courier' }`. */
  async check(filters: UiRadioHarnessFilters): Promise<void> {
    const radio = (await this.getRadios(filters)).at(0);
    if (!radio) throw Error(`No radio matches ${JSON.stringify(filters)}.`);
    await radio.check();
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  async isReadonly(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-readonly')) === 'true';
  }

  async isRequired(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-required')) === 'true';
  }

  /** The error state: invalid and touched with forms, or the `invalid` input. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }
}

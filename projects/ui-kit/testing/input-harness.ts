import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import type { UiSize } from '@vplans/ui-kit/core';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiInputHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the `label[for]` (e.g. from `ui-form-field`). */
  label?: string | RegExp;
  value?: string | RegExp;
  placeholder?: string | RegExp;
}

const SIZES: readonly UiSize[] = ['sm', 'md', 'lg'];

/** Harness for `input[ui-input]` and `textarea[ui-textarea]`. */
export class UiInputHarness extends UiHarness {
  static hostSelector = '.ui-input';

  static with<T extends UiInputHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiInputHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption('value', options.value, (harness, value) =>
        HarnessPredicate.stringMatches(harness.getValue(), value),
      )
      .addOption('placeholder', options.placeholder, (harness, placeholder) =>
        HarnessPredicate.stringMatches(harness.getPlaceholder(), placeholder),
      );
  }

  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /** Replaces the value by typing it, so the forms layer sees `input` events. */
  async setValue(value: string): Promise<void> {
    const host = await this.host();
    await host.clear();
    if (value) await host.sendKeys(value);
    // Characters that cannot be typed (e.g. in a number input) still end up in the value.
    await host.setInputValue(value);
  }

  async getLabel(): Promise<string | null> {
    return this.controlLabel(await this.host());
  }

  async getPlaceholder(): Promise<string> {
    return (await (await this.host()).getAttribute('placeholder')) ?? '';
  }

  async getId(): Promise<string> {
    return (await (await this.host()).getAttribute('id')) ?? '';
  }

  /** `type` of an input; `textarea` for a textarea. */
  async getType(): Promise<string> {
    return (await this.host()).getProperty<string>('type');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('readOnly');
  }

  async isRequired(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-required')) === 'true';
  }

  /** The error state: invalid and touched with forms, or the `invalid` input. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  async getSize(): Promise<UiSize> {
    return (await uiModifier(await this.host(), 'ui-input--', SIZES))!;
  }
}

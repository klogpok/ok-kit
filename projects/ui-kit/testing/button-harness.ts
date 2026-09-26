import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import type { UiSize, UiVariant } from '@vplans/ui-kit/core';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiButtonHarnessFilters extends BaseHarnessFilters {
  /** Text of the button content. */
  text?: string | RegExp;
  /** `label` of an icon button (its accessible name). */
  label?: string | RegExp;
  variant?: UiVariant;
  disabled?: boolean;
}

const VARIANTS: readonly UiVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: readonly UiSize[] = ['sm', 'md', 'lg'];

/** Harness for `ui-button` and `ui-icon-button` on `<button>` and `<a>`. */
export class UiButtonHarness extends UiHarness {
  static hostSelector = '.ui-button';

  static with<T extends UiButtonHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiButtonHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'variant',
        options.variant,
        async (harness, variant) => (await harness.getVariant()) === variant,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  /** Clicks the button. A disabled or loading button does not run its `(click)` handlers. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }

  /** Text of the content (without the spinner). */
  async getText(): Promise<string> {
    return (await this.locatorFor('.ui-button__content')()).text();
  }

  /** `label` of an icon button; `null` for a text button. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** The `disabled` input, also with `disabledInteractive`. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('ui-button--disabled');
  }

  async isLoading(): Promise<boolean> {
    return (await this.host()).hasClass('ui-button--loading');
  }

  async isIconButton(): Promise<boolean> {
    return (await this.host()).hasClass('ui-button--icon');
  }

  /** Whether the button is an `<a>` link. */
  async isLink(): Promise<boolean> {
    return (await (await this.host()).getProperty<string>('tagName')) === 'A';
  }

  async getVariant(): Promise<UiVariant> {
    return (await uiModifier(await this.host(), 'ui-button--', VARIANTS))!;
  }

  async getSize(): Promise<UiSize> {
    return (await uiModifier(await this.host(), 'ui-button--', SIZES))!;
  }
}

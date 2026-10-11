import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import type { UiProgressTone } from '@vplans/ui-kit/progress';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiProgressBarHarnessFilters extends BaseHarnessFilters {
  /** The accessible name: `label`, the `aria-labelledby` text or the default `loading` label. */
  label?: string | RegExp;
}

const TONES: readonly UiProgressTone[] = ['primary', 'success', 'warning', 'danger'];
const SIZES = ['sm', 'md'] as const;

/** Harness for `ui-progress-bar`. */
export class UiProgressBarHarness extends UiHarness {
  static hostSelector = '.ui-progress-bar';

  static with<T extends UiProgressBarHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiProgressBarHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** `label`, the text that `aria-labelledby` refers to, or the default `loading` label. */
  async getLabel(): Promise<string | null> {
    const host = await this.host();
    return (await host.getAttribute('aria-label')) ?? this.labelledByText(host);
  }

  /** The amount done, clamped to 0…max; `null` when indeterminate. */
  async getValue(): Promise<number | null> {
    const value = await (await this.host()).getAttribute('aria-valuenow');
    return value === null ? null : Number(value);
  }

  async getMax(): Promise<number> {
    return Number(await (await this.host()).getAttribute('aria-valuemax'));
  }

  /** The amount is unknown and a bar slides along the track. */
  async isIndeterminate(): Promise<boolean> {
    return (await this.host()).hasClass('ui-progress-bar--indeterminate');
  }

  async getTone(): Promise<UiProgressTone> {
    return (await uiModifier(await this.host(), 'ui-progress-bar--', TONES))!;
  }

  async getSize(): Promise<'sm' | 'md'> {
    return (await uiModifier(await this.host(), 'ui-progress-bar--', SIZES))!;
  }
}

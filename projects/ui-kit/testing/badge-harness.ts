import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import type { UiBadgeTone } from '@vplans/ui-kit/badge';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiBadgeHarnessFilters extends BaseHarnessFilters {
  /** The projected text, also when only screen readers read it (a count or dot badge). */
  text?: string | RegExp;
  tone?: UiBadgeTone;
}

const TONES: readonly UiBadgeTone[] = [
  'neutral',
  'primary',
  'info',
  'success',
  'warning',
  'danger',
];
const APPEARANCES = ['soft', 'solid'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

/** Harness for `ui-badge`. */
export class UiBadgeHarness extends UiHarness {
  static hostSelector = '.ui-badge';

  static with<T extends UiBadgeHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiBadgeHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('tone', options.tone, async (harness, tone) => (await harness.getTone()) === tone);
  }

  /** The projected text. With a count or a dot it is read by screen readers only. */
  async getText(): Promise<string> {
    return (await this.locatorFor('.ui-badge__label')()).text();
  }

  /** The number shown, as the user sees it ("3", "99+"); `null` without a count. */
  async getCount(): Promise<string | null> {
    const count = await this.locatorForOptional('.ui-badge__count')();
    return count ? count.text() : null;
  }

  /** Whether only a dot is shown. */
  async isDot(): Promise<boolean> {
    return (await this.host()).hasClass('ui-badge--dot');
  }

  async getTone(): Promise<UiBadgeTone> {
    return (await uiModifier(await this.host(), 'ui-badge--', TONES))!;
  }

  async getAppearance(): Promise<'soft' | 'solid'> {
    return (await uiModifier(await this.host(), 'ui-badge--', APPEARANCES))!;
  }

  async getSize(): Promise<'sm' | 'md' | 'lg'> {
    return (await uiModifier(await this.host(), 'ui-badge--', SIZES))!;
  }
}

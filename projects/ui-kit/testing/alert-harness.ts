import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import type { UiAlertLive, UiAlertTone } from '@vplans/ui-kit/alert';
import { UiButtonHarness, UiButtonHarnessFilters } from './button-harness';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiAlertHarnessFilters extends BaseHarnessFilters {
  /** The projected message (without the title and the actions). */
  text?: string | RegExp;
  title?: string | RegExp;
  tone?: UiAlertTone;
}

const TONES: readonly UiAlertTone[] = ['info', 'success', 'warning', 'danger'];
const LIVE: Record<string, UiAlertLive> = { status: 'polite', alert: 'assertive' };

/** Harness for `ui-alert`. */
export class UiAlertHarness extends UiHarness {
  static hostSelector = '.ui-alert';

  private readonly closeButton = this.locatorForOptional('.ui-alert__close');

  static with<T extends UiAlertHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiAlertHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('title', options.title, (harness, title) =>
        HarnessPredicate.stringMatches(harness.getTitle(), title),
      )
      .addOption('tone', options.tone, async (harness, tone) => (await harness.getTone()) === tone);
  }

  async getTone(): Promise<UiAlertTone> {
    return (await uiModifier(await this.host(), 'ui-alert--', TONES))!;
  }

  /** The bold first line, or `''`. */
  async getTitle(): Promise<string> {
    const title = await this.locatorForOptional('.ui-alert__title')();
    return title ? title.text() : '';
  }

  /** The projected message, without the title and the actions. */
  async getText(): Promise<string> {
    return (await this.locatorFor('.ui-alert__message')()).text();
  }

  /** How the alert is announced: `off`, `polite` (`role="status"`) or `assertive` (`role="alert"`). */
  async getLive(): Promise<UiAlertLive> {
    return LIVE[(await (await this.host()).getAttribute('role')) ?? ''] ?? 'off';
  }

  /** The `[uiAlertActions]` buttons (not the close button). */
  async getActions(filters: UiButtonHarnessFilters = {}): Promise<UiButtonHarness[]> {
    return (await this.getChildLoader('.ui-alert__actions')).getAllHarnesses(
      UiButtonHarness.with(filters),
    );
  }

  async isDismissible(): Promise<boolean> {
    return (await this.closeButton()) !== null;
  }

  /** Clicks the close button. Throws when the alert is not dismissible. */
  async dismiss(): Promise<void> {
    const button = await this.closeButton();
    if (!button) throw Error('The alert is not dismissible.');
    await button.click();
  }
}

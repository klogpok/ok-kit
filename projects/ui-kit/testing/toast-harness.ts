import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import type { UiToastTone } from '@vplans/ui-kit/toast';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiToastHarnessFilters extends BaseHarnessFilters {
  message?: string | RegExp;
  title?: string | RegExp;
  tone?: UiToastTone;
}

const TONES: readonly UiToastTone[] = ['info', 'success', 'warning', 'danger'];

/**
 * Harness for a toast shown with `UiToast`. Toasts live in an overlay outside the component under
 * test: load them with `TestbedHarnessEnvironment.documentRootLoader(fixture)`.
 */
export class UiToastHarness extends UiHarness {
  static hostSelector = '.ui-toast';

  static with<T extends UiToastHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiToastHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('message', options.message, (harness, message) =>
        HarnessPredicate.stringMatches(harness.getMessage(), message),
      )
      .addOption('title', options.title, (harness, title) =>
        HarnessPredicate.stringMatches(harness.getTitle(), title),
      )
      .addOption('tone', options.tone, async (harness, tone) => (await harness.getTone()) === tone);
  }

  async getMessage(): Promise<string> {
    return (await this.locatorFor('.ui-toast__message')()).text();
  }

  /** The title; `''` without one. */
  async getTitle(): Promise<string> {
    const title = await this.locatorForOptional('.ui-toast__title')();
    return title ? title.text() : '';
  }

  async getTone(): Promise<UiToastTone> {
    return (await uiModifier(await this.host(), 'ui-toast--', TONES))!;
  }

  /** Label of the action button; `''` without one. */
  async getActionText(): Promise<string> {
    const action = await this.locatorForOptional('.ui-toast__action')();
    return action ? action.text() : '';
  }

  /** Clicks the action button; the toast is dismissed. Throws when it has none. */
  async clickAction(): Promise<void> {
    const action = await this.locatorForOptional('.ui-toast__action')();
    if (!action) throw Error('The toast has no action.');
    await action.click();
  }

  /** Whether the toast has a close button. */
  async isDismissible(): Promise<boolean> {
    return (await this.locatorForOptional('.ui-toast__close')()) !== null;
  }

  /** Clicks the close button. Throws when the toast has none (`dismissible: false`). */
  async dismiss(): Promise<void> {
    const close = await this.locatorForOptional('.ui-toast__close')();
    if (!close) throw Error('The toast has no close button.');
    await close.click();
  }
}

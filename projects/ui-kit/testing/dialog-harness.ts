import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestKey,
} from '@angular/cdk/testing';
import type { UiDialogSize, UiDrawerPosition } from '@vplans/ui-kit/dialog';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiDialogHarnessFilters extends BaseHarnessFilters {
  /** Text of the `[ui-dialog-title]`. */
  title?: string | RegExp;
  /** Only drawers (`true`) or only dialogs (`false`). */
  drawer?: boolean;
}

const SIZES: readonly UiDialogSize[] = ['sm', 'md', 'lg'];
const POSITIONS: readonly UiDrawerPosition[] = ['start', 'end'];

/**
 * Harness for a dialog or drawer opened with `UiDialog` (`open()`, `confirm()`, `openDrawer()`).
 * Dialogs live in an overlay outside the component under test: load them with
 * `TestbedHarnessEnvironment.documentRootLoader(fixture)`.
 */
export class UiDialogHarness extends UiHarness {
  static hostSelector = '.ui-dialog-container, .ui-drawer-container';

  static with<T extends UiDialogHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiDialogHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('title', options.title, (harness, title) =>
        HarnessPredicate.stringMatches(harness.getTitleText(), title),
      )
      .addOption(
        'drawer',
        options.drawer,
        async (harness, drawer) => (await harness.isDrawer()) === drawer,
      );
  }

  /** `dialog`, or `alertdialog` for `confirm()`. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  async isModal(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-modal')) === 'true';
  }

  async getAriaLabelledby(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  async getAriaDescribedby(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-describedby');
  }

  /** Text of the `[ui-dialog-title]`; `''` without one. */
  async getTitleText(): Promise<string> {
    const title = await this.locatorForOptional('.ui-dialog-title')();
    return title ? title.text() : '';
  }

  /** Text of the `ui-dialog-content`; `''` without one. */
  async getContentText(): Promise<string> {
    const content = await this.locatorForOptional('.ui-dialog-content')();
    return content ? content.text() : '';
  }

  /** Text of the `ui-dialog-actions`; `''` without them. */
  async getActionsText(): Promise<string> {
    const actions = await this.locatorForOptional('.ui-dialog-actions')();
    return actions ? actions.text() : '';
  }

  async isDrawer(): Promise<boolean> {
    return (await this.host()).hasClass('ui-drawer-container');
  }

  /** Side of a drawer; `null` for a dialog. */
  async getPosition(): Promise<UiDrawerPosition | null> {
    return uiModifier(await this.host(), 'ui-drawer-container--', POSITIONS);
  }

  async getSize(): Promise<UiDialogSize> {
    const prefix = (await this.isDrawer()) ? 'ui-drawer-container--' : 'ui-dialog-container--';
    return (await uiModifier(await this.host(), prefix, SIZES))!;
  }

  /** Presses Escape, like a user. A dialog opened with `disableClose` stays open. */
  async close(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ESCAPE);
  }

  /** Clicks the close button of `ui-dialog-header`. Throws when it is hidden (`hideClose`). */
  async clickCloseButton(): Promise<void> {
    const button = await this.locatorForOptional('.ui-dialog-header__close')();
    if (!button) throw Error('The dialog has no close button.');
    await button.click();
  }
}

import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessLoader,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import type { UiPopoverPosition } from '@vplans/ui-kit/popover';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiPopoverHarnessFilters extends BaseHarnessFilters {
  /** Text of the trigger. */
  text?: string | RegExp;
  /** `aria-label` of the trigger (e.g. the `label` of an icon button). */
  label?: string | RegExp;
}

const POSITIONS: readonly UiPopoverPosition[] = [
  'top',
  'bottom',
  'start',
  'end',
  'corner-top-start',
  'corner-top-end',
  'corner-bottom-start',
  'corner-bottom-end',
];

/**
 * Harness for a popover: the element with `[uiPopoverTriggerFor]`. The popover lives in an
 * overlay, found from the document root. `getHarness()` loads harnesses inside the open popover.
 */
export class UiPopoverHarness extends UiHarness {
  static hostSelector = '.ui-popover-trigger';

  static with<T extends UiPopoverHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiPopoverHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      );
  }

  /** Text of the trigger. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** `aria-label` of the trigger; `null` without one. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the popover by clicking the trigger, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.host()).click();
  }

  /** Closes the popover with Escape, unless it is closed. Focus returns to the trigger. */
  async close(): Promise<void> {
    const panel = await this.panel();
    if (panel) await panel.sendKeys(TestKey.ESCAPE);
  }

  /** Text of the open popover; `''` while it is closed. */
  async getContentText(): Promise<string> {
    const panel = await this.panel();
    return panel ? panel.text() : '';
  }

  /**
   * Side or corner of the trigger the open popover sits at, after a flip; `null` while it is
   * closed.
   */
  async getPosition(): Promise<UiPopoverPosition | null> {
    const panel = await this.panel();
    return panel ? uiModifier(panel, 'ui-popover--', POSITIONS) : null;
  }

  /** Harnesses are loaded from the open popover. Throws while it is closed. */
  protected override async getRootHarnessLoader(): Promise<HarnessLoader> {
    const id = await this.panelId();
    if (!id) throw Error('The popover is closed.');
    return this.documentRootLocatorFactory().harnessLoaderFor(`#${id}`);
  }

  /** `id` of the open popover (`aria-controls` of the trigger). */
  private async panelId(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-controls');
  }

  private async panel(): Promise<TestElement | null> {
    const id = await this.panelId();
    return id ? this.documentRootLocatorFactory().locatorForOptional(`#${id}`)() : null;
  }
}

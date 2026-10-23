import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import type { UiTooltipPosition } from '@vplans/ui-kit/tooltip';
import { UiHarness } from './harness';
import { uiModifier } from './modifier';

export interface UiTooltipHarnessFilters extends BaseHarnessFilters {
  /** Text of the trigger. */
  text?: string | RegExp;
  /** `aria-label` of the trigger (e.g. the `label` of an icon button). */
  label?: string | RegExp;
}

const POSITIONS: readonly UiTooltipPosition[] = [
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
 * Harness for a tooltip: the element with `uiTooltip`. The tooltip lives in an overlay, found
 * from the document root by its text. Two triggers with the same tooltip text cannot be told
 * apart: while one shows its tooltip, `isOpen()` of the other is `true` too.
 */
export class UiTooltipHarness extends UiHarness {
  static hostSelector = '.ui-tooltip-trigger';

  static with<T extends UiTooltipHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiTooltipHarnessFilters = {},
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
    return (await this.tooltip()) !== null;
  }

  /**
   * Shows the tooltip by focusing the trigger from the keyboard, which skips the show delay of a
   * hover. A disabled or empty tooltip stays hidden.
   */
  async show(): Promise<void> {
    if (await this.isOpen()) return;
    const host = await this.host();
    // Focus that follows a key press counts as keyboard focus.
    await host.blur();
    await host.dispatchEvent('keydown', { key: 'Tab' });
    await host.focus();
  }

  /** Hides the tooltip with Escape, unless it is hidden. */
  async hide(): Promise<void> {
    if (await this.isOpen()) await (await this.host()).sendKeys(TestKey.ESCAPE);
  }

  /** Text of the shown tooltip; `''` while it is hidden. */
  async getTooltipText(): Promise<string> {
    const tooltip = await this.tooltip();
    return tooltip ? tooltip.text() : '';
  }

  /**
   * Side or corner of the trigger the shown tooltip sits at, after a flip; `null` while it is
   * hidden.
   */
  async getPosition(): Promise<UiTooltipPosition | null> {
    const tooltip = await this.tooltip();
    return tooltip ? uiModifier(tooltip, 'ui-tooltip--', POSITIONS) : null;
  }

  /**
   * The shown tooltip of this trigger. The tooltip is not linked to its trigger in the DOM (no id
   * or `aria-*` points to it), so it is matched by text: its text is the trigger's description
   * (`aria-describedby`). Limitation: while two triggers with the same text both show their
   * tooltips, each harness may resolve the other's tooltip.
   */
  private async tooltip(): Promise<TestElement | null> {
    const ids =
      (await (await this.host()).getAttribute('aria-describedby'))?.split(/\s+/).filter(Boolean) ??
      [];
    if (!ids.length) return null;
    const root = this.documentRootLocatorFactory();
    const descriptions = await Promise.all(
      ids.map(async (id) => (await root.locatorForOptional(`[id="${id}"]`)())?.text()),
    );
    for (const tooltip of await root.locatorForAll('.ui-tooltip')()) {
      if (descriptions.includes(await tooltip.text())) return tooltip;
    }
    return null;
  }
}

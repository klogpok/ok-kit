import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiDateRangePickerHarnessFilters extends BaseHarnessFilters {
  /** The group label: the field label or the `aria-label`. */
  label?: string | RegExp;
  disabled?: boolean;
}

/** One of the two fields of `ui-date-range-picker`. */
export type UiDateRangeEdge = 'start' | 'end';

/** Months the harness pages through to find a day before it gives up. */
const MAX_PAGES = 240;

/** Local date as the calendar cells key it, e.g. "2026-09-05". */
function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Harness for `ui-date-range-picker`. The calendar and the presets live in an overlay; `pick()`
 * and `clickPreset()` open it when needed.
 */
export class UiDateRangePickerHarness extends UiHarness {
  static hostSelector = '.ui-date-range-picker';

  private readonly inputs = this.locatorForAll('.ui-date-range-picker__input');
  private readonly toggle = this.locatorFor('.ui-date-range-picker__toggle');
  private readonly panel = this.documentRootLocatorFactory().locatorForOptional(
    '.ui-date-range-picker__panel',
  );

  static with<T extends UiDateRangePickerHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiDateRangePickerHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  protected override focusTarget(): Promise<TestElement> {
    return this.field('start');
  }

  async getLabel(): Promise<string | null> {
    return this.labelledByText(await this.host());
  }

  /** The text of a field, in the locale format. */
  async getText(edge: UiDateRangeEdge): Promise<string> {
    return (await this.field(edge)).getProperty<string>('value');
  }

  /** Types the text into a field like a user, replacing the old text. Call `blur()` to commit. */
  async setText(edge: UiDateRangeEdge, text: string): Promise<void> {
    const input = await this.field(edge);
    await input.clear();
    if (text) await input.sendKeys(text);
  }

  /** Moves focus out of a field, which commits its text. */
  async blurField(edge: UiDateRangeEdge): Promise<void> {
    await (await this.field(edge)).blur();
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.toggle()).getAttribute('aria-expanded')) === 'true';
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.toggle()).click();
  }

  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.toggle()).click();
  }

  /**
   * Replaces the range: empties both fields, then picks the start and (optionally) the end in the
   * calendar, paging through the months to reach them. The dialog closes after the end.
   */
  async pick(start: Date, end?: Date): Promise<void> {
    // With only a start, the first pick in the calendar would set the end.
    await this.setText('start', '');
    await this.setText('end', '');
    await this.open();
    await this.clickDay(start);
    if (end) await this.clickDay(end);
  }

  /** Labels of the preset buttons. Opens the dialog. */
  async getPresets(): Promise<string[]> {
    await this.open();
    await this.requirePanel();
    const buttons = await this.presetButtons();
    return Promise.all(buttons.map(async (button) => (await button.text()).trim()));
  }

  /** Clicks the preset with this label. Opens the dialog. */
  async clickPreset(label: string | RegExp): Promise<void> {
    await this.open();
    await this.requirePanel();
    for (const button of await this.presetButtons()) {
      if (await HarnessPredicate.stringMatches(button.text(), label)) {
        await button.click();
        return;
      }
    }
    throw Error(`No preset matches ${String(label)}.`);
  }

  async isDisabled(): Promise<boolean> {
    return (await this.field('start')).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await this.field('start')).getProperty<boolean>('readOnly');
  }

  async isRequired(): Promise<boolean> {
    return (await (await this.field('start')).getAttribute('aria-required')) === 'true';
  }

  /** The error state of a field, or of either field. */
  async isInvalid(edge?: UiDateRangeEdge): Promise<boolean> {
    const edges: UiDateRangeEdge[] = edge ? [edge] : ['start', 'end'];
    for (const item of edges) {
      if ((await (await this.field(item)).getAttribute('aria-invalid')) === 'true') return true;
    }
    return false;
  }

  private async field(edge: UiDateRangeEdge): Promise<TestElement> {
    return (await this.inputs())[edge === 'start' ? 0 : 1];
  }

  private async requirePanel(): Promise<TestElement> {
    const panel = await this.panel();
    if (!panel) throw Error('The date range picker dialog is not open.');
    return panel;
  }

  private presetButtons(): Promise<TestElement[]> {
    return this.documentRootLocatorFactory().locatorForAll(
      '.ui-date-range-picker__panel .ui-date-range-picker__preset',
    )();
  }

  private async clickDay(date: Date): Promise<void> {
    const root = this.documentRootLocatorFactory();
    const key = dayKey(date);
    for (let page = 0; page < MAX_PAGES; page++) {
      const cell = await root.locatorForOptional(
        `.ui-date-range-picker__panel td[data-date="${key}"]`,
      )();
      if (cell) {
        await cell.click();
        return;
      }
      const shown = await root.locatorFor('.ui-date-range-picker__panel td[data-date]')();
      const first = (await shown.getAttribute('data-date')) ?? key;
      const label = key < first ? 'previousMonth' : 'nextMonth';
      const button = await root.locatorForOptional(
        `.ui-date-range-picker__panel .ui-calendar__header button[data-nav="${label}"]`,
      )();
      if (!button || (await button.getAttribute('aria-disabled')) === 'true') break;
      await button.click();
    }
    throw Error(`The calendar cannot show ${key}.`);
  }
}

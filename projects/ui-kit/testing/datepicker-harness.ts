import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiDatepickerHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the `label[for]` (e.g. from `ui-form-field`). */
  label?: string | RegExp;
  /** The text in the field, e.g. "25.9.2026". */
  value?: string | RegExp;
  disabled?: boolean;
}

/** Months the harness pages through to find a day before it gives up. */
const MAX_PAGES = 240;

/** Local date as the calendar cells key it, e.g. "2026-09-05". */
function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Harness for `ui-datepicker`. The calendar lives in an overlay; `pick()`, `clickToday()` and
 * `clickClear()` open it when needed.
 */
export class UiDatepickerHarness extends UiHarness {
  static hostSelector = '.ui-datepicker';

  private readonly input = this.locatorFor('.ui-datepicker__input');
  private readonly toggle = this.locatorFor('.ui-datepicker__toggle');
  private readonly panel =
    this.documentRootLocatorFactory().locatorForOptional('.ui-datepicker__panel');

  static with<T extends UiDatepickerHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiDatepickerHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption('value', options.value, (harness, value) =>
        HarnessPredicate.stringMatches(harness.getText(), value),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  protected override focusTarget(): Promise<TestElement> {
    return this.input();
  }

  async getLabel(): Promise<string | null> {
    return this.controlLabel(await this.input());
  }

  /** The text in the field, in the locale format. */
  async getText(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  /** Types the text like a user, replacing the old text. Call `blur()` to commit it. */
  async setText(text: string): Promise<void> {
    const input = await this.input();
    await input.clear();
    if (text) await input.sendKeys(text);
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

  /** Picks the day in the calendar, paging through the months to reach it. The dialog closes. */
  async pick(date: Date): Promise<void> {
    await this.open();
    await this.requirePanel();
    await this.clickDay(date);
  }

  /** Clicks "Today" in the calendar dialog. Opens the dialog. */
  async clickToday(): Promise<void> {
    await this.open();
    await this.requirePanel();
    await (
      await this.documentRootLocatorFactory().locatorFor(
        '.ui-datepicker__panel .ui-datepicker__today',
      )()
    ).click();
  }

  /** Clicks "Clear" in the calendar dialog, which empties the field. Opens the dialog. */
  async clickClear(): Promise<void> {
    await this.open();
    await this.requirePanel();
    // "Clear" is shown only while the field has text.
    const button = await this.documentRootLocatorFactory().locatorForOptional(
      '.ui-datepicker__panel .ui-datepicker__footer button:not(.ui-datepicker__today)',
    )();
    if (!button) throw Error('The date picker has nothing to clear.');
    await button.click();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('readOnly');
  }

  async isRequired(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-required')) === 'true';
  }

  /** The error state, including committed text that is not an allowed date. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  private async requirePanel(): Promise<TestElement> {
    const panel = await this.panel();
    if (!panel) throw Error('The date picker calendar is not open.');
    return panel;
  }

  private async clickDay(date: Date): Promise<void> {
    const root = this.documentRootLocatorFactory();
    const key = dayKey(date);
    for (let page = 0; page < MAX_PAGES; page++) {
      const cell = await root.locatorForOptional(`.ui-datepicker__panel td[data-date="${key}"]`)();
      if (cell) {
        await cell.click();
        return;
      }
      const shown = await root.locatorFor('.ui-datepicker__panel td[data-date]')();
      const first = (await shown.getAttribute('data-date')) ?? key;
      const label = key < first ? 'previousMonth' : 'nextMonth';
      const button = await root.locatorForOptional(
        `.ui-datepicker__panel .ui-calendar__header button[data-nav="${label}"]`,
      )();
      if (!button || (await button.getAttribute('aria-disabled')) === 'true') break;
      await button.click();
    }
    throw Error(`The calendar cannot show ${key}.`);
  }
}

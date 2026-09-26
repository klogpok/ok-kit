import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
  TestKey,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';
import { UiOptionHarness, UiOptionHarnessFilters } from './select-harness';

export interface UiAutocompleteHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the `label[for]` (e.g. from `ui-form-field`). */
  label?: string | RegExp;
  /** The text in the field. */
  value?: string | RegExp;
  disabled?: boolean;
}

/**
 * Harness for `ui-autocomplete`. The suggestions live in an overlay; type or open the list
 * before reading them.
 */
export class UiAutocompleteHarness extends UiHarness {
  static hostSelector = '.ui-autocomplete';

  private readonly input = this.locatorFor('.ui-autocomplete__input');

  static with<T extends UiAutocompleteHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiAutocompleteHarnessFilters = {},
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

  async getText(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  /** Types the text like a user, replacing the old text; the list opens with the matches. */
  async enterText(text: string): Promise<void> {
    const input = await this.input();
    await input.clear();
    if (text) await input.sendKeys(text);
  }

  async isOpen(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the list with ArrowDown, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.input()).sendKeys(TestKey.DOWN_ARROW);
  }

  /** Closes the list with Escape, unless it is closed. */
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.input()).sendKeys(TestKey.ESCAPE);
  }

  /** Suggestions of the open list; `[]` while it is closed. */
  async getOptions(filters: UiOptionHarnessFilters = {}): Promise<UiOptionHarness[]> {
    const panelId = await (await this.input()).getAttribute('aria-controls');
    if (!panelId) return [];
    return this.documentRootLocatorFactory().locatorForAll(
      UiOptionHarness.with({
        ...filters,
        ancestor: `#${panelId}`,
        selector: `${filters.selector ?? ''}:not([hidden])`,
      }),
    )();
  }

  /** Opens the list and clicks the first matching suggestion. Throws when none matches. */
  async selectOption(filters: UiOptionHarnessFilters = {}): Promise<void> {
    await this.open();
    const [option] = await this.getOptions(filters);
    if (!(option as UiOptionHarness | undefined)) {
      throw Error(`No option matches ${JSON.stringify(filters)}.`);
    }
    await option.click();
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

  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  async isLoading(): Promise<boolean> {
    return (await this.locatorForOptional('.ui-autocomplete__spinner')()) !== null;
  }
}

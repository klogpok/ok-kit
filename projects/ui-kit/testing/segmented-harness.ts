import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiSegmentHarnessFilters extends BaseHarnessFilters {
  /** The text of the segment, or the `aria-label` of an icon-only segment. */
  text?: string | RegExp;
  selected?: boolean;
  disabled?: boolean;
}

/** A segment of `ui-segmented`. Get it from `UiSegmentedHarness.getSegments()`. */
export class UiSegmentHarness extends UiHarness {
  static hostSelector = '.ui-segment';

  private readonly input = this.locatorFor('.ui-segment__input');

  static with<T extends UiSegmentHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiSegmentHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  /** The text of the segment, or the `aria-label` of an icon-only segment. */
  async getText(): Promise<string> {
    const text = (await (await this.locatorFor('.ui-segment__text')()).text()).trim();
    return text || ((await (await this.input()).getAttribute('aria-label')) ?? '');
  }

  async isSelected(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('checked');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  /** Clicks the segment; a readonly control keeps its value. */
  async select(): Promise<void> {
    await (await this.input()).click();
  }

  protected override focusTarget(): Promise<TestElement> {
    return this.input();
  }
}

export interface UiSegmentedHarnessFilters extends BaseHarnessFilters {
  /** The group label: the `aria-label`, or the label of `ui-form-field`. */
  label?: string | RegExp;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/** Harness for `ui-segmented`. */
export class UiSegmentedHarness extends UiHarness {
  static hostSelector = '.ui-segmented';

  static with<T extends UiSegmentedHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiSegmentedHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      )
      .addOption(
        'orientation',
        options.orientation,
        async (harness, orientation) => (await harness.getOrientation()) === orientation,
      );
  }

  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    return (await (await this.host()).hasClass('ui-segmented--vertical'))
      ? 'vertical'
      : 'horizontal';
  }

  /** The selected segment, or the first enabled one: where Tab lands. */
  protected override async focusTarget(): Promise<TestElement> {
    const inputs = await this.locatorForAll('.ui-segment__input')();
    for (const input of inputs) if (await input.getProperty<boolean>('checked')) return input;
    for (const input of inputs) if (!(await input.getProperty<boolean>('disabled'))) return input;
    return this.host();
  }

  async getLabel(): Promise<string | null> {
    const host = await this.host();
    return (await host.getAttribute('aria-label')) ?? this.labelledByText(host);
  }

  async getSegments(filters: UiSegmentHarnessFilters = {}): Promise<UiSegmentHarness[]> {
    return this.locatorForAll(UiSegmentHarness.with(filters))();
  }

  /** The text of the selected segment, or `null` when none is selected. */
  async getSelectedText(): Promise<string | null> {
    const selected = await this.locatorForOptional(UiSegmentHarness.with({ selected: true }))();
    return selected ? selected.getText() : null;
  }

  /** Clicks the first segment that matches the filters. */
  async select(filters: UiSegmentHarnessFilters): Promise<void> {
    const segment = (await this.getSegments(filters)).at(0);
    if (!segment) throw Error(`No segment matches ${JSON.stringify(filters)}.`);
    await segment.select();
  }

  /**
   * Presses an arrow key on the focused segment (or where Tab lands), as the user does to move
   * the selection. The control mirrors ←/→ in RTL.
   */
  async pressArrow(key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'): Promise<void> {
    let focused: TestElement | undefined;
    for (const input of await this.locatorForAll('.ui-segment__input')()) {
      if (await input.isFocused()) focused = input;
    }
    await (focused ?? (await this.focusTarget())).dispatchEvent('keydown', { key });
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  async isReadonly(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-readonly')) === 'true';
  }

  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }
}

export interface UiButtonToggleHarnessFilters extends BaseHarnessFilters {
  /** The text of the button, or its `aria-label`. */
  text?: string | RegExp;
  pressed?: boolean;
  disabled?: boolean;
}

/** A toggle of `ui-button-toggle-group`. Get it from `UiButtonToggleGroupHarness.getToggles()`. */
export class UiButtonToggleHarness extends UiHarness {
  static hostSelector = '.ui-button-toggle';

  static with<T extends UiButtonToggleHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiButtonToggleHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'pressed',
        options.pressed,
        async (harness, pressed) => (await harness.isPressed()) === pressed,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  /** The text of the button, or its `aria-label`. */
  async getText(): Promise<string> {
    const host = await this.host();
    const text = (await (await this.locatorFor('.ui-button-toggle__content')()).text()).trim();
    return text || ((await host.getAttribute('aria-label')) ?? '');
  }

  async isPressed(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-pressed')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Clicks the button; a readonly group keeps its value. */
  async toggle(): Promise<void> {
    await (await this.host()).click();
  }
}

export interface UiButtonToggleGroupHarnessFilters extends BaseHarnessFilters {
  /** The group label: the `aria-label`, or the label of `ui-form-field`. */
  label?: string | RegExp;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

/** Harness for `ui-button-toggle-group`. */
export class UiButtonToggleGroupHarness extends UiHarness {
  static hostSelector = '.ui-button-toggle-group';

  static with<T extends UiButtonToggleGroupHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiButtonToggleGroupHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      )
      .addOption(
        'orientation',
        options.orientation,
        async (harness, orientation) => (await harness.getOrientation()) === orientation,
      );
  }

  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    return (await (await this.host()).hasClass('ui-button-toggle-group--vertical'))
      ? 'vertical'
      : 'horizontal';
  }

  /** The first pressed button, or the first enabled one: where the field label sends focus. */
  protected override async focusTarget(): Promise<TestElement> {
    const buttons = await this.locatorForAll('.ui-button-toggle')();
    for (const button of buttons) {
      if ((await button.getAttribute('aria-pressed')) === 'true') return button;
    }
    for (const button of buttons) {
      if (!(await button.getProperty<boolean>('disabled'))) return button;
    }
    return this.host();
  }

  async getLabel(): Promise<string | null> {
    const host = await this.host();
    return (await host.getAttribute('aria-label')) ?? this.labelledByText(host);
  }

  async getToggles(filters: UiButtonToggleHarnessFilters = {}): Promise<UiButtonToggleHarness[]> {
    return this.locatorForAll(UiButtonToggleHarness.with(filters))();
  }

  /** The texts of the pressed buttons, in button order. */
  async getPressedTexts(): Promise<string[]> {
    const pressed = await this.getToggles({ pressed: true });
    return Promise.all(pressed.map((toggle) => toggle.getText()));
  }

  /** Clicks the first button that matches the filters. */
  async toggle(filters: UiButtonToggleHarnessFilters): Promise<void> {
    const toggle = (await this.getToggles(filters)).at(0);
    if (!toggle) throw Error(`No toggle button matches ${JSON.stringify(filters)}.`);
    await toggle.toggle();
  }

  /** Every button is disabled (the group or each button). */
  async isDisabled(): Promise<boolean> {
    const toggles = await this.getToggles();
    for (const toggle of toggles) if (!(await toggle.isDisabled())) return false;
    return true;
  }

  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }
}

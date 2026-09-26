import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiSliderHarnessFilters extends BaseHarnessFilters {
  /**
   * `ui-slider`: the `aria-label` or the text of the `label[for]`. `ui-range-slider`: the group
   * label (the field label or the `aria-label`).
   */
  label?: string | RegExp;
  /** Only `ui-range-slider` (`true`) or only `ui-slider` (`false`). */
  range?: boolean;
  disabled?: boolean;
}

/** Thumb of a range slider: `0` or `'start'` is the start, `1` or `'end'` the end. */
export type UiSliderThumb = 0 | 1 | 'start' | 'end';

/** Harness for `ui-slider` and `ui-range-slider`. */
export class UiSliderHarness extends UiHarness {
  static hostSelector = '.ui-slider';

  private readonly inputs = this.locatorForAll('.ui-slider__input');

  static with<T extends UiSliderHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiSliderHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'range',
        options.range,
        async (harness, range) => (await harness.isRange()) === range,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  protected override focusTarget(): Promise<TestElement> {
    return this.thumb(0);
  }

  async getLabel(): Promise<string | null> {
    return (await this.isRange())
      ? this.labelledByText(await this.host())
      : this.controlLabel(await this.thumb(0));
  }

  async isRange(): Promise<boolean> {
    return (await this.inputs()).length > 1;
  }

  /** The value of a thumb as shown (on the step grid, within the limits). */
  async getValue(thumb: UiSliderThumb = 0): Promise<number> {
    return Number(await (await this.thumb(thumb)).getProperty<string>('value'));
  }

  /** The shown values of all thumbs: one for `ui-slider`, `[start, end]` for a range. */
  async getValues(): Promise<number[]> {
    const inputs = await this.inputs();
    return Promise.all(
      inputs.map(async (input) => Number(await input.getProperty<string>('value'))),
    );
  }

  /** Sets the value of a thumb like a screen reader does. It is snapped and clamped. */
  async setValue(value: number, thumb: UiSliderThumb = 0): Promise<void> {
    const input = await this.thumb(thumb);
    await input.setInputValue(String(value));
    await input.dispatchEvent('input');
  }

  /** `aria-valuetext` of a thumb. */
  async getValueText(thumb: UiSliderThumb = 0): Promise<string | null> {
    return (await this.thumb(thumb)).getAttribute('aria-valuetext');
  }

  /** The lower limit of the scale. */
  async getMin(): Promise<number> {
    return Number(await (await this.thumb(0)).getProperty<string>('min'));
  }

  /** The upper limit of the scale (the last value on the step grid). */
  async getMax(): Promise<number> {
    const inputs = await this.inputs();
    return Number(await inputs[inputs.length - 1].getProperty<string>('max'));
  }

  async getStep(): Promise<number> {
    return Number(await (await this.thumb(0)).getProperty<string>('step'));
  }

  /** Presses ArrowUp (or PageUp with `large`) on a thumb. */
  async increment(thumb: UiSliderThumb = 0, large = false): Promise<void> {
    await this.press(thumb, large ? 'PageUp' : 'ArrowUp');
  }

  /** Presses ArrowDown (or PageDown with `large`) on a thumb. */
  async decrement(thumb: UiSliderThumb = 0, large = false): Promise<void> {
    await this.press(thumb, large ? 'PageDown' : 'ArrowDown');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.thumb(0)).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await (await this.thumb(0)).getAttribute('aria-readonly')) === 'true';
  }

  async isInvalid(): Promise<boolean> {
    return (await (await this.thumb(0)).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * `sendKeys()` would also write the key name into the native range input, so only the keydown
   * that the slider handles is sent.
   */
  private async press(thumb: UiSliderThumb, key: string): Promise<void> {
    const input = await this.thumb(thumb);
    await input.focus();
    await input.dispatchEvent('keydown', { key });
  }

  private async thumb(thumb: UiSliderThumb): Promise<TestElement> {
    const inputs = await this.inputs();
    const input = inputs.at(thumb === 'end' || thumb === 1 ? 1 : 0);
    if (!input) throw Error('The slider has no end thumb; use ui-range-slider.');
    return input;
  }
}

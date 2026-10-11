import {
  BaseHarnessFilters,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  HarnessQuery,
} from '@angular/cdk/testing';
import { UiAutocompleteHarness } from './autocomplete-harness';
import { UiCheckboxHarness } from './checkbox-harness';
import { UiChipInputHarness } from './chip-harness';
import { UiDateRangePickerHarness } from './date-range-picker-harness';
import { UiDatepickerHarness } from './datepicker-harness';
import { UiFileUploadHarness } from './file-upload-harness';
import { REQUIRED_MARKERS, UiHarness } from './harness';
import { UiInputHarness } from './input-harness';
import { UiNumberInputHarness } from './number-input-harness';
import { UiRadioGroupHarness } from './radio-harness';
import { UiButtonToggleGroupHarness, UiSegmentedHarness } from './segmented-harness';
import { UiSelectHarness } from './select-harness';
import { UiSliderHarness } from './slider-harness';
import { UiSwitchHarness } from './switch-harness';
import { UiTimeInputHarness } from './time-input-harness';
import { UiTreeHarness } from './tree-harness';

/** Harness of a kit control that `ui-form-field` can wrap. */
export type UiFormFieldControlHarness =
  | UiAutocompleteHarness
  | UiButtonToggleGroupHarness
  | UiCheckboxHarness
  | UiChipInputHarness
  | UiDatepickerHarness
  | UiDateRangePickerHarness
  | UiFileUploadHarness
  | UiInputHarness
  | UiNumberInputHarness
  | UiRadioGroupHarness
  | UiSegmentedHarness
  | UiSelectHarness
  | UiSliderHarness
  | UiSwitchHarness
  | UiTimeInputHarness
  | UiTreeHarness;

export interface UiFormFieldHarnessFilters extends BaseHarnessFilters {
  /** The label text, without the required marker. */
  label?: string | RegExp;
  /** The field shows its error state. */
  invalid?: boolean;
}

/** Harness for `ui-form-field`: its label, hint and errors, and the harness of its control. */
export class UiFormFieldHarness extends UiHarness {
  static hostSelector = '.ui-form-field';

  private readonly label = this.locatorForOptional('.ui-form-field__label');
  private readonly hint = this.locatorFor('.ui-form-field__hint');
  private readonly errors = this.locatorForAll('.ui-form-field__error .ui-error');

  static with<T extends UiFormFieldHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiFormFieldHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'invalid',
        options.invalid,
        async (harness, invalid) => (await harness.isInvalid()) === invalid,
      );
  }

  /** The label text without the required marker, or `null` for a field without a label. */
  async getLabel(): Promise<string | null> {
    const label = await this.label();
    return label ? label.text({ exclude: REQUIRED_MARKERS }) : null;
  }

  /** The label shows the required marker. */
  async isRequired(): Promise<boolean> {
    return !!(await this.locatorForOptional(REQUIRED_MARKERS)());
  }

  /** The hint (`hint` and projected `ui-hint`), or `null` while there is none or an error hides it. */
  async getHint(): Promise<string | null> {
    const hint = await this.hint();
    if (await hint.getProperty<boolean>('hidden')) return null;
    return (await hint.text()).trim() || null;
  }

  /** The error messages shown now: projected `ui-error`s, or the messages of the forms layer. */
  async getErrors(): Promise<string[]> {
    const errors = await this.errors();
    return Promise.all(errors.map(async (error) => (await error.text()).trim()));
  }

  /** The control is in its error state (invalid and touched with forms). */
  async isInvalid(): Promise<boolean> {
    return (await this.host()).hasClass('ui-form-field--invalid');
  }

  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('ui-form-field--disabled');
  }

  /**
   * The harness of the control in the field: the first one that matches `query`, or, without a
   * query, the first kit control. `null` when there is none.
   */
  async getControl(): Promise<UiFormFieldControlHarness | null>;
  async getControl<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T | null>;
  async getControl<T extends ComponentHarness>(
    query?: HarnessQuery<T>,
  ): Promise<T | UiFormFieldControlHarness | null> {
    if (query) return this.locatorForOptional(query)();
    // Results come in document order, so a control wins over the parts inside it.
    return this.locatorForOptional(
      UiAutocompleteHarness,
      UiButtonToggleGroupHarness,
      UiCheckboxHarness,
      UiChipInputHarness,
      UiDatepickerHarness,
      UiDateRangePickerHarness,
      UiFileUploadHarness,
      UiInputHarness,
      UiNumberInputHarness,
      UiRadioGroupHarness,
      UiSegmentedHarness,
      UiSelectHarness,
      UiSliderHarness,
      UiSwitchHarness,
      UiTimeInputHarness,
      UiTreeHarness,
    )();
  }
}

import {
  BaseHarnessFilters,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiStepHarnessFilters extends BaseHarnessFilters {
  label?: string | RegExp;
  /** The current step. */
  selected?: boolean;
  done?: boolean;
  error?: boolean;
}

/** A step of `ui-stepper`, as its button shows it. Get it from `UiStepperHarness.getSteps()`. */
export class UiStepHarness extends ComponentHarness {
  static hostSelector = '.ui-stepper__step';

  private readonly header = this.locatorFor('.ui-stepper__header');

  static with<T extends UiStepHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiStepHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      )
      .addOption('done', options.done, async (harness, done) => (await harness.isDone()) === done)
      .addOption(
        'error',
        options.error,
        async (harness, error) => (await harness.hasError()) === error,
      );
  }

  async getLabel(): Promise<string> {
    return (await this.locatorFor('.ui-stepper__label')()).text();
  }

  /** The text of a string `error`, or `''`. */
  async getErrorText(): Promise<string> {
    const note = await this.locatorForOptional('.ui-stepper__note--error')();
    return note ? note.text() : '';
  }

  async isSelected(): Promise<boolean> {
    return (await (await this.header()).getAttribute('aria-current')) === 'step';
  }

  async isDone(): Promise<boolean> {
    return (await this.host()).hasClass('ui-stepper__step--done');
  }

  async hasError(): Promise<boolean> {
    return (await this.host()).hasClass('ui-stepper__step--error');
  }

  async isOptional(): Promise<boolean> {
    const note = await this.locatorForOptional('.ui-stepper__note:not(.ui-stepper__note--error)')();
    return !!note;
  }

  /** The step cannot be reached now (a linear stepper with an invalid step before it). */
  async isDisabled(): Promise<boolean> {
    return (await this.header()).getProperty<boolean>('disabled');
  }

  /** Clicks the step button; a linear stepper may refuse to move. */
  async select(): Promise<void> {
    await (await this.header()).click();
  }
}

export interface UiStepperHarnessFilters extends BaseHarnessFilters {
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Harness for `ui-stepper`. `getHarness()` finds harnesses in the content of the current step,
 * e.g. its fields and its Next button.
 */
export class UiStepperHarness extends UiHarness {
  static hostSelector = '.ui-stepper';

  static with<T extends UiStepperHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiStepperHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'orientation',
      options.orientation,
      async (harness, orientation) => (await harness.getOrientation()) === orientation,
    );
  }

  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    return (await (await this.host()).hasClass('ui-stepper--vertical')) ? 'vertical' : 'horizontal';
  }

  async getSteps(filters: UiStepHarnessFilters = {}): Promise<UiStepHarness[]> {
    return this.locatorForAll(UiStepHarness.with(filters))();
  }

  async getSelectedStep(): Promise<UiStepHarness> {
    return this.locatorFor(UiStepHarness.with({ selected: true }))();
  }

  /** Clicks the first step that matches the filters. */
  async selectStep(filters: UiStepHarnessFilters): Promise<void> {
    const step = (await this.getSteps(filters)).at(0);
    if (!step) throw Error(`No step matches ${JSON.stringify(filters)}.`);
    await step.select();
  }
}

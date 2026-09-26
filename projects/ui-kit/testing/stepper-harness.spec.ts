import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@vplans/ui-kit/button';
import { UiInput } from '@vplans/ui-kit/input';
import { UiStep, UiStepper, UiStepperNext } from '@vplans/ui-kit/stepper';
import { UiButtonHarness } from './button-harness';
import { UiInputHarness } from './input-harness';
import { UiStepperHarness } from './stepper-harness';

@Component({
  imports: [ReactiveFormsModule, UiButton, UiInput, UiStepper, UiStep, UiStepperNext],
  template: `
    <ui-stepper linear>
      <ui-step label="Details" [control]="name">
        <input ui-input aria-label="Name" [formControl]="name" />
        <button ui-button uiStepperNext>Next</button>
      </ui-step>
      <ui-step label="Files" optional><p>Files</p></ui-step>
      <ui-step label="Review" error="Missing signature"><p>Review</p></ui-step>
    </ui-stepper>
    <ui-stepper orientation="vertical">
      <ui-step label="One"><p>One</p></ui-step>
    </ui-stepper>
  `,
})
class Host {
  readonly name = new FormControl('', Validators.required);
}

describe('UiStepperHarness', () => {
  let loader: HarnessLoader;

  beforeEach(() => {
    loader = TestbedHarnessEnvironment.loader(TestBed.createComponent(Host));
  });

  it('finds steppers by orientation and reads their steps', async () => {
    expect(await loader.getAllHarnesses(UiStepperHarness)).toHaveLength(2);
    const vertical = await loader.getHarness(UiStepperHarness.with({ orientation: 'vertical' }));
    expect(await (await vertical.getSelectedStep()).getLabel()).toBe('One');

    const stepper = await loader.getHarness(UiStepperHarness.with({ orientation: 'horizontal' }));
    const steps = await stepper.getSteps();
    expect(await Promise.all(steps.map((step) => step.getLabel()))).toEqual([
      'Details',
      'Files',
      'Review',
    ]);
    expect(await steps[1].isOptional()).toBe(true);
    expect(await steps[0].isOptional()).toBe(false);
    expect(await steps[2].hasError()).toBe(true);
    expect(await steps[2].getErrorText()).toBe('Missing signature');
    expect(await steps[0].getErrorText()).toBe('');
    expect(await steps[1].isDisabled()).toBe(true);
    expect(await stepper.getSteps({ error: true })).toHaveLength(1);
  });

  it('moves through the steps and loads harnesses of the current content', async () => {
    const stepper = await loader.getHarness(UiStepperHarness.with({ orientation: 'horizontal' }));
    const next = await stepper.getHarness(UiButtonHarness.with({ text: 'Next' }));
    await next.click();
    expect(await (await stepper.getSelectedStep()).getLabel()).toBe('Details');
    expect(await (await stepper.getSelectedStep()).hasError()).toBe(true);

    await (await stepper.getHarness(UiInputHarness.with({ label: 'Name' }))).setValue('Dana');
    await stepper.selectStep({ label: 'Review' });
    expect(await (await stepper.getSelectedStep()).getLabel()).toBe('Review');
    expect(await stepper.getSteps({ done: true })).toHaveLength(1);
    await expect(stepper.selectStep({ label: 'Payment' })).rejects.toThrow('No step matches');
  });
});

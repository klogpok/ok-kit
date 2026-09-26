import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiNumberInput } from '@vplans/ui-kit/number-input';
import { UiNumberInputHarness } from './number-input-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiNumberInput],
  template: `
    <ui-form-field label="Units">
      <ui-number-input min="0" max="100" [formControl]="units" />
    </ui-form-field>
    <ui-number-input aria-label="Locked" disabled [value]="3" />
    <ui-number-input aria-label="Code" readonly [steppers]="false" [value]="1234" />
  `,
})
class Host {
  readonly units = new FormControl<number | null>(10, Validators.required);
}

describe('UiNumberInputHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds number inputs by label, text and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiNumberInputHarness)).toHaveLength(3);
    expect(
      await loader.getAllHarnesses(UiNumberInputHarness.with({ value: '1,234' })),
    ).toHaveLength(1);
    expect(
      await loader.getAllHarnesses(UiNumberInputHarness.with({ disabled: true })),
    ).toHaveLength(1);
    const units = await loader.getHarness(UiNumberInputHarness.with({ label: 'Units' }));
    expect(await units.getValue()).toBe(10);
    expect(await units.getMin()).toBe(0);
    expect(await units.getMax()).toBe(100);
    expect(await units.isRequired()).toBe(true);
  });

  it('types, steps and clicks the steppers', async () => {
    const units = await loader.getHarness(UiNumberInputHarness.with({ label: 'Units' }));
    await units.setText('42');
    expect(host.units.value).toBe(42);
    await units.increment();
    expect(host.units.value).toBe(43);
    await units.decrement(true);
    expect(host.units.value).toBe(33);
    await units.clickStepper('up');
    expect(await units.getText()).toBe('34');
    await units.clickStepper('down');
    expect(host.units.value).toBe(33);
  });

  it('reports invalid text after blur', async () => {
    const units = await loader.getHarness(UiNumberInputHarness.with({ label: 'Units' }));
    await units.setText('abc');
    await units.blur();
    expect(await units.isInvalid()).toBe(true);
    expect(await units.getValue()).toBeNull();
  });

  it('reads the disabled and readonly states', async () => {
    const locked = await loader.getHarness(UiNumberInputHarness.with({ label: 'Locked' }));
    expect(await locked.isDisabled()).toBe(true);
    const code = await loader.getHarness(UiNumberInputHarness.with({ label: 'Code' }));
    expect(await code.isReadonly()).toBe(true);
    await expect(code.clickStepper('up')).rejects.toThrow('no stepper buttons');
  });
});

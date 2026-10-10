import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiRadio, UiRadioGroup } from '@vplans/ui-kit/radio';
import { UiRadioGroupHarness, UiRadioHarness } from './radio-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiRadio, UiRadioGroup],
  template: `
    <ui-form-field label="Delivery">
      <ui-radio-group name="delivery" [formControl]="delivery">
        <ui-radio value="pickup">Pickup</ui-radio>
        <ui-radio value="courier">Courier</ui-radio>
        <ui-radio value="drone" disabled>Drone</ui-radio>
      </ui-radio-group>
    </ui-form-field>
    <ui-radio-group aria-label="Size" orientation="horizontal" [(value)]="size">
      <ui-radio value="sm" aria-label="Small">S</ui-radio>
      <ui-radio value="lg" aria-label="Large">L</ui-radio>
    </ui-radio-group>
    <ui-radio-group aria-label="Plan" value="free" readonly>
      <ui-radio value="free">Free</ui-radio>
      <ui-radio value="pro">Pro</ui-radio>
    </ui-radio-group>
    <ui-radio-group aria-label="Region" disabled>
      <ui-radio value="north">North</ui-radio>
    </ui-radio-group>
  `,
})
class Host {
  readonly delivery = new FormControl<string | null>(null, Validators.required);
  readonly size = signal<string | null>('sm');
}

describe('UiRadioGroupHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds groups by label, name, disabled state and orientation', async () => {
    expect(await loader.getAllHarnesses(UiRadioGroupHarness)).toHaveLength(4);
    const delivery = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Delivery' }));
    expect(await delivery.getName()).toBe('delivery');
    expect(
      await loader.getAllHarnesses(UiRadioGroupHarness.with({ name: 'delivery' })),
    ).toHaveLength(1);
    const region = await loader.getHarness(UiRadioGroupHarness.with({ disabled: true }));
    expect(await region.getLabel()).toBe('Region');
    const size = await loader.getHarness(UiRadioGroupHarness.with({ orientation: 'horizontal' }));
    expect(await size.getLabel()).toBe('Size');
    expect(await delivery.getOrientation()).toBe('vertical');
  });

  it('lists and filters the radios', async () => {
    const delivery = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Delivery' }));
    const radios = await delivery.getRadios();
    expect(await Promise.all(radios.map((radio) => radio.getLabel()))).toEqual([
      'Pickup',
      'Courier',
      'Drone',
    ]);
    expect(await delivery.getRadios({ disabled: true })).toHaveLength(1);
    expect(await delivery.getCheckedLabel()).toBeNull();
    const size = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Size' }));
    // A radio with an `aria-label` is found by it, not by its short visible text.
    expect(await size.getCheckedLabel()).toBe('Small');
  });

  it('checks a radio through the form control and the two-way value', async () => {
    const delivery = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Delivery' }));
    await delivery.check({ label: 'Courier' });
    expect(host.delivery.value).toBe('courier');
    expect(await delivery.getCheckedLabel()).toBe('Courier');
    await delivery.check({ label: 'Drone' });
    expect(host.delivery.value).toBe('courier');
    await expect(delivery.check({ label: 'Plane' })).rejects.toThrow(
      'No radio matches {"label":"Plane"}.',
    );

    const size = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Size' }));
    await size.check({ label: 'Large' });
    expect(host.size()).toBe('lg');
  });

  it('reads the states and keeps a readonly selection', async () => {
    const delivery = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Delivery' }));
    expect(await delivery.isRequired()).toBe(true);
    expect(await delivery.isDisabled()).toBe(false);
    expect(await delivery.isInvalid()).toBe(false);
    await delivery.focus();
    expect(await delivery.isFocused()).toBe(true);
    const pickup = await delivery.getRadios({ label: 'Pickup' });
    expect(await pickup[0].isFocused()).toBe(true);
    await delivery.blur();
    expect(await delivery.isInvalid()).toBe(true);

    const plan = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Plan' }));
    expect(await plan.isReadonly()).toBe(true);
    await plan.check({ label: 'Pro' });
    expect(await plan.getCheckedLabel()).toBe('Free');

    const region = await loader.getHarness(UiRadioGroupHarness.with({ label: 'Region' }));
    const [north] = await region.getRadios();
    expect(await north.isDisabled()).toBe(true);
  });
});

describe('UiRadioHarness', () => {
  it('finds radios anywhere by label and checked state', async () => {
    const fixture = TestBed.createComponent(Host);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(UiRadioHarness)).toHaveLength(8);
    const courier = await loader.getHarness(UiRadioHarness.with({ label: 'Courier' }));
    expect(await courier.isChecked()).toBe(false);
    await courier.check();
    expect(await courier.isChecked()).toBe(true);
    expect(fixture.componentInstance.delivery.value).toBe('courier');
    expect(await loader.getAllHarnesses(UiRadioHarness.with({ checked: true }))).toHaveLength(3);
  });
});

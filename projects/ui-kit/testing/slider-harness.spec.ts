import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiRangeSlider, UiSlider, UiSliderRange } from '@vplans/ui-kit/slider';
import { UiSliderHarness } from './slider-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiSlider, UiRangeSlider],
  template: `
    <ui-form-field label="Rooms" required>
      <ui-slider min="1" max="8" [formControl]="rooms" />
    </ui-form-field>
    <ui-form-field label="Price">
      <ui-range-slider max="5000" step="100" [valueText]="price" [(value)]="range" />
    </ui-form-field>
    <ui-slider aria-label="Locked" disabled readonly invalid [value]="3" />
  `,
})
class Host {
  readonly rooms = new FormControl<number | null>(3);
  readonly range = signal<UiSliderRange | null>([1000, 3000]);
  readonly price = (value: number) => `${value} ₪`;
}

describe('UiSliderHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds sliders by label, kind and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiSliderHarness)).toHaveLength(3);
    expect(await loader.getAllHarnesses(UiSliderHarness.with({ range: true }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiSliderHarness.with({ disabled: true }))).toHaveLength(1);
    const rooms = await loader.getHarness(UiSliderHarness.with({ label: 'Rooms' }));
    expect(await rooms.getValue()).toBe(3);
    expect([await rooms.getMin(), await rooms.getMax(), await rooms.getStep()]).toEqual([1, 8, 1]);
    const price = await loader.getHarness(UiSliderHarness.with({ label: 'Price' }));
    expect(await price.isRange()).toBe(true);
    expect(await price.getValues()).toEqual([1000, 3000]);
    expect(await price.getMax()).toBe(5000);
    expect(await price.getValueText('end')).toBe('3000 ₪');
  });

  it('sets values and steps with the keys', async () => {
    const rooms = await loader.getHarness(UiSliderHarness.with({ label: 'Rooms' }));
    await rooms.setValue(6);
    expect(host.rooms.value).toBe(6);
    await rooms.increment();
    expect(host.rooms.value).toBe(7);
    await rooms.decrement(0, true);
    expect(host.rooms.value).toBe(1);

    const price = await loader.getHarness(UiSliderHarness.with({ range: true }));
    await price.setValue(4000, 'end');
    await price.increment('start', true);
    expect(host.range()).toEqual([2000, 4000]);
    await price.setValue(4800, 'start');
    expect(host.range()).toEqual([4000, 4000]);
    await price.decrement(1);
    expect(await price.getValues()).toEqual([4000, 4000]);
  });

  it('reads the disabled, readonly and invalid states', async () => {
    const locked = await loader.getHarness(UiSliderHarness.with({ label: 'Locked' }));
    expect(await locked.isDisabled()).toBe(true);
    expect(await locked.isReadonly()).toBe(true);
    expect(await locked.isInvalid()).toBe(true);
    await expect(locked.getValue('end')).rejects.toThrow('no end thumb');
    const rooms = await loader.getHarness(UiSliderHarness.with({ label: 'Rooms' }));
    await rooms.focus();
    expect(await rooms.isFocused()).toBe(true);
  });
});

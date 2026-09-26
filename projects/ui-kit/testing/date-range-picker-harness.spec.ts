import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiDateRange, UiDateRangePicker, UiDateRangePreset } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiDateRangePickerHarness } from './date-range-picker-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiDateRangePicker],
  template: `
    <ui-form-field label="Stay">
      <ui-date-range-picker [formControl]="stay" [presets]="presets" [maxDate]="max" />
    </ui-form-field>
    <ui-date-range-picker aria-label="Locked" disabled />
  `,
})
class Host {
  readonly stay = new FormControl<UiDateRange | null>(
    { start: new Date(2026, 8, 20), end: null },
    Validators.required,
  );
  readonly max = new Date(2027, 0, 31);
  readonly presets: UiDateRangePreset[] = [
    { label: 'Next week', range: { start: new Date(2026, 8, 27), end: new Date(2026, 9, 3) } },
  ];
}

describe('UiDateRangePickerHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds pickers by label and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiDateRangePickerHarness)).toHaveLength(2);
    const locked = await loader.getHarness(UiDateRangePickerHarness.with({ disabled: true }));
    expect(await locked.getLabel()).toBe('Locked');
    const stay = await loader.getHarness(UiDateRangePickerHarness.with({ label: 'Stay' }));
    expect(await stay.getText('start')).toBe('20.9.2026');
    expect(await stay.getText('end')).toBe('');
    expect(await stay.isRequired()).toBe(true);
    expect(await stay.isReadonly()).toBe(false);
  });

  it('types into the fields and reports invalid text', async () => {
    const stay = await loader.getHarness(UiDateRangePickerHarness.with({ label: 'Stay' }));
    await stay.setText('end', '25.9.2026');
    expect(host.stay.value).toEqual({ start: new Date(2026, 8, 20), end: new Date(2026, 8, 25) });
    await stay.setText('end', 'abc');
    await stay.blurField('end');
    expect(await stay.isInvalid('end')).toBe(true);
    expect(await stay.isInvalid('start')).toBe(false);
    expect(await stay.isInvalid()).toBe(true);
    await stay.focus();
    expect(await stay.isFocused()).toBe(true);
  });

  it('picks days in other months and closes', async () => {
    const stay = await loader.getHarness(UiDateRangePickerHarness.with({ label: 'Stay' }));
    await stay.pick(new Date(2026, 10, 5), new Date(2027, 0, 2));
    expect(host.stay.value).toEqual({ start: new Date(2026, 10, 5), end: new Date(2027, 0, 2) });
    expect(await stay.isOpen()).toBe(false);
    await stay.pick(new Date(2026, 5, 1));
    expect(host.stay.value).toEqual({ start: new Date(2026, 5, 1), end: null });
    expect(await stay.isOpen()).toBe(true);
    await stay.close();
    expect(await stay.isOpen()).toBe(false);
  });

  it('fails for a day beyond the limits', async () => {
    const stay = await loader.getHarness(UiDateRangePickerHarness.with({ label: 'Stay' }));
    await expect(stay.pick(new Date(2027, 2, 1))).rejects.toThrow('cannot show 2027-03-01');
  });

  it('lists and clicks presets', async () => {
    const stay = await loader.getHarness(UiDateRangePickerHarness.with({ label: 'Stay' }));
    expect(await stay.getPresets()).toEqual(['Next week']);
    await stay.clickPreset('Next week');
    expect(host.stay.value).toEqual({ start: new Date(2026, 8, 27), end: new Date(2026, 9, 3) });
    await expect(stay.clickPreset('Tomorrow')).rejects.toThrow('No preset matches Tomorrow.');
  });
});

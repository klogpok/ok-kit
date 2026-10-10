import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiDatepicker } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiDatepickerHarness } from './datepicker-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiDatepicker],
  template: `
    <ui-form-field label="Signing date">
      <ui-datepicker [formControl]="signing" [max]="max" />
    </ui-form-field>
    <ui-datepicker aria-label="Locked" disabled />
    <ui-datepicker aria-label="Archived" readonly />
  `,
})
class Host {
  readonly signing = new FormControl<Date | null>(new Date(2026, 8, 20), Validators.required);
  readonly max = new Date(2027, 0, 31);
}

describe('UiDatepickerHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 25, 12));
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => vi.useRealTimers());

  it('finds pickers by label, text and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiDatepickerHarness)).toHaveLength(3);
    const locked = await loader.getHarness(UiDatepickerHarness.with({ disabled: true }));
    expect(await locked.getLabel()).toBe('Locked');
    const signing = await loader.getHarness(UiDatepickerHarness.with({ label: 'Signing date' }));
    expect(await signing.getText()).toBe('20.9.2026');
    expect(await loader.getAllHarnesses(UiDatepickerHarness.with({ value: /2026/ }))).toHaveLength(
      1,
    );
    expect(await signing.isRequired()).toBe(true);
    expect(await signing.isReadonly()).toBe(false);
    const archived = await loader.getHarness(UiDatepickerHarness.with({ label: 'Archived' }));
    expect(await archived.isReadonly()).toBe(true);
    expect(await archived.isDisabled()).toBe(false);
  });

  it('types a date and reports text that is not a date', async () => {
    const signing = await loader.getHarness(UiDatepickerHarness.with({ label: 'Signing date' }));
    await signing.setText('25.9.2026');
    expect(host.signing.value).toEqual(new Date(2026, 8, 25));
    await signing.setText('abc');
    expect(await signing.isInvalid()).toBe(false);
    await signing.blur();
    expect(host.signing.value).toBeNull();
    expect(await signing.isInvalid()).toBe(true);
    await signing.setText('');
    await signing.focus();
    expect(await signing.isFocused()).toBe(true);
  });

  it('opens the calendar and picks a day in another month', async () => {
    const signing = await loader.getHarness(UiDatepickerHarness.with({ label: 'Signing date' }));
    await signing.open();
    expect(await signing.isOpen()).toBe(true);
    await signing.close();
    expect(await signing.isOpen()).toBe(false);
    await signing.pick(new Date(2026, 11, 3));
    expect(host.signing.value).toEqual(new Date(2026, 11, 3));
    expect(await signing.getText()).toBe('3.12.2026');
    expect(await signing.isOpen()).toBe(false);
    await signing.pick(new Date(2026, 5, 1));
    expect(host.signing.value).toEqual(new Date(2026, 5, 1));
  });

  it('fails for a day beyond the limits', async () => {
    const signing = await loader.getHarness(UiDatepickerHarness.with({ label: 'Signing date' }));
    await expect(signing.pick(new Date(2027, 2, 1))).rejects.toThrow('cannot show 2027-03-01');
  });

  it('picks today and clears from the calendar', async () => {
    const signing = await loader.getHarness(UiDatepickerHarness.with({ label: 'Signing date' }));
    await signing.clickToday();
    expect(host.signing.value).toEqual(new Date(2026, 8, 25));
    await signing.clickClear();
    expect(host.signing.value).toBeNull();
    expect(await signing.getText()).toBe('');
    expect(await signing.isOpen()).toBe(false);
  });

  it('does not open a disabled picker', async () => {
    const locked = await loader.getHarness(UiDatepickerHarness.with({ label: 'Locked' }));
    await expect(locked.pick(new Date(2026, 8, 1))).rejects.toThrow('calendar is not open');
  });
});

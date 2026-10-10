import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiDatepicker } from '@vplans/ui-kit/datepicker';
import { UiError, UiFormField, UiHint } from '@vplans/ui-kit/form-field';
import { UiInput } from '@vplans/ui-kit/input';
import { UiRadio, UiRadioGroup } from '@vplans/ui-kit/radio';
import { UiSwitch } from '@vplans/ui-kit/switch';
import { UiDatepickerHarness } from './datepicker-harness';
import { UiFormFieldHarness } from './form-field-harness';
import { UiInputHarness } from './input-harness';
import { UiRadioGroupHarness } from './radio-harness';
import { UiSwitchHarness } from './switch-harness';

@Component({
  imports: [
    ReactiveFormsModule,
    UiDatepicker,
    UiError,
    UiFormField,
    UiHint,
    UiInput,
    UiRadio,
    UiRadioGroup,
    UiSwitch,
  ],
  template: `
    <ui-form-field label="Email" hint="We never share it">
      <input ui-input type="email" [formControl]="email" />
      @if (email.hasError('email')) {
        <ui-error>Enter a valid email</ui-error>
      }
      @if (email.hasError('required')) {
        <ui-error>Email is required</ui-error>
      }
    </ui-form-field>
    <ui-form-field label="Delivery">
      <ui-radio-group [formControl]="delivery">
        <ui-radio value="pickup">Pickup</ui-radio>
      </ui-radio-group>
      <ui-hint>Pick one</ui-hint>
    </ui-form-field>
    <ui-form-field label="Signing date" [required]="true">
      <ui-datepicker [formControl]="signing" />
    </ui-form-field>
    <ui-form-field>
      <ui-switch>Notifications</ui-switch>
    </ui-form-field>
  `,
})
class Host {
  readonly email = new FormControl('', [Validators.required, Validators.email]);
  readonly delivery = new FormControl({ value: null, disabled: true });
  readonly signing = new FormControl<Date | null>(null);
}

describe('UiFormFieldHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds fields by label and error state', async () => {
    expect(await loader.getAllHarnesses(UiFormFieldHarness)).toHaveLength(4);
    const email = await loader.getHarness(UiFormFieldHarness.with({ label: 'Email' }));
    expect(await email.getLabel()).toBe('Email');
    expect(await loader.getAllHarnesses(UiFormFieldHarness.with({ invalid: true }))).toHaveLength(
      0,
    );
    await (await email.getControl(UiInputHarness))!.blur();
    const invalid = await loader.getHarness(UiFormFieldHarness.with({ invalid: true }));
    expect(await invalid.getLabel()).toBe('Email');
  });

  it('reads the label without the required marker and the required state', async () => {
    const email = await loader.getHarness(UiFormFieldHarness.with({ label: 'Email' }));
    expect(await email.isRequired()).toBe(true);
    // Marked required on the field only: the marker text is not part of the label.
    const signing = await loader.getHarness(UiFormFieldHarness.with({ label: 'Signing date' }));
    expect(await signing.getLabel()).toBe('Signing date');
    expect(await signing.isRequired()).toBe(true);
    const delivery = await loader.getHarness(UiFormFieldHarness.with({ label: 'Delivery' }));
    expect(await delivery.isRequired()).toBe(false);
    const unlabelled = (await loader.getAllHarnesses(UiFormFieldHarness))[3];
    expect(await unlabelled.getLabel()).toBeNull();
  });

  it('reads the hint until an error replaces it', async () => {
    const email = await loader.getHarness(UiFormFieldHarness.with({ label: 'Email' }));
    expect(await email.getHint()).toBe('We never share it');
    expect(await email.getErrors()).toEqual([]);
    const input = (await email.getControl(UiInputHarness))!;
    await input.blur();
    expect(await email.isInvalid()).toBe(true);
    expect(await email.getErrors()).toEqual(['Email is required']);
    expect(await email.getHint()).toBeNull();
    await input.setValue('dana');
    expect(await email.getErrors()).toEqual(['Enter a valid email']);
    await input.setValue('dana@vplans.com');
    expect(host.email.valid).toBe(true);
    expect(await email.isInvalid()).toBe(false);
    expect(await email.getHint()).toBe('We never share it');

    const delivery = await loader.getHarness(UiFormFieldHarness.with({ label: 'Delivery' }));
    expect(await delivery.getHint()).toBe('Pick one');
  });

  it('reads the disabled state of the control', async () => {
    const delivery = await loader.getHarness(UiFormFieldHarness.with({ label: 'Delivery' }));
    expect(await delivery.isDisabled()).toBe(true);
    const email = await loader.getHarness(UiFormFieldHarness.with({ label: 'Email' }));
    expect(await email.isDisabled()).toBe(false);
  });

  it('returns the harness of its control', async () => {
    const email = await loader.getHarness(UiFormFieldHarness.with({ label: 'Email' }));
    expect(await email.getControl()).toBeInstanceOf(UiInputHarness);
    expect(await email.getControl(UiSwitchHarness)).toBeNull();
    const delivery = await loader.getHarness(UiFormFieldHarness.with({ label: 'Delivery' }));
    expect(await delivery.getControl()).toBeInstanceOf(UiRadioGroupHarness);
    const signing = await loader.getHarness(UiFormFieldHarness.with({ label: 'Signing date' }));
    const datepicker = await signing.getControl(UiDatepickerHarness);
    await datepicker!.setText('25.9.2026');
    expect(host.signing.value).toEqual(new Date(2026, 8, 25));
    const unlabelled = (await loader.getAllHarnesses(UiFormFieldHarness))[3];
    const notifications = await unlabelled.getControl(UiSwitchHarness.with({ checked: false }));
    expect(await notifications!.getLabel()).toBe('Notifications');
  });
});

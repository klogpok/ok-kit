import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiSwitch } from '@vplans/ui-kit/switch';
import { UiSwitchHarness } from './switch-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiSwitch],
  template: `
    <ui-switch name="consent" [formControl]="consent">Share usage data</ui-switch>
    <ui-switch aria-label="Dark mode" [(checked)]="dark" />
    <ui-switch [disabled]="true" [checked]="true">Email notifications</ui-switch>
    <ui-switch [readonly]="true">Auto-save</ui-switch>
    <ui-form-field label="Newsletter" required><ui-switch /></ui-form-field>
  `,
})
class Host {
  readonly consent = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
  readonly dark = signal(false);
}

describe('UiSwitchHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('filters by label, aria-label, name, checked and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiSwitchHarness)).toHaveLength(5);
    // The label of `ui-form-field`, without its required marker.
    const newsletter = await loader.getHarness(UiSwitchHarness.with({ label: 'Newsletter' }));
    expect(await newsletter.getLabel()).toBe('Newsletter');
    expect(await loader.getAllHarnesses(UiSwitchHarness.with({ label: /usage/ }))).toHaveLength(1);
    const dark = await loader.getHarness(UiSwitchHarness.with({ label: 'Dark mode' }));
    expect(await dark.getLabel()).toBe('Dark mode');
    expect(await loader.getAllHarnesses(UiSwitchHarness.with({ name: 'consent' }))).toHaveLength(1);
    const on = await loader.getHarness(UiSwitchHarness.with({ checked: true }));
    expect(await on.getLabel()).toBe('Email notifications');
    expect(await loader.getAllHarnesses(UiSwitchHarness.with({ disabled: true }))).toHaveLength(1);
  });

  it('turns on and off through the form control', async () => {
    const consent = await loader.getHarness(UiSwitchHarness.with({ name: 'consent' }));
    await consent.check();
    await consent.check();
    expect(await consent.isChecked()).toBe(true);
    expect(host.consent.value).toBe(true);
    await consent.uncheck();
    await consent.uncheck();
    expect(host.consent.value).toBe(false);
    await consent.toggle();
    expect(host.consent.value).toBe(true);
  });

  it('toggles a two-way bound switch', async () => {
    const dark = await loader.getHarness(UiSwitchHarness.with({ label: 'Dark mode' }));
    await dark.toggle();
    expect(host.dark()).toBe(true);
    expect(await dark.isChecked()).toBe(true);
  });

  it('reads the states', async () => {
    const consent = await loader.getHarness(UiSwitchHarness.with({ name: 'consent' }));
    expect(await consent.getName()).toBe('consent');
    expect(await consent.isRequired()).toBe(true);
    expect(await consent.isInvalid()).toBe(false);
    await consent.focus();
    expect(await consent.isFocused()).toBe(true);
    await consent.blur();
    expect(await consent.isInvalid()).toBe(true);

    const email = await loader.getHarness(UiSwitchHarness.with({ label: 'Email notifications' }));
    expect(await email.isDisabled()).toBe(true);
    expect(await email.isReadonly()).toBe(false);

    const autoSave = await loader.getHarness(UiSwitchHarness.with({ label: 'Auto-save' }));
    expect(await autoSave.isReadonly()).toBe(true);
    await autoSave.toggle();
    expect(await autoSave.isChecked()).toBe(false);
  });
});

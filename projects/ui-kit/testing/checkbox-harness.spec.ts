import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiCheckboxHarness } from './checkbox-harness';

@Component({
  imports: [ReactiveFormsModule, UiCheckbox],
  template: `
    <ui-checkbox name="terms" [formControl]="terms">I accept the terms</ui-checkbox>
    <ui-checkbox aria-label="Select all" [(checked)]="all" [indeterminate]="true" />
    <ui-checkbox [disabled]="true" [checked]="true">Archived</ui-checkbox>
    <ui-checkbox [readonly]="true">Locked</ui-checkbox>
  `,
})
class Host {
  readonly terms = new FormControl(false, {
    nonNullable: true,
    validators: Validators.requiredTrue,
  });
  readonly all = signal(false);
}

describe('UiCheckboxHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('filters by label, aria-label, name, checked and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiCheckboxHarness)).toHaveLength(4);
    expect(await loader.getAllHarnesses(UiCheckboxHarness.with({ label: /terms/ }))).toHaveLength(
      1,
    );
    const all = await loader.getHarness(UiCheckboxHarness.with({ label: 'Select all' }));
    expect(await all.getLabel()).toBe('Select all');
    expect(await loader.getAllHarnesses(UiCheckboxHarness.with({ name: 'terms' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiCheckboxHarness.with({ checked: true }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiCheckboxHarness.with({ disabled: true }))).toHaveLength(
      1,
    );
  });

  it('checks and unchecks through the form control', async () => {
    const terms = await loader.getHarness(UiCheckboxHarness.with({ name: 'terms' }));
    await terms.check();
    await terms.check();
    expect(await terms.isChecked()).toBe(true);
    expect(host.terms.value).toBe(true);
    await terms.uncheck();
    await terms.uncheck();
    expect(host.terms.value).toBe(false);
    await terms.toggle();
    expect(host.terms.value).toBe(true);
  });

  it('clears the mixed state when toggled', async () => {
    const all = await loader.getHarness(UiCheckboxHarness.with({ label: 'Select all' }));
    expect(await all.isIndeterminate()).toBe(true);
    await all.check();
    expect(await all.isIndeterminate()).toBe(false);
    expect(host.all()).toBe(true);
  });

  it('reads the states', async () => {
    const terms = await loader.getHarness(UiCheckboxHarness.with({ name: 'terms' }));
    expect(await terms.getName()).toBe('terms');
    expect(await terms.isRequired()).toBe(true);
    expect(await terms.isInvalid()).toBe(false);
    await terms.focus();
    expect(await terms.isFocused()).toBe(true);
    await terms.blur();
    expect(await terms.isInvalid()).toBe(true);

    const archived = await loader.getHarness(UiCheckboxHarness.with({ label: 'Archived' }));
    expect(await archived.isDisabled()).toBe(true);
    expect(await archived.isReadonly()).toBe(false);

    const locked = await loader.getHarness(UiCheckboxHarness.with({ label: 'Locked' }));
    expect(await locked.isReadonly()).toBe(true);
    await locked.toggle();
    expect(await locked.isChecked()).toBe(false);
  });
});

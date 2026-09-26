import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiInput, UiTextarea } from '@vplans/ui-kit/input';
import { UiInputHarness } from './input-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiTextarea],
  template: `
    <ui-form-field label="Email">
      <input ui-input type="email" placeholder="name@example.com" [formControl]="email" />
    </ui-form-field>
    <textarea ui-textarea aria-label="Notes" size="sm"></textarea>
    <input ui-input aria-label="Code" readonly value="A-17" />
    <input ui-input aria-label="Locked" disabled />
    <input ui-input aria-label="Manual" [invalid]="invalid()" />
  `,
})
class Host {
  readonly email = new FormControl('', Validators.required);
  readonly invalid = signal(true);
}

describe('UiInputHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds inputs and textareas', async () => {
    expect(await loader.getAllHarnesses(UiInputHarness)).toHaveLength(5);
  });

  it('filters by the form-field label, aria-label, value and placeholder', async () => {
    const email = await loader.getHarness(UiInputHarness.with({ label: 'Email' }));
    expect(await email.getType()).toBe('email');
    expect(await (await loader.getHarness(UiInputHarness.with({ label: 'Notes' }))).getType()).toBe(
      'textarea',
    );
    expect(await loader.getAllHarnesses(UiInputHarness.with({ value: 'A-17' }))).toHaveLength(1);
    expect(
      await loader.getAllHarnesses(UiInputHarness.with({ placeholder: /example/ })),
    ).toHaveLength(1);
  });

  it('types a value that reaches the form control', async () => {
    const email = await loader.getHarness(UiInputHarness.with({ label: 'Email' }));
    await email.setValue('dana@vplans.com');
    expect(await email.getValue()).toBe('dana@vplans.com');
    expect(host.email.value).toBe('dana@vplans.com');
    await email.setValue('');
    expect(host.email.value).toBe('');
  });

  it('reads the states', async () => {
    const email = await loader.getHarness(UiInputHarness.with({ label: 'Email' }));
    expect(await email.getId()).toMatch(/^ui-input-/);
    expect(await email.getPlaceholder()).toBe('name@example.com');
    expect(await email.isRequired()).toBe(true);
    expect(await email.isInvalid()).toBe(false);
    expect(await email.getSize()).toBe('md');
    await email.focus();
    expect(await email.isFocused()).toBe(true);
    await email.blur();
    expect(await email.isInvalid()).toBe(true);

    const notes = await loader.getHarness(UiInputHarness.with({ label: 'Notes' }));
    expect(await notes.getSize()).toBe('sm');
    expect(await notes.getPlaceholder()).toBe('');
    expect(await notes.isRequired()).toBe(false);
    expect(
      await (await loader.getHarness(UiInputHarness.with({ label: 'Code' }))).isReadonly(),
    ).toBe(true);
    expect(
      await (await loader.getHarness(UiInputHarness.with({ label: 'Locked' }))).isDisabled(),
    ).toBe(true);

    const manual = await loader.getHarness(UiInputHarness.with({ label: 'Manual' }));
    expect(await manual.isInvalid()).toBe(true);
    host.invalid.set(false);
    expect(await manual.isInvalid()).toBe(false);
  });

  it('has no label without aria-label or label[for]', async () => {
    TestBed.resetTestingModule();
    @Component({ imports: [UiInput], template: '<input ui-input />' })
    class Bare {}
    const fixture = TestBed.createComponent(Bare);
    const input = await TestbedHarnessEnvironment.loader(fixture).getHarness(UiInputHarness);
    expect(await input.getLabel()).toBeNull();
  });
});

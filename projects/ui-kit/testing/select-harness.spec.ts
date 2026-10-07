import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiMultiSelect, UiOption, UiSelect } from '@vplans/ui-kit/select';
import { UiSelectHarness } from './select-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiSelect, UiMultiSelect, UiOption],
  template: `
    <ui-form-field label="City">
      <ui-select placeholder="Choose a city" clearable [formControl]="city">
        <ui-option value="haifa">Haifa<span uiOptionDescription>North</span></ui-option>
        <ui-option value="tlv">Tel Aviv</ui-option>
        <ui-option value="eilat" disabled>Eilat</ui-option>
      </ui-select>
    </ui-form-field>
    <ui-multi-select aria-label="Tags" size="sm" [(value)]="tags">
      <ui-option value="new">New</ui-option>
      <ui-option value="urgent">Urgent</ui-option>
      <ui-option value="done">Done</ui-option>
    </ui-multi-select>
    <ui-select aria-label="Plan" searchable [(value)]="plan">
      <ui-option value="a">Tower A</ui-option>
      <ui-option value="b">Tower B</ui-option>
      <ui-option value="p">Parking</ui-option>
    </ui-select>
    <ui-select aria-label="Status" [disabled]="true" [readonly]="true" [loading]="true" />
  `,
})
class Host {
  readonly city = new FormControl<string | null>(null, Validators.required);
  readonly tags = signal<readonly string[]>(['new']);
  readonly plan = signal<string | null>(null);
}

describe('UiSelectHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('filters by label, value, disabled state and multiple', async () => {
    expect(await loader.getAllHarnesses(UiSelectHarness)).toHaveLength(4);
    expect(await loader.getAllHarnesses(UiSelectHarness.with({ label: 'City' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiSelectHarness.with({ value: 'New' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiSelectHarness.with({ disabled: true }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiSelectHarness.with({ multiple: true }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiSelectHarness.with({ multiple: false }))).toHaveLength(3);
  });

  it('opens and closes the list and reads the options', async () => {
    const city = await loader.getHarness(UiSelectHarness.with({ label: 'City' }));
    expect(await city.getOptions()).toEqual([]);
    await city.open();
    await city.open();
    expect(await city.isOpen()).toBe(true);
    expect(await city.isFocused()).toBe(true);

    const options = await city.getOptions();
    expect(await Promise.all(options.map((option) => option.getText()))).toEqual([
      'Haifa',
      'Tel Aviv',
      'Eilat',
    ]);
    expect(await options[0].getDescription()).toBe('North');
    // A click opens the list without an active option while nothing is selected.
    expect(await options[0].isActive()).toBe(false);
    expect(await options[2].isDisabled()).toBe(true);
    expect(await city.getOptions({ disabled: false })).toHaveLength(2);

    await city.close();
    await city.close();
    expect(await city.isOpen()).toBe(false);
  });

  it('selects an option into the form control and clears it', async () => {
    const city = await loader.getHarness(UiSelectHarness.with({ label: 'City' }));
    expect(await city.getValueText()).toBe('');
    await city.clickOptions({ text: 'Tel Aviv' });
    expect(host.city.value).toBe('tlv');
    expect(await city.getValueText()).toBe('Tel Aviv');
    expect(await city.isOpen()).toBe(false);

    await city.open();
    expect(await (await city.getOptions({ selected: true }))[0].getText()).toBe('Tel Aviv');
    await city.close();

    await city.clear();
    expect(host.city.value).toBeNull();
    await expect(city.clear()).rejects.toThrow(/no clear button/);
    await expect(city.clickOptions({ text: 'Jerusalem' })).rejects.toThrow(/No option matches/);
  });

  it('clicks every matching option of a multi-select', async () => {
    const tags = await loader.getHarness(UiSelectHarness.with({ label: 'Tags' }));
    await tags.clickOptions({ text: /^(Urgent|Done)$/ });
    expect(host.tags()).toEqual(['new', 'urgent', 'done']);
    expect(await tags.isOpen()).toBe(true);
    expect(await tags.getSize()).toBe('sm');
  });

  it('searches a searchable select and skips hidden options', async () => {
    const plan = await loader.getHarness(UiSelectHarness.with({ label: 'Plan' }));
    expect(await plan.isSearchable()).toBe(true);
    await plan.search('tower');
    expect(await plan.getOptions()).toHaveLength(2);
    await plan.search('');
    expect(await plan.getOptions()).toHaveLength(3);
    await plan.clickOptions({ text: 'Parking' });
    expect(host.plan()).toBe('p');
    expect(await plan.getValueText()).toBe('Parking');

    const city = await loader.getHarness(UiSelectHarness.with({ label: 'City' }));
    await expect(city.search('x')).rejects.toThrow(/not searchable/);
  });

  it('reads the states', async () => {
    const city = await loader.getHarness(UiSelectHarness.with({ label: 'City' }));
    expect(await city.isRequired()).toBe(true);
    expect(await city.isInvalid()).toBe(false);
    expect(await city.isMultiple()).toBe(false);
    expect(await city.isLoading()).toBe(false);
    expect(await city.getSize()).toBe('md');
    await city.focus();
    await city.blur();
    expect(await city.isInvalid()).toBe(true);

    const status = await loader.getHarness(UiSelectHarness.with({ label: 'Status' }));
    expect(await status.isDisabled()).toBe(true);
    expect(await status.isReadonly()).toBe(true);
    expect(await status.isLoading()).toBe(true);
    await status.open();
    expect(await status.isOpen()).toBe(false);
  });
});

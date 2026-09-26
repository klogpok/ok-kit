import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiAutocomplete } from '@vplans/ui-kit/autocomplete';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiOption } from '@vplans/ui-kit/select';
import { UiAutocompleteHarness } from './autocomplete-harness';

@Component({
  imports: [UiAutocomplete, UiOption, UiFormField],
  template: `
    <ui-form-field label="City">
      <ui-autocomplete [(value)]="city">
        <ui-option value="Haifa">Haifa</ui-option>
        <ui-option value="Hadera">Hadera</ui-option>
        <ui-option value="Eilat">Eilat</ui-option>
      </ui-autocomplete>
    </ui-form-field>
    <ui-autocomplete aria-label="Locked" disabled loading />
  `,
})
class Host {
  readonly city = signal<string | null>(null);
}

describe('UiAutocompleteHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds autocompletes by label and state', async () => {
    expect(await loader.getAllHarnesses(UiAutocompleteHarness)).toHaveLength(2);
    const locked = await loader.getHarness(UiAutocompleteHarness.with({ disabled: true }));
    expect(await locked.getLabel()).toBe('Locked');
    expect(await locked.isLoading()).toBe(true);
  });

  it('types, reads the suggestions and picks one', async () => {
    const city = await loader.getHarness(UiAutocompleteHarness.with({ label: 'City' }));
    expect(await city.getOptions()).toEqual([]);
    await city.enterText('ha');
    expect(await city.isOpen()).toBe(true);
    const options = await city.getOptions();
    expect(await Promise.all(options.map((o) => o.getText()))).toEqual(['Haifa', 'Hadera']);
    await city.selectOption({ text: 'Hadera' });
    expect(host.city()).toBe('Hadera');
    expect(await city.getText()).toBe('Hadera');
    expect(await city.isOpen()).toBe(false);
    await expect(city.selectOption({ text: 'Acre' })).rejects.toThrow('No option matches');
    await city.close();
    expect(await city.isOpen()).toBe(false);
  });
});

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  let fixture: ComponentFixture<Host>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds autocompletes by label and state', async () => {
    expect(await loader.getAllHarnesses(UiAutocompleteHarness)).toHaveLength(2);
    const locked = await loader.getHarness(UiAutocompleteHarness.with({ disabled: true }));
    expect(await locked.getLabel()).toBe('Locked');
    expect(await locked.isLoading()).toBe(true);
  });

  it('reads the active suggestion', async () => {
    const city = await loader.getHarness(UiAutocompleteHarness.with({ label: 'City' }));
    expect(await city.getActiveOption()).toBeNull();
    // No suggestion is active until the user moves to one.
    await city.enterText('ha');
    expect(await city.getActiveOption()).toBeNull();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('ui-autocomplete input')!;
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }),
    );
    expect(await (await city.getActiveOption())?.getText()).toBe('Haifa');
    await city.close();
    expect(await city.getActiveOption()).toBeNull();
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

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiTimeInput } from '@vplans/ui-kit/time';
import { UiTimeInputHarness } from './time-input-harness';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiTimeInput],
  template: `
    <ui-form-field label="Start">
      <ui-time-input minTime="08:00" maxTime="10:00" [formControl]="start" />
    </ui-form-field>
    <ui-time-input aria-label="Locked" disabled value="12:00" />
  `,
})
class Host {
  readonly start = new FormControl<string | null>('09:00', Validators.required);
}

describe('UiTimeInputHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds time inputs by label, text and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiTimeInputHarness)).toHaveLength(2);
    expect(await loader.getAllHarnesses(UiTimeInputHarness.with({ value: '12:00' }))).toHaveLength(
      1,
    );
    const locked = await loader.getHarness(UiTimeInputHarness.with({ disabled: true }));
    expect(await locked.getLabel()).toBe('Locked');
    const start = await loader.getHarness(UiTimeInputHarness.with({ label: 'Start' }));
    expect(await start.getText()).toBe('09:00');
    expect(await start.isRequired()).toBe(true);
    expect(await start.isReadonly()).toBe(false);
  });

  it('types a time and reports text that is not a time', async () => {
    const start = await loader.getHarness(UiTimeInputHarness.with({ label: 'Start' }));
    await start.setText('0945');
    expect(host.start.value).toBe('09:45');
    await start.setText('11:00');
    await start.blur();
    expect(host.start.value).toBeNull();
    expect(await start.isInvalid()).toBe(true);
  });

  it('opens the list, reads it and picks a time', async () => {
    const start = await loader.getHarness(UiTimeInputHarness.with({ label: 'Start' }));
    const options = await start.getOptions();
    expect(await start.isOpen()).toBe(true);
    expect(await Promise.all(options.map((option) => option.getText()))).toEqual([
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
    ]);
    expect(await (await start.getOptions({ selected: true }))[0].getText()).toBe('09:00');
    await start.selectOption({ text: '08:30' });
    expect(host.start.value).toBe('08:30');
    expect(await start.isOpen()).toBe(false);
    await start.open();
    await start.close();
    expect(await start.isOpen()).toBe(false);
    await expect(start.selectOption({ text: '07:00' })).rejects.toThrow('No time matches');
  });
});

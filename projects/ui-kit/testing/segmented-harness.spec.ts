import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import {
  UiButtonToggle,
  UiButtonToggleGroup,
  UiSegment,
  UiSegmented,
} from '@vplans/ui-kit/segmented';
import { UiButtonToggleGroupHarness, UiSegmentedHarness } from './segmented-harness';

@Component({
  imports: [
    ReactiveFormsModule,
    UiFormField,
    UiSegmented,
    UiSegment,
    UiButtonToggleGroup,
    UiButtonToggle,
  ],
  template: `
    <div [attr.dir]="dir()">
      <ui-form-field label="View">
        <ui-segmented [formControl]="view">
          <ui-segment value="list">List</ui-segment>
          <ui-segment value="board">Board</ui-segment>
          <ui-segment value="map" disabled>Map</ui-segment>
          <ui-segment value="calendar" aria-label="Calendar"
            ><span uiSegmentIcon>C</span></ui-segment
          >
        </ui-segmented>
      </ui-form-field>
    </div>
    <ui-segmented aria-label="Locked" disabled readonly value="a">
      <ui-segment value="a">A</ui-segment>
    </ui-segmented>

    <ui-form-field label="Days">
      <ui-button-toggle-group [formControl]="days">
        <button ui-button-toggle value="sun">Sun</button>
        <button ui-button-toggle value="mon">Mon</button>
        <button ui-button-toggle value="tue" aria-label="Tuesday"></button>
      </ui-button-toggle-group>
    </ui-form-field>
    <ui-button-toggle-group aria-label="Off" disabled>
      <button ui-button-toggle value="x">X</button>
    </ui-button-toggle-group>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly view = new FormControl<string | null>(null, Validators.required);
  readonly days = new FormControl<readonly string[]>(['mon']);
}

describe('UiSegmentedHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds controls by label and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiSegmentedHarness)).toHaveLength(2);
    const locked = await loader.getHarness(UiSegmentedHarness.with({ disabled: true }));
    expect(await locked.getLabel()).toBe('Locked');
    expect(await locked.isReadonly()).toBe(true);
    const view = await loader.getHarness(UiSegmentedHarness.with({ label: 'View' }));
    expect(await view.isDisabled()).toBe(false);
    expect(await view.getSelectedText()).toBeNull();
  });

  it('lists segments with their text, state and the name of icon-only segments', async () => {
    const view = await loader.getHarness(UiSegmentedHarness.with({ label: 'View' }));
    const segments = await view.getSegments();
    expect(await Promise.all(segments.map((segment) => segment.getText()))).toEqual([
      'List',
      'Board',
      'Map',
      'Calendar',
    ]);
    expect(await view.getSegments({ disabled: true })).toHaveLength(1);
  });

  it('selects segments by click and with the arrow keys, mirrored in RTL', async () => {
    const view = await loader.getHarness(UiSegmentedHarness.with({ label: 'View' }));
    await view.select({ text: 'Board' });
    expect(host.view.value).toBe('board');
    expect(await view.getSelectedText()).toBe('Board');
    expect((await view.getSegments({ selected: true })).length).toBe(1);

    await view.focus();
    expect(await view.isFocused()).toBe(true);
    await view.pressArrow('ArrowRight');
    expect(host.view.value).toBe('calendar');
    host.dir.set('rtl');
    await view.pressArrow('ArrowRight');
    expect(host.view.value).toBe('board');

    const [list] = await view.getSegments({ text: 'List' });
    await list.focus();
    expect(await list.isFocused()).toBe(true);
    await list.blur();
    expect(await view.isInvalid()).toBe(false);
    await expect(view.select({ text: 'Nope' })).rejects.toThrow(/No segment matches/);
  });
});

describe('UiButtonToggleGroupHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds groups by label and disabled state', async () => {
    expect(await loader.getAllHarnesses(UiButtonToggleGroupHarness)).toHaveLength(2);
    const off = await loader.getHarness(UiButtonToggleGroupHarness.with({ disabled: true }));
    expect(await off.getLabel()).toBe('Off');
    const days = await loader.getHarness(UiButtonToggleGroupHarness.with({ label: 'Days' }));
    expect(await days.isDisabled()).toBe(false);
    expect(await days.isInvalid()).toBe(false);
  });

  it('toggles buttons and reads the pressed ones', async () => {
    const days = await loader.getHarness(UiButtonToggleGroupHarness.with({ label: 'Days' }));
    expect(await days.getPressedTexts()).toEqual(['Mon']);
    await days.toggle({ text: 'Tuesday' });
    await days.toggle({ text: 'Sun' });
    expect(host.days.value).toEqual(['mon', 'tue', 'sun']);
    expect(await days.getPressedTexts()).toEqual(['Sun', 'Mon', 'Tuesday']);
    const [mon] = await days.getToggles({ pressed: true, text: 'Mon' });
    await mon.toggle();
    expect(await mon.isPressed()).toBe(false);
    expect(await mon.isDisabled()).toBe(false);

    await days.focus();
    expect(await (await days.getToggles({ text: 'Sun' }))[0].isFocused()).toBe(true);
    await expect(days.toggle({ text: 'Nope' })).rejects.toThrow(/No toggle button matches/);
  });
});

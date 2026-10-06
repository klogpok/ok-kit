import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiChip, UiChipInput, UiChipSet, UiFilterChip } from '@vplans/ui-kit/chip';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiChipHarness, UiChipInputHarness } from './chip-harness';

@Component({
  imports: [UiChip, UiChipSet, UiFilterChip, UiChipInput, UiFormField],
  template: `
    <ui-chip-set aria-label="People">
      <ui-chip removable (removed)="removed.set(true)">Dana</ui-chip>
      <ui-chip disabled>Yossi</ui-chip>
    </ui-chip-set>
    <ui-chip-set aria-label="Status">
      <button ui-filter-chip [(selected)]="open">Open</button>
    </ui-chip-set>
    <ui-form-field label="Tags">
      <ui-chip-input [(value)]="tags" />
    </ui-form-field>
  `,
})
class Host {
  readonly removed = signal(false);
  readonly open = signal(false);
  readonly tags = signal<readonly string[]>(['north']);
}

describe('UiChipHarness and UiChipInputHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds chips by text, state and kind', async () => {
    expect(await loader.getAllHarnesses(UiChipHarness)).toHaveLength(4);
    const yossi = await loader.getHarness(UiChipHarness.with({ text: 'Yossi' }));
    expect(await yossi.isDisabled()).toBe(true);
    expect(await yossi.isRemovable()).toBe(false);
    await expect(yossi.remove()).rejects.toThrow('not removable');
    await expect(yossi.toggle()).rejects.toThrow('filter chips');
  });

  it('removes a chip and toggles a filter chip', async () => {
    const dana = await loader.getHarness(UiChipHarness.with({ text: 'Dana' }));
    await dana.focus();
    expect(await dana.isFocused()).toBe(true);
    await dana.remove();
    expect(host.removed()).toBe(true);

    const open = await loader.getHarness(UiChipHarness.with({ text: 'Open' }));
    expect(await open.isFilter()).toBe(true);
    await open.toggle();
    expect(host.open()).toBe(true);
    expect(await loader.getAllHarnesses(UiChipHarness.with({ selected: true }))).toHaveLength(1);
  });

  it('adds and removes chips of a chip input', async () => {
    const tags = await loader.getHarness(UiChipInputHarness.with({ label: 'Tags' }));
    await tags.add('south');
    expect(await tags.getValues()).toEqual(['north', 'south']);
    expect(host.tags()).toEqual(['north', 'south']);
    await tags.removeChip('north');
    expect(host.tags()).toEqual(['south']);
    await expect(tags.removeChip('west')).rejects.toThrow('No chip matches');
    expect(await tags.getText()).toBe('');
    expect(await tags.isDisabled()).toBe(false);
    expect(await tags.isReadonly()).toBe(false);
    expect(await tags.isRequired()).toBe(false);
    expect(await tags.isInvalid()).toBe(false);
  });
});

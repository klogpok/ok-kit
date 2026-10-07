import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader, TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiTree } from '@vplans/ui-kit/tree';
import { UiTreeHarness } from './tree-harness';

interface Unit {
  id: string;
  name: string;
  lazy?: boolean;
  children?: Unit[];
}

const UNITS: Unit[] = [
  {
    id: 'north',
    name: 'North',
    children: [
      { id: 'haifa', name: 'Haifa' },
      { id: 'akko', name: 'Akko' },
    ],
  },
  { id: 'archive', name: 'Archive', lazy: true },
  { id: 'south', name: 'South' },
];

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiTree],
  template: `
    <ui-form-field label="Units">
      <ui-tree
        selection="multiple"
        [formControl]="units"
        [data]="data"
        [displayWith]="nameOf"
        [disabledWith]="isAkko"
        [hasChildrenWith]="isLazy"
        [loadChildren]="load"
      />
    </ui-form-field>
    <ui-tree
      selection="single"
      [formControl]="unit"
      [data]="data"
      [displayWith]="nameOf"
      aria-label="Unit"
    />
    <ui-tree [data]="data" [loading]="loading()" aria-label="Loading" />
    <ui-tree [data]="[]" aria-label="Empty" />
  `,
})
class Host {
  readonly data = UNITS;
  readonly nameOf = (unit: Unit): string => unit.name;
  readonly isAkko = (unit: Unit): boolean => unit.id === 'akko';
  readonly isLazy = (unit: Unit): boolean => !!unit.lazy;
  readonly units = new FormControl<string[]>([], { nonNullable: true });
  readonly unit = new FormControl<string | null>({ value: 'south', disabled: true });
  readonly loading = signal(true);
  result = new Subject<Unit[]>();
  readonly load = (): Subject<Unit[]> => (this.result = new Subject<Unit[]>());
}

describe('UiTreeHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds trees by label and reads their state', async () => {
    expect(await loader.getAllHarnesses(UiTreeHarness)).toHaveLength(4);
    const units = await loader.getHarness(UiTreeHarness.with({ label: 'Units' }));
    expect(await units.getSelection()).toBe('multiple');
    expect(await units.isDisabled()).toBe(false);
    const unit = await loader.getHarness(UiTreeHarness.with({ label: 'Unit' }));
    expect(await unit.getSelection()).toBe('single');
    expect(await unit.isDisabled()).toBe(true);
    const loading = await loader.getHarness(UiTreeHarness.with({ label: 'Loading' }));
    expect(await loading.isLoading()).toBe(true);
    expect(await loading.getNodes()).toHaveLength(0);
    const empty = await loader.getHarness(UiTreeHarness.with({ label: 'Empty' }));
    expect(await empty.isEmpty()).toBe(true);
  });

  it('lists the visible nodes with their text, level and state', async () => {
    const tree = await loader.getHarness(UiTreeHarness.with({ label: 'Units' }));
    const [north, archive, south] = await tree.getNodes();
    expect(await north.getText()).toBe('North');
    expect(await north.getLevel()).toBe(0);
    expect(await north.isExpandable()).toBe(true);
    expect(await north.isExpanded()).toBe(false);
    expect(await archive.isExpandable()).toBe(true);
    expect(await south.isExpandable()).toBe(false);
    await north.expand();
    const akko = await tree.getNode({ text: 'Akko' });
    expect(await akko.getLevel()).toBe(1);
    expect(await akko.isDisabled()).toBe(true);
    await north.collapse();
    expect(await tree.getNodes({ text: 'Akko' })).toHaveLength(0);
  });

  it('checks nodes and reads the check states', async () => {
    const tree = await loader.getHarness(UiTreeHarness.with({ label: 'Units' }));
    await (await tree.getNode({ text: 'North' })).expand();
    await (await tree.getNode({ text: 'Haifa' })).click();
    expect(host.units.value).toEqual(['haifa']);
    expect(await (await tree.getNode({ text: 'North' })).getCheckState()).toBe('partial');
    expect(await tree.getNodes({ checkState: 'checked' })).toHaveLength(1);
  });

  it('reads the selected node of a single-selection tree', async () => {
    const tree = await loader.getHarness(UiTreeHarness.with({ label: 'Unit' }));
    const south = await tree.getNode({ text: 'South' });
    expect(await south.isSelected()).toBe(true);
    expect(await south.getCheckState()).toBeNull();
    expect(await tree.getNodes({ selected: true })).toHaveLength(1);
  });

  it('reports loading and failed branches and retries them', async () => {
    const tree = await loader.getHarness(UiTreeHarness.with({ label: 'Units' }));
    const archive = await tree.getNode({ text: 'Archive' });
    await archive.expand();
    expect(await archive.isLoading()).toBe(true);
    host.result.error(new Error('offline'));
    expect(await archive.isLoading()).toBe(false);
    expect(await archive.hasLoadError()).toBe(true);
    await archive.retry();
    expect(await archive.isLoading()).toBe(true);
  });

  it('moves focus and expands with the keyboard', async () => {
    const tree = await loader.getHarness(UiTreeHarness.with({ label: 'Units' }));
    await tree.focus();
    expect(await (await tree.getNode({ text: 'North' })).isFocused()).toBe(true);
    await tree.pressKey(TestKey.RIGHT_ARROW);
    expect(await (await tree.getNode({ text: 'North' })).isExpanded()).toBe(true);
    await tree.pressKey(TestKey.DOWN_ARROW);
    expect(await (await tree.getNode({ text: 'Haifa' })).isFocused()).toBe(true);
  });
});

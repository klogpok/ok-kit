import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import {
  UiMenu,
  UiMenuGroup,
  UiMenuItem,
  UiMenuItemCheckbox,
  UiMenuItemRadio,
  UiMenuTrigger,
} from '@vplans/ui-kit/menu';
import { UiMenuHarness } from './menu-harness';

@Component({
  imports: [
    UiButton,
    UiIconButton,
    UiMenu,
    UiMenuGroup,
    UiMenuItem,
    UiMenuItemCheckbox,
    UiMenuItemRadio,
    UiMenuTrigger,
  ],
  template: `
    <button ui-button [uiMenuTriggerFor]="actions">Actions</button>
    <button ui-icon-button label="Row actions" [uiMenuTriggerFor]="row">⋮</button>
    <ng-template #actions>
      <ui-menu>
        <button ui-menu-item (triggered)="events.push('edit')">Edit</button>
        <button ui-menu-item disabled (triggered)="events.push('locked')">Locked</button>
        <button ui-menu-item [uiMenuTriggerFor]="more">More</button>
        <button ui-menu-item danger (triggered)="events.push('delete')">Delete</button>
      </ui-menu>
    </ng-template>
    <ng-template #more>
      <ui-menu>
        <button ui-menu-item (triggered)="events.push('archive')">Archive</button>
      </ui-menu>
    </ng-template>
    <ng-template #row>
      <ui-menu>
        <button
          ui-menu-item-checkbox
          [checked]="archived()"
          (triggered)="archived.set(!archived())"
        >
          Show archived
        </button>
        <ui-menu-group label="Sort by">
          <button ui-menu-item-radio [checked]="sort() === 'name'" (triggered)="sort.set('name')">
            Name
          </button>
          <button ui-menu-item-radio [checked]="sort() === 'date'" (triggered)="sort.set('date')">
            Date
          </button>
        </ui-menu-group>
      </ui-menu>
    </ng-template>
  `,
})
class Host {
  readonly events: string[] = [];
  readonly archived = signal(false);
  readonly sort = signal<'name' | 'date'>('name');
}

describe('UiMenuHarness', () => {
  let fixture: ComponentFixture<Host>;
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => fixture.destroy());

  it('filters by trigger text and label', async () => {
    expect(await loader.getAllHarnesses(UiMenuHarness)).toHaveLength(2);
    const actions = await loader.getHarness(UiMenuHarness.with({ text: 'Actions' }));
    expect(await actions.getText()).toBe('Actions');
    expect(await actions.getLabel()).toBeNull();
    const row = await loader.getHarness(UiMenuHarness.with({ label: 'Row actions' }));
    expect(await row.getLabel()).toBe('Row actions');
  });

  it('opens and closes the menu and reads the items', async () => {
    const actions = await loader.getHarness(UiMenuHarness.with({ text: 'Actions' }));
    expect(await actions.isOpen()).toBe(false);
    expect(await actions.getItems()).toEqual([]);

    await actions.open();
    await actions.open();
    expect(await actions.isOpen()).toBe(true);
    const items = await actions.getItems();
    expect(await Promise.all(items.map((item) => item.getText()))).toEqual([
      'Edit',
      'Locked',
      'More',
      'Delete',
    ]);
    expect(await items[0].getRole()).toBe('menuitem');
    expect(await items[1].isDisabled()).toBe(true);
    expect(await items[2].hasSubmenu()).toBe(true);
    expect(await items[3].isDanger()).toBe(true);
    expect(await actions.getItems({ disabled: false })).toHaveLength(3);

    await actions.close();
    await actions.close();
    expect(await actions.isOpen()).toBe(false);
  });

  it('triggers items, also in a submenu', async () => {
    const actions = await loader.getHarness(UiMenuHarness.with({ text: 'Actions' }));
    await actions.clickItem({ text: 'Edit' });
    expect(host.events).toEqual(['edit']);
    expect(await actions.isOpen()).toBe(false);

    await actions.clickItem({ text: 'More' }, { text: 'Archive' });
    expect(host.events).toEqual(['edit', 'archive']);
    expect(await actions.isOpen()).toBe(false);

    await actions.open();
    const [edit] = await actions.getItems({ text: 'Edit' });
    expect(await edit.getSubmenu()).toBeNull();
    await expect(actions.clickItem({ text: 'Print' })).rejects.toThrow(/No item matches/);
    await expect(actions.clickItem({ text: 'Edit' }, { text: 'x' })).rejects.toThrow(/no submenu/);
  });

  it('checks a checkbox item and selects a radio item', async () => {
    const row = await loader.getHarness(UiMenuHarness.with({ label: 'Row actions' }));
    await row.open();
    const [archived] = await row.getItems({ text: 'Show archived' });
    expect(await archived.getRole()).toBe('menuitemcheckbox');
    expect(await archived.isChecked()).toBe(false);
    expect(await row.getItems({ checked: true })).toHaveLength(1);

    await row.clickItem({ text: 'Show archived' });
    expect(host.archived()).toBe(true);
    await row.clickItem({ text: 'Date' });
    expect(host.sort()).toBe('date');

    await row.open();
    const checked = await row.getItems({ checked: true });
    expect(await Promise.all(checked.map((item) => item.getText()))).toEqual([
      'Show archived',
      'Date',
    ]);
    expect(await checked[1].getRole()).toBe('menuitemradio');
  });
});

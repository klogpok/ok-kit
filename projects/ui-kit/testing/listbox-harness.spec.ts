import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentHarness, HarnessLoader, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiMultiSelect, UiOption, UiSelect } from '@vplans/ui-kit/select';
import { UiPopupListbox } from './listbox-harness';

/** A field harness the way the kit's harnesses use the popup listbox. */
class FieldHarness extends ComponentHarness {
  static hostSelector = '.ui-select';

  readonly control = this.locatorFor('.ui-select__control');
  readonly listbox = new UiPopupListbox(this.control, this.documentRootLocatorFactory());
}

const CITY = new HarnessPredicate(FieldHarness, { selector: ':not(.tags):not(.rooms)' });
const TAGS = new HarnessPredicate(FieldHarness, { selector: '.tags' });
const ROOMS = new HarnessPredicate(FieldHarness, { selector: '.rooms' });

@Component({
  imports: [UiSelect, UiMultiSelect, UiOption],
  template: `
    <ui-select aria-label="City" [(value)]="city">
      <ui-option value="haifa">Haifa</ui-option>
      <ui-option value="tlv">Tel Aviv</ui-option>
      <ui-option value="eilat" disabled>Eilat</ui-option>
    </ui-select>
    <ui-multi-select aria-label="Tags" class="tags" [(value)]="tags">
      <ui-option value="new">New</ui-option>
      <ui-option value="urgent">Urgent</ui-option>
    </ui-multi-select>
    <ui-multi-select
      aria-label="Rooms"
      class="rooms"
      searchable
      creatable
      selectAll
      [(value)]="rooms"
    >
      <ui-option value="kitchen">Kitchen</ui-option>
      <ui-option value="balcony">Balcony</ui-option>
    </ui-multi-select>
  `,
})
class Host {
  readonly city = signal<string | null>(null);
  readonly tags = signal<readonly string[]>([]);
  readonly rooms = signal<readonly string[]>([]);
}

describe('UiPopupListbox', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds the listbox of the control only while it is open', async () => {
    const field = await loader.getHarness(CITY);
    expect(await field.listbox.panel()).toBeNull();
    expect(await field.listbox.getOptions()).toEqual([]);
    expect(await field.listbox.getActiveOption()).toBeNull();

    await (await field.control()).click();
    expect(await field.listbox.panel()).not.toBeNull();
    const options = await field.listbox.getOptions({ disabled: false });
    expect(await Promise.all(options.map((option) => option.getText()))).toEqual([
      'Haifa',
      'Tel Aviv',
    ]);
  });

  it('reads the active option from aria-activedescendant', async () => {
    const field = await loader.getHarness(CITY);
    await (await field.control()).sendKeys(TestKey.DOWN_ARROW);
    expect(await (await field.listbox.getActiveOption())?.getText()).toBe('Haifa');
    await (await field.control()).sendKeys(TestKey.DOWN_ARROW);
    const active = await field.listbox.getActiveOption();
    expect(await active?.getText()).toBe('Tel Aviv');
    expect(await active?.isActive()).toBe(true);
    expect(await (await field.listbox.getOptions({ text: 'Haifa' }))[0].isActive()).toBe(false);
  });

  it('clicks the first matching option, or all of them, and names what is missing', async () => {
    const city = await loader.getHarness(CITY);
    await (await city.control()).click();
    await city.listbox.clickOptions({ text: /a/ });
    expect(host.city()).toBe('haifa');

    const tags = await loader.getHarness(TAGS);
    await (await tags.control()).click();
    await tags.listbox.clickOptions({}, { all: true });
    expect(host.tags()).toEqual(['new', 'urgent']);
    await expect(tags.listbox.clickOptions({ text: 'Done' }, { noun: 'tag' })).rejects.toThrow(
      'No tag matches {"text":"Done"}.',
    );
  });

  it('finds the leading actions of the open list', async () => {
    const rooms = await loader.getHarness(ROOMS);
    expect(await rooms.listbox.getSelectAllAction()).toBeNull();

    await (await rooms.control()).click();
    expect(await rooms.listbox.getCreateAction()).toBeNull();
    const all = await rooms.listbox.getSelectAllAction();
    expect(await all?.isSelected()).toBe(false);
    await all?.click();
    expect(host.rooms()).toEqual(['kitchen', 'balcony']);

    await (await rooms.control()).sendKeys('Pantry');
    expect(await rooms.listbox.getSelectAllAction()).toBeNull();
    await (await rooms.listbox.getCreateAction())?.click();
    expect(host.rooms()).toEqual(['kitchen', 'balcony', 'Pantry']);
  });
});

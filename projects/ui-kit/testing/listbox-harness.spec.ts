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

const CITY = new HarnessPredicate(FieldHarness, { selector: ':not(.tags)' });
const TAGS = new HarnessPredicate(FieldHarness, { selector: '.tags' });

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
  `,
})
class Host {
  readonly city = signal<string | null>(null);
  readonly tags = signal<readonly string[]>([]);
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
});

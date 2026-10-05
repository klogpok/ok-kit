import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiSelectHarness } from '@vplans/ui-kit/testing';
import { UiMultiSelect } from './multi-select';
import { UiOption } from './option';

// The CDK key managers read the legacy keyCode.
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
  Tab: 9,
  ' ': 32,
};

function keydown(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    keyCode: KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0),
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

const options = () => [...document.querySelectorAll<HTMLElement>('ui-option')];
const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');

@Component({
  imports: [UiMultiSelect, UiOption, UiFormField],
  template: `
    <ui-form-field label="Coordinators">
      <ui-multi-select [(value)]="value" placeholder="Choose" [searchable]="searchable()">
        <ui-option value="dana">Dana</ui-option>
        <ui-option value="david" disabled>David</ui-option>
        <ui-option value="yael">Yael</ui-option>
        <ui-option value="yossi">Yossi</ui-option>
      </ui-multi-select>
    </ui-form-field>
  `,
})
class Host {
  readonly value = signal<readonly string[]>([]);
  readonly searchable = signal(false);
}

describe('UiMultiSelect', () => {
  let fixture: ComponentFixture<Host>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLElement>('.ui-select__control')!;
  const open = async () => {
    control().click();
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('shows the placeholder and a multiselectable listbox with checkboxes', async () => {
    expect(control().textContent.trim()).toBe('Choose');
    expect(root.querySelector('ui-multi-select')!.classList).toContain('ui-select');
    await open();
    expect(listbox()!.getAttribute('aria-multiselectable')).toBe('true');
    expect(options()[0].querySelector('.ui-option__checkbox')).not.toBeNull();
    expect(options()[0].querySelector('.ui-option__check')).toBeNull();
  });

  it('toggles options on click and keeps the list open', async () => {
    await open();
    options()[2].click();
    await settle(fixture);
    options()[0].click();
    await settle(fixture);
    expect(listbox()).not.toBeNull();
    expect(fixture.componentInstance.value()).toEqual(['yael', 'dana']);
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    // The trigger lists the labels in option order.
    expect(control().textContent.trim()).toBe('Dana, Yael');

    options()[2].click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual(['dana']);
    expect(options()[2].getAttribute('aria-selected')).toBe('false');
  });

  it('ignores disabled options', async () => {
    await open();
    options()[1].click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([]);
  });

  it('toggles the active option with Enter and Space and closes with Escape', async () => {
    control().focus();
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[0].id);

    keydown(control(), 'Enter');
    await settle(fixture);
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    // David is disabled and skipped.
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[2].id);
    keydown(control(), ' ');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual(['dana', 'yael']);
    expect(listbox()).not.toBeNull();

    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual(['dana']);

    keydown(control(), 'Escape');
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('activates the first selected option when opening', async () => {
    fixture.componentInstance.value.set(['yossi', 'yael']);
    await settle(fixture);
    await open();
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[2].id);
  });

  it('filters by the search text and keeps it while toggling', async () => {
    fixture.componentInstance.searchable.set(true);
    await settle(fixture);
    const input = control() as HTMLInputElement;
    input.focus();
    input.value = 'yo';
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
    const visible = options().filter((o) => !o.hidden);
    expect(visible.map((o) => o.textContent.trim())).toEqual(['Yossi']);

    keydown(input, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual(['yossi']);
    expect(input.value).toBe('yo');
  });
});

interface City {
  id: number;
  name: string;
}

/**
 * The value is a collection, so the minimum is what `required` cannot express on its own.
 * Reactive forms show the message of an error value that is a string.
 */
const atLeastTwo: ValidatorFn = (control) => {
  const cities = control.value as readonly City[] | null;
  return (cities?.length ?? 0) >= 2 ? null : { minCities: 'Choose at least two cities' };
};

@Component({
  imports: [UiMultiSelect, UiOption, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Cities">
      <ui-multi-select [formControl]="control" [compareWith]="byId" [readonly]="locked()">
        @for (city of cities; track city.id) {
          <ui-option [value]="city">{{ city.name }}</ui-option>
        }
      </ui-multi-select>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly locked = signal(false);
  readonly cities: City[] = [
    { id: 1, name: 'Haifa' },
    { id: 2, name: 'Tel Aviv' },
  ];
  readonly control = new FormControl<City[] | null>([{ id: 2, name: 'Tel Aviv' }], [
    Validators.required,
    atLeastTwo,
  ]);
  readonly byId = (option: City, selected: City) => option.id === selected.id;
}

describe('UiMultiSelect with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let host: ReactiveHost;
  let root: HTMLElement;
  let loader: HarnessLoader;
  const cities = () => loader.getHarness(UiSelectHarness.with({ label: 'Cities' }));
  const trigger = () => root.querySelector<HTMLButtonElement>('.ui-select__control')!;
  /** The message `ui-form-field` shows under the select. */
  const errorText = () => root.querySelector('.ui-form-field__error')?.textContent.trim() ?? '';

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    loader = TestbedHarnessEnvironment.loader(fixture);
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('binds the value both ways using compareWith and writes a new array', async () => {
    const select = await cities();
    expect(await select.getValueText()).toBe('Tel Aviv');

    const before = host.control.value;
    await select.clickOptions({ text: 'Haifa' });
    expect(host.control.value).toEqual([
      { id: 2, name: 'Tel Aviv' },
      { id: 1, name: 'Haifa' },
    ]);
    expect(host.control.value).not.toBe(before);

    host.control.setValue([{ id: 1, name: 'Haifa' }]);
    await settle(fixture);
    expect(await select.getValueText()).toBe('Haifa');
  });

  it('treats a null value as empty', async () => {
    const select = await cities();
    host.control.setValue(null);
    await settle(fixture);
    expect(await select.getValueText()).toBe('');
  });

  it('marks the field required from the validators of the control', async () => {
    expect(await (await cities()).isRequired()).toBe(true);
    expect(root.querySelector('.ui-form-field__required')).not.toBeNull();
  });

  it('disables the trigger from the control', async () => {
    const select = await cities();
    host.control.disable();
    await settle(fixture);
    expect(await select.isDisabled()).toBe(true);
    expect(trigger().disabled).toBe(true);
    await select.open();
    expect(await select.isOpen()).toBe(false);
  });

  it('stays focusable but does not open while readonly', async () => {
    const select = await cities();
    host.locked.set(true);
    await settle(fixture);
    expect(await select.isReadonly()).toBe(true);
    expect(trigger().disabled).toBe(false);
    await select.open();
    expect(await select.isOpen()).toBe(false);
  });

  it('closes the list and marks the control touched when focus leaves', async () => {
    const select = await cities();
    await select.open();
    expect(await select.isOpen()).toBe(true);
    expect(host.control.touched).toBe(false);

    await select.blur();
    await settle(fixture);
    expect(await select.isOpen()).toBe(false);
    expect(host.control.touched).toBe(true);
  });

  it('shows the minimum-length message only once the control is invalid and touched', async () => {
    const select = await cities();
    // One city: too few, but nothing is shown before the user has been there.
    expect(host.control.invalid).toBe(true);
    expect(await select.isInvalid()).toBe(false);
    expect(errorText()).toBe('');

    await select.blur();
    await settle(fixture);
    expect(await select.isInvalid()).toBe(true);
    expect(errorText()).toContain('Choose at least two cities');
    const error = document.getElementById(trigger().getAttribute('aria-describedby')!);
    expect(error!.textContent).toContain('Choose at least two cities');

    await select.clickOptions({ text: 'Haifa' });
    await settle(fixture);
    expect(host.control.valid).toBe(true);
    expect(await select.isInvalid()).toBe(false);
    expect(errorText()).toBe('');
  });
});

@Component({
  imports: [UiMultiSelect, UiOption],
  template: `
    <ui-multi-select aria-label="Recipients" clearable [(value)]="value">
      <ui-option value="dana">Dana</ui-option>
      <ui-option value="yossi">Yossi</ui-option>
    </ui-multi-select>
  `,
})
class ClearableHost {
  readonly value = signal<readonly string[]>(['dana', 'yossi']);
}

describe('UiMultiSelect clearable', () => {
  it('clears all selected values', async () => {
    const fixture = TestBed.createComponent(ClearableHost);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('.ui-select__clear')!.click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([]);
    expect(root.querySelector('.ui-select__clear')).toBeNull();
  });
});

@Component({
  imports: [UiMultiSelect, UiOption],
  template: `
    <ui-multi-select
      aria-label="Trades"
      searchable
      [(value)]="value"
      [selectAll]="selectAll()"
      [maxSelections]="max()"
      [chips]="chips()"
    >
      <ui-option value="electric">Electric</ui-option>
      <ui-option value="plumbing">Plumbing</ui-option>
      <ui-option value="paint">Paint</ui-option>
      <ui-option value="roof" disabled>Roof</ui-option>
    </ui-multi-select>
  `,
})
class ExtrasHost {
  readonly value = signal<readonly string[]>([]);
  readonly selectAll = signal(true);
  readonly max = signal<number | null>(null);
  readonly chips = signal(false);
}

describe('UiMultiSelect extras', () => {
  let fixture: ComponentFixture<ExtrasHost>;
  let host: ExtrasHost;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLInputElement>('.ui-select__control')!;
  const all = () => document.querySelector<HTMLElement>('ui-option.ui-select__all');
  const option = (text: string) => options().find((o) => o.textContent.includes(text))!;
  const open = async () => {
    keydown(control(), 'ArrowDown');
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ExtrasHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('selects and deselects every enabled option with "select all"', async () => {
    await open();
    expect(all()!.textContent.trim()).toBe('בחירת הכול');
    expect(options()[0]).toBe(all());
    all()!.click();
    await settle(fixture);
    expect(host.value()).toEqual(['electric', 'plumbing', 'paint']);
    expect(all()!.getAttribute('aria-selected')).toBe('true');

    option('Paint').click();
    await settle(fixture);
    expect(all()!.getAttribute('aria-selected')).toBe('false');
    expect(all()!.classList).toContain('ui-option--selected');

    all()!.click();
    await settle(fixture);
    expect(host.value()).toEqual(['electric', 'plumbing', 'paint']);
    all()!.click();
    await settle(fixture);
    expect(host.value()).toEqual([]);
  });

  it('acts on the options the search shows and stays visible', async () => {
    host.value.set(['paint']);
    await settle(fixture);
    control().value = 'p';
    control().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(all()!.hidden).toBe(false);
    all()!.click();
    await settle(fixture);
    expect(host.value()).toEqual(['paint', 'plumbing']);
  });

  it('is the first option for the keyboard', async () => {
    await open();
    keydown(control(), 'ArrowUp');
    await settle(fixture);
    expect(control().getAttribute('aria-activedescendant')).toBe(all()!.id);
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(host.value()).toHaveLength(3);
  });

  it('blocks more options once maxSelections is reached and hides "select all"', async () => {
    host.max.set(2);
    await settle(fixture);
    await open();
    expect(all()).toBeNull();
    option('Electric').click();
    option('Plumbing').click();
    await settle(fixture);
    expect(option('Paint').getAttribute('aria-disabled')).toBe('true');
    option('Paint').click();
    await settle(fixture);
    expect(host.value()).toEqual(['electric', 'plumbing']);

    option('Electric').click();
    await settle(fixture);
    expect(option('Paint').hasAttribute('aria-disabled')).toBe(false);
  });

  it('shows the values as chips whose x removes them without opening the list', async () => {
    host.chips.set(true);
    host.value.set(['plumbing', 'electric']);
    await settle(fixture);
    const chips = [...root.querySelectorAll('.ui-select__chips ui-chip')];
    expect(chips.map((c) => c.textContent.trim())).toEqual(['Plumbing', 'Electric']);
    expect(root.querySelector('.ui-select__chips')!.getAttribute('aria-hidden')).toBe('true');
    const remove = root.querySelector<HTMLButtonElement>('.ui-select__chips .ui-chip__remove')!;
    expect(remove.tabIndex).toBe(-1);
    remove.click();
    await settle(fixture);
    expect(host.value()).toEqual(['electric']);
    expect(listbox()).toBeNull();
  });
});

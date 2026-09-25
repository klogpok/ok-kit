import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
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
    expect(control().textContent!.trim()).toBe('Choose');
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
    expect(control().textContent!.trim()).toBe('Dana, Yael');

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
    expect(visible.map((o) => o.textContent!.trim())).toEqual(['Yossi']);

    keydown(input, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual(['yossi']);
    expect(input.value).toBe('yo');
  });
});

@Component({
  imports: [UiMultiSelect, UiOption, ReactiveFormsModule],
  template: `
    <ui-multi-select [formControl]="control" aria-label="Cities" [compareWith]="byId">
      @for (city of cities; track city.id) {
        <ui-option [value]="city">{{ city.name }}</ui-option>
      }
    </ui-multi-select>
  `,
})
class ReactiveHost {
  readonly cities = [
    { id: 1, name: 'Haifa' },
    { id: 2, name: 'Tel Aviv' },
  ];
  readonly control = new FormControl<{ id: number; name: string }[]>([{ id: 2, name: 'Tel Aviv' }]);
  readonly byId = (option: { id: number }, selected: { id: number }) => option.id === selected.id;
}

describe('UiMultiSelect with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLElement>('.ui-select__control')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('shows the initial value using compareWith and writes a new array', async () => {
    expect(control().textContent!.trim()).toBe('Tel Aviv');
    const before = fixture.componentInstance.control.value;
    control().click();
    await settle(fixture);
    options()[0].click();
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toEqual([
      { id: 2, name: 'Tel Aviv' },
      { id: 1, name: 'Haifa' },
    ]);
    expect(fixture.componentInstance.control.value).not.toBe(before);
  });

  it('marks touched on blur and disables the trigger', async () => {
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.disable();
    await settle(fixture);
    expect((control() as HTMLButtonElement).disabled).toBe(true);
  });

  it('treats a null value as empty', async () => {
    fixture.componentInstance.control.setValue(null);
    await settle(fixture);
    expect(control().textContent!.trim()).toBe('');
  });
});

@Component({
  imports: [UiMultiSelect, UiOption, UiFormField, FormField],
  template: `
    <ui-form-field label="Roles">
      <ui-multi-select [formField]="f.roles">
        <ui-option value="owner">Owner</ui-option>
        <ui-option value="coordinator">Coordinator</ui-option>
      </ui-multi-select>
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ roles: string[] }>({ roles: [] });
  readonly f = form(this.model, (p) => {
    // `required()` treats only null, '' and false as empty; an empty array needs `minLength`.
    required(p.roles);
    minLength(p.roles, 1, { message: 'Choose a role' });
  });
}

describe('UiMultiSelect with Signal Forms', () => {
  let fixture: ComponentFixture<SignalHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLElement>('.ui-select__control')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SignalHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('binds the value both ways', async () => {
    control().click();
    await settle(fixture);
    options()[1].click();
    options()[0].click();
    await settle(fixture);
    expect(fixture.componentInstance.model().roles).toEqual(['coordinator', 'owner']);

    fixture.componentInstance.model.set({ roles: ['owner'] });
    await settle(fixture);
    expect(control().textContent!.trim()).toBe('Owner');
  });

  it('shows the required state and the error once touched', async () => {
    expect(control().getAttribute('aria-required')).toBe('true');
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(root.textContent).toContain('Choose a role');
  });
});

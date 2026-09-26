import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiOption } from '@vplans/ui-kit/select';
import { UiAutocomplete } from './autocomplete';

const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
  Tab: 9,
};

function keydown(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    keyCode: KEY_CODES[key] ?? 0,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');
const shown = () =>
  [...document.querySelectorAll<HTMLElement>('ui-option:not([hidden])')].map((o) =>
    o.textContent.trim(),
  );

const CITIES = ['Haifa', 'Hadera', 'Eilat', 'Acre'];

@Component({
  imports: [UiAutocomplete, UiOption, UiFormField],
  template: `
    <ui-form-field label="City">
      <ui-autocomplete
        [(value)]="city"
        placeholder="Type a city"
        (searchChange)="searches.push($event)"
      >
        @for (city of cities; track city) {
          <ui-option [value]="city">{{ city }}</ui-option>
        }
      </ui-autocomplete>
    </ui-form-field>
  `,
})
class FreeTextHost {
  readonly cities = CITIES;
  readonly city = signal<string | null>(null);
  readonly searches: string[] = [];
}

describe('UiAutocomplete (free text)', () => {
  let fixture: ComponentFixture<FreeTextHost>;
  let host: FreeTextHost;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
  };
  const press = async (key: string, init: KeyboardEventInit = {}) => {
    const event = keydown(input(), key, init);
    await settle(fixture);
    return event;
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(FreeTextHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('is a labelled combobox with list autocomplete', () => {
    expect(root.querySelector('label')!.htmlFor).toBe(input().id);
    expect(input().getAttribute('role')).toBe('combobox');
    expect(input().getAttribute('aria-autocomplete')).toBe('list');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().placeholder).toBe('Type a city');
  });

  it('sets the value to the text and filters the suggestions while typing', async () => {
    await type('ha');
    expect(host.city()).toBe('ha');
    expect(host.searches).toEqual(['ha']);
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(input().getAttribute('aria-controls')).toBe(listbox()!.id);
    expect(shown()).toEqual(['Haifa', 'Hadera']);
    // No option is active until the user moves to one.
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('picks the active option with the keyboard', async () => {
    await type('ha');
    await press('ArrowDown');
    await press('ArrowDown');
    const active = input().getAttribute('aria-activedescendant')!;
    expect(document.getElementById(active)!.textContent.trim()).toBe('Hadera');
    expect((await press('Enter')).defaultPrevented).toBe(true);
    expect(host.city()).toBe('Hadera');
    expect(input().value).toBe('Hadera');
    expect(listbox()).toBeNull();
  });

  it('lets Enter submit the form without an active option', async () => {
    await type('ha');
    expect((await press('Enter')).defaultPrevented).toBe(false);
  });

  it('picks a clicked option and shows the whole list again', async () => {
    await type('ei');
    document.querySelector<HTMLElement>('ui-option:not([hidden])')!.click();
    await settle(fixture);
    expect(host.city()).toBe('Eilat');
    await press('ArrowDown');
    expect(shown()).toEqual(CITIES);
  });

  it('opens with the arrow keys; Alt+ArrowDown does not move', async () => {
    await press('ArrowDown', { altKey: true });
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
    await press('Escape');
    await press('ArrowUp');
    const active = input().getAttribute('aria-activedescendant')!;
    expect(document.getElementById(active)!.textContent.trim()).toBe('Acre');
  });

  it('hides the list without matches', async () => {
    await type('zzz');
    expect(host.city()).toBe('zzz');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(listbox()).toBeNull();
  });

  it('closes with Escape, then clears the field', async () => {
    await type('ha');
    const escape = await press('Escape');
    expect(escape.defaultPrevented).toBe(true);
    expect(listbox()).toBeNull();
    expect(host.city()).toBe('ha');
    await press('Escape');
    expect(host.city()).toBe('');
    expect(input().value).toBe('');
  });

  it('shows a value set from outside', async () => {
    host.city.set('Acre');
    await settle(fixture);
    expect(input().value).toBe('Acre');
  });
});

interface User {
  id: number;
  name: string;
}

const USERS: User[] = [
  { id: 1, name: 'Dana Levi' },
  { id: 2, name: 'David Cohen' },
];

@Component({
  imports: [UiAutocomplete, UiOption, UiFormField],
  template: `
    <ui-form-field label="Owner">
      <ui-autocomplete
        [(value)]="owner"
        [displayWith]="nameOf"
        [compareWith]="byId"
        [loading]="loading()"
      >
        @for (user of users; track user.id) {
          <ui-option [value]="user">{{ user.name }}</ui-option>
        }
      </ui-autocomplete>
    </ui-form-field>
  `,
})
class PickHost {
  readonly users = USERS;
  readonly owner = signal<User | string | null>({ id: 2, name: 'David Cohen' });
  readonly loading = signal(false);
  readonly nameOf = (user: User) => user.name;
  readonly byId = (a: User, b: User) => a.id === b.id;
}

describe('UiAutocomplete (pick one)', () => {
  let fixture: ComponentFixture<PickHost>;
  let host: PickHost;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(PickHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('shows the picked object with displayWith', () => {
    expect(input().value).toBe('David Cohen');
  });

  it('only searches while typing and clears unpicked text on blur', async () => {
    await type('da');
    expect(host.owner()).toBeNull();
    expect(input().value).toBe('da');
    input().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(input().value).toBe('');
  });

  it('picks an object', async () => {
    await type('dana');
    document.querySelector<HTMLElement>('ui-option:not([hidden])')!.click();
    await settle(fixture);
    expect(host.owner()).toEqual(USERS[0]);
    expect(input().value).toBe('Dana Levi');
    input().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(input().value).toBe('Dana Levi');
  });

  it('says so when nothing matches, and shows a spinner while loading', async () => {
    await type('zz');
    expect(listbox()!.textContent).toContain('אין תוצאות');
    host.loading.set(true);
    await settle(fixture);
    expect(listbox()!.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.ui-autocomplete__spinner')).not.toBeNull();
  });
});

@Component({
  imports: [UiAutocomplete, UiOption, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="City">
      <ui-autocomplete [formControl]="city">
        <ui-option value="Haifa">Haifa</ui-option>
      </ui-autocomplete>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly city = new FormControl<string | null>(null, Validators.required);
}

describe('UiAutocomplete with forms', () => {
  it('works with Reactive Forms', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const { city } = fixture.componentInstance;
    const input = root.querySelector('input')!;
    expect(input.getAttribute('aria-required')).toBe('true');
    input.value = 'Tel Aviv';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(city.value).toBe('Tel Aviv');
    expect(city.touched).toBe(true);
    city.setValue('Haifa');
    await settle(fixture);
    expect(input.value).toBe('Haifa');
    city.disable();
    await settle(fixture);
    expect(input.disabled).toBe(true);
    fixture.destroy();
  });

  it('works with Signal Forms', async () => {
    @Component({
      imports: [UiAutocomplete, UiOption, UiFormField, FormField],
      template: `
        <ui-form-field label="City">
          <ui-autocomplete [formField]="plan.city">
            <ui-option value="Haifa">Haifa</ui-option>
          </ui-autocomplete>
        </ui-form-field>
      `,
    })
    class SignalHost {
      readonly model = signal({ city: '' });
      readonly plan = form(this.model, (p) => {
        required(p.city, { message: 'Enter a city' });
      });
    }
    const fixture = TestBed.createComponent(SignalHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const input = root.querySelector('input')!;
    input.dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('.ui-form-field__error')!.textContent).toContain('Enter a city');
    input.value = 'Acre';
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(fixture.componentInstance.model().city).toBe('Acre');
    fixture.destroy();
  });
});

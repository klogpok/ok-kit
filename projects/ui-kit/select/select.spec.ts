import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiOption, UiOptionGroup } from './option';
import { UiSelect } from './select';

// The CDK key managers read the legacy keyCode.
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
  Home: 36,
  End: 35,
  Tab: 9,
  ' ': 32,
};

function keydown(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const keyCode = KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0);
  const event = new KeyboardEvent('keydown', {
    key,
    keyCode,
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

const options = () => [...document.querySelectorAll<HTMLElement>('ui-option')];
const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');

@Component({
  imports: [UiSelect, UiOption, UiOptionGroup, UiFormField],
  template: `
    <ui-form-field label="Coordinator" hint="Approves the plan">
      <ui-select
        [(value)]="value"
        placeholder="Choose"
        [searchable]="searchable()"
        (searchChange)="searches.push($event)"
      >
        <ui-option value="dana">Dana</ui-option>
        <ui-option value="david" disabled>David</ui-option>
        <ui-option-group label="Contractors">
          <ui-option value="yael">Yael</ui-option>
          <ui-option value="yossi">Yossi</ui-option>
        </ui-option-group>
      </ui-select>
    </ui-form-field>
  `,
})
class Host {
  readonly value = signal<string | null>(null);
  readonly searchable = signal(false);
  readonly searches: string[] = [];
  readonly select = viewChild.required(UiSelect);
}

describe('UiSelect', () => {
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

  it('renders a combobox button linked to the form-field label and hint', () => {
    const button = control();
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('role')).toBe('combobox');
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('label')!.getAttribute('for')).toBe(button.id);
    const hint = document.getElementById(button.getAttribute('aria-describedby')!);
    expect(hint!.textContent).toContain('Approves the plan');
    expect(button.textContent!.trim()).toBe('Choose');
  });

  it('opens a labelled listbox with options and groups', async () => {
    await open();
    const button = control();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(listbox()!.id);
    expect(listbox()!.getAttribute('aria-labelledby')).toBe(root.querySelector('label')!.id);
    expect(options().map((o) => o.getAttribute('role'))).toEqual(Array(4).fill('option'));
    expect(options()[1].getAttribute('aria-disabled')).toBe('true');
    const group = document.querySelector('ui-option-group')!;
    expect(group.getAttribute('role')).toBe('group');
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)!.textContent).toBe(
      'Contractors',
    );
  });

  it('selects an option on click and closes', async () => {
    await open();
    options()[2].click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toBe('yael');
    expect(listbox()).toBeNull();
    expect(control().textContent!.trim()).toBe('Yael');
    expect(document.activeElement).toBe(control());
  });

  it('ignores clicks on disabled options', async () => {
    await open();
    options()[1].click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toBeNull();
    expect(listbox()).not.toBeNull();
  });

  it('navigates with the keyboard using aria-activedescendant', async () => {
    control().focus();
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    expect(listbox()).not.toBeNull();
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[0].id);
    expect(options()[0].classList).toContain('ui-option--active');

    // Skips the disabled option.
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[2].id);

    keydown(control(), 'End');
    await settle(fixture);
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[3].id);

    const enter = keydown(control(), 'Enter');
    await settle(fixture);
    expect(enter.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.value()).toBe('yossi');
    expect(listbox()).toBeNull();
    expect(control().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('keeps keys pressed before the list rendered', async () => {
    control().focus();
    keydown(control(), 'ArrowDown');
    keydown(control(), 'ArrowDown');
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[2].id);
  });

  it('opens at the selected option', async () => {
    fixture.componentInstance.value.set('yael');
    await settle(fixture);
    await open();
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[2].id);
    expect(options()[2].getAttribute('aria-selected')).toBe('true');
    expect(options()[2].querySelector('ui-icon')).not.toBeNull();
  });

  it('closes on Escape without letting the event reach a dialog', async () => {
    const outer = vi.fn();
    document.body.addEventListener('keydown', outer);
    await open();
    const escape = keydown(control(), 'Escape');
    await settle(fixture);
    expect(escape.defaultPrevented).toBe(true);
    expect(outer).not.toHaveBeenCalled();
    expect(listbox()).toBeNull();
    document.body.removeEventListener('keydown', outer);
  });

  it('closes on Tab and on blur', async () => {
    await open();
    keydown(control(), 'Tab');
    await settle(fixture);
    expect(listbox()).toBeNull();

    await open();
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('jumps to a matching option when typing', async () => {
    vi.useFakeTimers();
    try {
      control().focus();
      keydown(control(), 'y');
      vi.advanceTimersByTime(250);
      fixture.detectChanges();
      expect(listbox()).not.toBeNull();
      expect(control().getAttribute('aria-activedescendant')).toBe(options()[2].id);
    } finally {
      vi.useRealTimers();
    }
  });

  describe('searchable', () => {
    beforeEach(async () => {
      fixture.componentInstance.searchable.set(true);
      await settle(fixture);
    });

    const type = async (text: string) => {
      const input = control() as HTMLInputElement;
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await settle(fixture);
    };

    it('renders a text combobox with list autocomplete', () => {
      const input = control();
      expect(input.tagName).toBe('INPUT');
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
    });

    it('filters options by label and emits the search text', async () => {
      await type('yo');
      expect(options().map((o) => o.hidden)).toEqual([true, true, true, false]);
      expect(control().getAttribute('aria-activedescendant')).toBe(options()[3].id);
      expect(fixture.componentInstance.searches).toEqual(['yo']);

      keydown(control(), 'Enter');
      await settle(fixture);
      expect(fixture.componentInstance.value()).toBe('yossi');
      expect((control() as HTMLInputElement).value).toBe('Yossi');
    });

    it('hides a group whose options are all filtered out', async () => {
      await type('dan');
      expect(document.querySelector<HTMLElement>('ui-option-group')!.hidden).toBe(true);
    });

    it('shows an empty message when nothing matches', async () => {
      await type('zzz');
      expect(listbox()!.textContent).toContain('אין תוצאות');
    });

    it('keeps Space for typing', async () => {
      await open();
      const space = keydown(control(), ' ');
      expect(space.defaultPrevented).toBe(false);
    });
  });
});

@Component({
  imports: [UiSelect, UiOption, UiFormField, UiError, ReactiveFormsModule],
  template: `
    <ui-form-field label="City">
      <ui-select [formControl]="control" [compareWith]="byId">
        @for (city of cities; track city.id) {
          <ui-option [value]="city">{{ city.name }}</ui-option>
        }
      </ui-select>
      <ui-error>Choose a city</ui-error>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly cities = [
    { id: 1, name: 'Haifa' },
    { id: 2, name: 'Tel Aviv' },
  ];
  readonly control = new FormControl<{ id: number; name: string } | null>(
    { id: 2, name: 'Tel Aviv' },
    Validators.required,
  );
  readonly byId = (a: unknown, b: unknown) =>
    (a as { id: number } | null)?.id === (b as { id: number } | null)?.id;
}

describe('UiSelect with Reactive Forms', () => {
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

  it('shows the initial value using compareWith', () => {
    expect(control().textContent!.trim()).toBe('Tel Aviv');
  });

  it('writes the selected object to the control', async () => {
    control().click();
    await settle(fixture);
    options()[0].click();
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toEqual({ id: 1, name: 'Haifa' });
  });

  it('marks touched on blur and links the error', async () => {
    fixture.componentInstance.control.setValue(null);
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(fixture.componentInstance.control.touched).toBe(true);
    expect(control().getAttribute('aria-invalid')).toBe('true');
    const error = document.getElementById(control().getAttribute('aria-describedby')!);
    expect(error!.textContent).toContain('Choose a city');
  });

  it('disables the trigger', async () => {
    fixture.componentInstance.control.disable();
    await settle(fixture);
    expect((control() as HTMLButtonElement).disabled).toBe(true);
    control().click();
    await settle(fixture);
    expect(listbox()).toBeNull();
  });
});

@Component({
  imports: [UiSelect, UiOption, UiFormField, FormField],
  template: `
    <ui-form-field label="Role">
      <ui-select [formField]="f.role">
        <ui-option value="owner">Owner</ui-option>
        <ui-option value="coordinator">Coordinator</ui-option>
      </ui-select>
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ role: string | null }>({ role: null });
  readonly f = form(this.model, (p) => {
    required(p.role, { message: 'Choose a role' });
  });
}

describe('UiSelect with Signal Forms', () => {
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
    await settle(fixture);
    expect(fixture.componentInstance.model().role).toBe('coordinator');

    fixture.componentInstance.model.set({ role: 'owner' });
    await settle(fixture);
    expect(control().textContent!.trim()).toBe('Owner');
  });

  it('shows the required state and the error message once touched', async () => {
    expect(control().getAttribute('aria-required')).toBe('true');
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(fixture.componentInstance.f.role().touched()).toBe(true);
    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(root.textContent).toContain('Choose a role');
  });
});

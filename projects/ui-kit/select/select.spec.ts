import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiSelectHarness } from '@vplans/ui-kit/testing';
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
        name="coordinator"
        placeholder="Choose"
        [disabled]="disabled()"
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
  readonly disabled = signal(false);
  readonly searches: string[] = [];
  readonly select = viewChild.required(UiSelect);
}

@Component({
  imports: [UiSelect, UiOption],
  template: `
    <ui-select
      aria-label="Owner"
      searchable
      [filterOptions]="false"
      [(value)]="value"
      [displayWith]="display"
      (searchChange)="search($event)"
    >
      @for (name of results(); track name) {
        <ui-option [value]="name">{{ name }}</ui-option>
      }
    </ui-select>
  `,
})
class ServerSearchHost {
  readonly value = signal<string | null>(null);
  readonly results = signal(['Avi', 'Batya']);
  readonly searches: string[] = [];
  readonly display = (name: string) => `#${name}`;
  search(text: string): void {
    this.searches.push(text);
    this.results.set(text ? ['Dana', 'Dvora'] : ['Avi', 'Batya']);
  }
}

@Component({
  imports: [UiSelect, UiOption],
  template: `
    <ui-select aria-label="Status" [(value)]="value">
      <ui-option value="draft">{{ draftLabel() }}</ui-option>
    </ui-select>
  `,
})
class DynamicLabelHost {
  readonly value = signal<string | null>('draft');
  readonly draftLabel = signal('Draft');
}

describe('UiSelect option labels', () => {
  it('updates the trigger when the option text changes', async () => {
    const fixture = TestBed.createComponent(DynamicLabelHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const control = root.querySelector<HTMLElement>('.ui-select__control')!;
    expect(control.textContent).toContain('Draft');

    fixture.componentInstance.draftLabel.set('טיוטה');
    await settle(fixture);
    await settle(fixture);
    expect(control.textContent).toContain('טיוטה');
  });
});

describe('UiSelect with server-side search', () => {
  it('activates the first new result instead of a removed option', async () => {
    const fixture = TestBed.createComponent(ServerSearchHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const control = root.querySelector<HTMLInputElement>('.ui-select__control')!;
    control.value = 'd';
    control.dispatchEvent(new Event('input'));
    await settle(fixture);

    const active = document.getElementById(control.getAttribute('aria-activedescendant')!);
    expect(active!.textContent?.trim()).toBe('Dana');
    keydown(control, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toBe('Dana');
    root.remove();
  });

  it('keeps the label of the selected value and resets the search when the list closes', async () => {
    const fixture = TestBed.createComponent(ServerSearchHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const control = root.querySelector<HTMLInputElement>('.ui-select__control')!;
    control.value = 'd';
    control.dispatchEvent(new Event('input'));
    await settle(fixture);
    keydown(control, 'Enter');
    await settle(fixture);

    const host = fixture.componentInstance;
    expect(host.searches.at(-1)).toBe('');
    expect(host.results()).toEqual(['Avi', 'Batya']);
    expect(control.value).toBe('Dana');
    root.remove();
  });

  it('labels a value that is not in the list with displayWith', async () => {
    const fixture = TestBed.createComponent(ServerSearchHost);
    fixture.componentInstance.value.set('Zeev');
    await settle(fixture);
    const control = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(control.value).toBe('#Zeev');
  });
});

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
    // The listbox is not rendered while closed.
    expect(button.hasAttribute('aria-controls')).toBe(false);
    expect(root.querySelector('label')!.getAttribute('for')).toBe(button.id);
    const hint = document.getElementById(button.getAttribute('aria-describedby')!);
    expect(hint!.textContent).toContain('Approves the plan');
    expect(button.textContent?.trim()).toBe('Choose');
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
    expect(control().textContent?.trim()).toBe('Yael');
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

  it('closes an open list when it becomes disabled', async () => {
    await open();
    fixture.componentInstance.disabled.set(true);
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('opens at the first or last option with Home and End', async () => {
    keydown(control(), 'Home');
    await settle(fixture);
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[0].id);
    keydown(control(), 'Escape');
    await settle(fixture);
    keydown(control(), 'End');
    await settle(fixture);
    expect(control().getAttribute('aria-activedescendant')).toBe(options()[3].id);
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

  it('jumps to a matching option when typing', () => {
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

    it('closes an open list from the chevron', async () => {
      await type('y');
      expect(listbox()).not.toBeNull();
      root.querySelector<HTMLElement>('.ui-select__chevron')!.click();
      await settle(fixture);
      expect(listbox()).toBeNull();
    });

    it('does not submit the search text under the name', () => {
      expect(control().hasAttribute('name')).toBe(false);
    });

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

interface City {
  id: number;
  name: string;
}

/** Reactive forms show the message of an error value that is a string. */
const chooseACity: ValidatorFn = (control) =>
  control.value ? null : { chooseCity: 'Choose a city' };

@Component({
  imports: [UiSelect, UiOption, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="City">
      <ui-select [formControl]="control" [compareWith]="byId" [readonly]="locked()">
        @for (city of cities; track city.id) {
          <ui-option [value]="city">{{ city.name }}</ui-option>
        }
      </ui-select>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly locked = signal(false);
  readonly cities: City[] = [
    { id: 1, name: 'Haifa' },
    { id: 2, name: 'Tel Aviv' },
  ];
  readonly control = new FormControl<City | null>({ id: 2, name: 'Tel Aviv' }, [
    Validators.required,
    chooseACity,
  ]);
  readonly byId = (option: City, selected: City) => option.id === selected.id;
}

describe('UiSelect with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let host: ReactiveHost;
  let root: HTMLElement;
  let loader: HarnessLoader;
  const select = () => loader.getHarness(UiSelectHarness.with({ label: 'City' }));
  const trigger = () => root.querySelector<HTMLButtonElement>('.ui-select__control')!;
  /** The message `ui-form-field` shows under the select. */
  const errorText = () => root.querySelector('.ui-form-field__error')?.textContent?.trim() ?? '';

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    loader = TestbedHarnessEnvironment.loader(fixture);
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('binds the value both ways using compareWith', async () => {
    const city = await select();
    expect(await city.getValueText()).toBe('Tel Aviv');

    await city.clickOptions({ text: 'Haifa' });
    expect(host.control.value).toEqual({ id: 1, name: 'Haifa' });

    host.control.setValue({ id: 2, name: 'Tel Aviv' });
    await settle(fixture);
    expect(await city.getValueText()).toBe('Tel Aviv');
  });

  it('marks the field required from the validators of the control', async () => {
    expect(await (await select()).isRequired()).toBe(true);
    expect(root.querySelector('.ui-form-field__required')).not.toBeNull();
  });

  it('disables the trigger from the control', async () => {
    const city = await select();
    host.control.disable();
    await settle(fixture);
    expect(await city.isDisabled()).toBe(true);
    expect(trigger().disabled).toBe(true);
    await city.open();
    expect(await city.isOpen()).toBe(false);
  });

  it('stays focusable but does not open while readonly', async () => {
    const city = await select();
    host.locked.set(true);
    await settle(fixture);
    expect(await city.isReadonly()).toBe(true);
    expect(trigger().disabled).toBe(false);
    await city.open();
    expect(await city.isOpen()).toBe(false);
  });

  it('closes the list and marks the control touched when focus leaves', async () => {
    const city = await select();
    await city.open();
    expect(await city.isOpen()).toBe(true);
    expect(host.control.touched).toBe(false);

    await city.blur();
    await settle(fixture);
    expect(await city.isOpen()).toBe(false);
    expect(host.control.touched).toBe(true);
  });

  it('shows the validator message only once the control is invalid and touched', async () => {
    const city = await select();
    host.control.setValue(null);
    await settle(fixture);
    expect(host.control.invalid).toBe(true);
    expect(await city.isInvalid()).toBe(false);
    expect(errorText()).toBe('');

    await city.blur();
    await settle(fixture);
    expect(await city.isInvalid()).toBe(true);
    expect(errorText()).toContain('Choose a city');
    // The message is linked to the trigger, not only rendered next to it.
    const error = document.getElementById(trigger().getAttribute('aria-describedby')!);
    expect(error!.textContent).toContain('Choose a city');
  });
});

@Component({
  imports: [UiSelect, UiOption],
  template: `
    <ui-select
      aria-label="Coordinator"
      [(value)]="value"
      [readonly]="locked()"
      [searchable]="searchable()"
    >
      <ui-option value="dana">Dana</ui-option>
      <ui-option value="yael">Yael</ui-option>
    </ui-select>
  `,
})
class ReadonlySelectHost {
  readonly searchable = signal(false);
  readonly locked = signal(true);
  readonly value = signal<string | null>('dana');
}

describe('UiSelect readonly', () => {
  let fixture: ComponentFixture<ReadonlySelectHost>;
  const control = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="combobox"]')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReadonlySelectHost);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
  });

  afterEach(() => (fixture.nativeElement as HTMLElement).remove());

  it('does not open while readonly and stays focusable', async () => {
    expect(control().getAttribute('aria-readonly')).toBe('true');
    expect((control() as HTMLButtonElement).disabled).toBe(false);
    expect(control().getAttribute('aria-label')).toBe('Coordinator');
    expect(control().closest('ui-select')!.hasAttribute('aria-label')).toBe(false);
    control().click();
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    expect(listbox()).toBeNull();
    expect(fixture.componentInstance.value()).toBe('dana');
  });

  it('makes the search field readonly', async () => {
    fixture.componentInstance.searchable.set(true);
    await settle(fixture);
    expect((control() as HTMLInputElement).readOnly).toBe(true);
  });

  it('closes an open list when it becomes readonly', async () => {
    fixture.componentInstance.locked.set(false);
    await settle(fixture);
    control().click();
    await settle(fixture);
    expect(listbox()).not.toBeNull();
    fixture.componentInstance.locked.set(true);
    await settle(fixture);
    expect(listbox()).toBeNull();
  });
});

@Component({
  imports: [UiSelect, UiOption],
  template: `
    <ui-select
      aria-label="Coordinator"
      clearable
      [loading]="loading()"
      [disabled]="disabled()"
      [(value)]="value"
      (valueChange)="changes.push($event)"
    >
      <ui-option value="dana">
        <span uiOptionIcon class="icon">D</span>
        Dana Levi
        <span uiOptionDescription>Coordinator</span>
      </ui-option>
      <ui-option value="yossi">Yossi</ui-option>
    </ui-select>
  `,
})
class ExtrasHost {
  readonly value = signal<string | null>('dana');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly changes: (string | null)[] = [];
}

describe('UiSelect clearable, loading and option slots', () => {
  let fixture: ComponentFixture<ExtrasHost>;
  const root = () => fixture.nativeElement as HTMLElement;
  const clear = () => root().querySelector<HTMLButtonElement>('.ui-select__clear');
  const control = () => root().querySelector<HTMLButtonElement>('[role="combobox"]')!;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideUiLabels(UI_LABELS_EN)],
    });
    fixture = TestBed.createComponent(ExtrasHost);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
  });

  afterEach(() => (fixture.nativeElement as HTMLElement).remove());

  it('shows the label slot only in the trigger', () => {
    expect(control().textContent?.trim()).toBe('Dana Levi');
  });

  it('clears the value with the clear button without opening the list', async () => {
    const button = clear()!;
    expect(button.getAttribute('aria-label')).toBe('Clear');
    button.click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.changes).toEqual([null]);
    expect(listbox()).toBeNull();
    expect(document.activeElement).toBe(control());
    expect(clear()).toBeNull();
  });

  it('hides the clear button while disabled', async () => {
    fixture.componentInstance.disabled.set(true);
    await settle(fixture);
    expect(clear()).toBeNull();
  });

  it('shows a spinner and a busy list while loading', async () => {
    fixture.componentInstance.loading.set(true);
    await settle(fixture);
    expect(root().querySelector('ui-spinner.ui-select__spinner')).not.toBeNull();
    control().click();
    await settle(fixture);
    expect(listbox()?.getAttribute('aria-busy')).toBe('true');
    expect(listbox()?.querySelector('.ui-select__loading')?.textContent?.trim()).toBe('Loading');
  });

  it('renders the icon and the description of an option', async () => {
    control().click();
    await settle(fixture);
    const [dana] = options();
    expect(dana.querySelector('.ui-option__icon .icon')?.textContent).toBe('D');
    expect(dana.querySelector('.ui-option__description')?.textContent).toBe('Coordinator');
    expect(dana.querySelector('.ui-option__label')?.textContent?.trim()).toBe('Dana Levi');
  });
});

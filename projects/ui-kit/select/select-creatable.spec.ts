import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiOption, UiOptionItem } from '@vplans/ui-kit/listbox';
import { UiMultiSelect } from './multi-select';
import { UiSelect } from './select';

// The CDK key managers read the legacy keyCode.
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
};

function keydown(target: HTMLElement, key: string): KeyboardEvent {
  const keyCode = KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0);
  const event = new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** The viewport renders its window in an animation frame. */
async function frame(fixture: ComponentFixture<unknown>): Promise<void> {
  await settle(fixture);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle(fixture);
}

function type(control: HTMLInputElement, text: string): void {
  control.value = text;
  control.dispatchEvent(new Event('input'));
}

const options = () => [...document.querySelectorAll<HTMLElement>('ui-option:not([hidden])')];
const createOption = () => document.querySelector<HTMLElement>('ui-option.ui-listbox__create');
const emptyRow = () => document.querySelector('.ui-listbox__empty');
const activeId = (control: HTMLElement) => control.getAttribute('aria-activedescendant');

const LOCATIONS = ['Kitchen', 'Bathroom', 'Balcony'];

@Component({
  imports: [UiSelect, UiOption, ReactiveFormsModule],
  template: `
    <ui-select
      aria-label="Location"
      creatable
      [searchable]="searchable()"
      [maxLength]="maxLength()"
      [formControl]="control"
      (searchChange)="searches.push($event)"
    >
      @for (name of locations; track name) {
        <ui-option [value]="name">{{ name }}</ui-option>
      }
    </ui-select>
  `,
})
class SelectHost {
  readonly locations = LOCATIONS;
  readonly control = new FormControl<string | null>(null);
  readonly searchable = signal(true);
  readonly maxLength = signal<number | null>(null);
  readonly searches: string[] = [];
}

@Component({
  imports: [UiSelect, UiOption, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-select aria-label="Location" searchable creatable formControlName="location">
        @for (name of locations; track name) {
          <ui-option [value]="name">{{ name }}</ui-option>
        }
      </ui-select>
    </form>
  `,
})
class FormControlNameHost {
  readonly locations = LOCATIONS;
  readonly form = new FormGroup({ location: new FormControl<string | null>('Attic') });
}

@Component({
  imports: [UiMultiSelect, UiOption, FormsModule],
  template: `
    <ui-multi-select
      aria-label="Rooms"
      name="rooms"
      searchable
      creatable
      chips
      [selectAll]="selectAll()"
      [maxSelections]="maxSelections()"
      [(ngModel)]="rooms"
      (searchChange)="searches.push($event)"
    >
      @for (name of locations; track name) {
        <ui-option [value]="name">{{ name }}</ui-option>
      }
    </ui-multi-select>
  `,
})
class MultiNgModelHost {
  readonly locations = LOCATIONS;
  rooms: readonly string[] = ['Attic'];
  readonly selectAll = signal(false);
  readonly maxSelections = signal<number | null>(null);
  readonly searches: string[] = [];
}

/** `count` apartments as items. */
function apartments(count: number): UiOptionItem<string>[] {
  return Array.from({ length: count }, (_, i) => ({
    value: `Apartment ${i + 1}`,
    label: `Apartment ${i + 1}`,
  }));
}

@Component({
  imports: [UiSelect, UiMultiSelect, FormsModule],
  template: `
    @if (multiple()) {
      <ui-multi-select
        aria-label="Apartments"
        name="apartments"
        searchable
        creatable
        selectAll
        [items]="items"
        [(ngModel)]="apartments"
      />
    } @else {
      <ui-select
        aria-label="Apartment"
        name="apartment"
        searchable
        creatable
        [items]="items"
        [(ngModel)]="apartment"
      />
    }
  `,
})
class ItemsHost {
  readonly items = apartments(300);
  readonly multiple = signal(false);
  apartment: string | null = null;
  apartments: readonly string[] = [];
}

// jsdom has no Element.scrollTo, which the viewport calls to bring an option into view.
beforeAll(() => {
  Element.prototype.scrollTo = () => undefined;
});

afterAll(() => {
  delete (Element.prototype as Partial<Element>).scrollTo;
});

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
});

describe('UiSelect creatable', () => {
  let fixture: ComponentFixture<SelectHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLInputElement>('.ui-select__control')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SelectHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('offers the search text as the first, active option and adds it with Enter', async () => {
    type(control(), '  Storage room ');
    await settle(fixture);
    const add = createOption()!;
    expect(add.textContent!.trim()).toBe('Add «Storage room»');
    expect(add.getAttribute('role')).toBe('option');
    expect(add.getAttribute('aria-selected')).toBe('false');
    // Nothing else matches: the option is active and named by aria-activedescendant.
    expect(activeId(control())).toBe(add.id);
    // It is something to pick, so the list has no "no options" row.
    expect(emptyRow()).toBeNull();

    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('Storage room');
    expect(fixture.componentInstance.control.dirty).toBe(true);
    expect(control().getAttribute('aria-expanded')).toBe('false');
    // A string value outside the list is its own label.
    expect(control().value).toBe('Storage room');
    expect(fixture.componentInstance.searches.at(-1)).toBe('');
  });

  it('adds the search text when the option is clicked', async () => {
    type(control(), 'Pantry');
    await settle(fixture);
    createOption()!.click();
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('Pantry');
  });

  it('keeps a matching option active above the add option', async () => {
    type(control(), 'bal');
    await settle(fixture);
    const [add, balcony] = options();
    expect(add).toBe(createOption()!);
    expect(balcony.textContent!.trim()).toBe('Balcony');
    expect(activeId(control())).toBe(balcony.id);

    keydown(control(), 'ArrowUp');
    await settle(fixture);
    expect(activeId(control())).toBe(add.id);
    expect(add.classList).toContain('ui-option--active');
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('bal');
  });

  it('does not offer text that equals an option label or the value', async () => {
    type(control(), ' kitchen ');
    await settle(fixture);
    expect(createOption()).toBeNull();
    keydown(control(), 'Escape');
    await settle(fixture);

    fixture.componentInstance.control.setValue('Attic');
    await settle(fixture);
    type(control(), 'ATTIC');
    await settle(fixture);
    expect(createOption()).toBeNull();
    expect(emptyRow()!.textContent!.trim()).toBe('No options');
  });

  it('adds with Enter typed before the add option is rendered', async () => {
    type(control(), 'Laundry');
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('Laundry');
  });

  it('does not pick an option the search has just hidden', async () => {
    type(control(), 'k');
    await settle(fixture);
    type(control(), 'kx');
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('kx');
  });

  it('shows a written string value outside the list as its own label', async () => {
    fixture.componentInstance.control.setValue('Guest toilet');
    await settle(fixture);
    expect(control().value).toBe('Guest toilet');
  });

  it('limits the search text with maxLength', async () => {
    expect(control().hasAttribute('maxlength')).toBe(false);
    fixture.componentInstance.maxLength.set(20);
    await settle(fixture);
    expect(control().getAttribute('maxlength')).toBe('20');
  });

  it('offers nothing to add without searchable, but still labels a string value', async () => {
    fixture.componentInstance.searchable.set(false);
    fixture.componentInstance.control.setValue('Guest toilet');
    await settle(fixture);
    const button = root.querySelector<HTMLElement>('.ui-select__control')!;
    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent!.trim()).toBe('Guest toilet');
    keydown(button, 'ArrowDown');
    await settle(fixture);
    expect(createOption()).toBeNull();
    expect(options()).toHaveLength(3);
  });
});

describe('UiSelect creatable with formControlName', () => {
  it('shows the group value and writes a created value back', async () => {
    const fixture = TestBed.createComponent(FormControlNameHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const control = root.querySelector<HTMLInputElement>('.ui-select__control')!;
    expect(control.value).toBe('Attic');

    type(control, 'Basement');
    await settle(fixture);
    keydown(control, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.form.value).toEqual({ location: 'Basement' });
    expect(control.value).toBe('Basement');
    root.remove();
  });
});

describe('UiMultiSelect creatable with ngModel', () => {
  let fixture: ComponentFixture<MultiNgModelHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLInputElement>('.ui-select__control')!;
  const chips = () => [...root.querySelectorAll('ui-chip')].map((chip) => chip.textContent!.trim());

  beforeEach(async () => {
    fixture = TestBed.createComponent(MultiNgModelHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('shows a model value outside the list as its own chip', () => {
    expect(chips()).toEqual(['Attic']);
  });

  it('adds the text, clears the search and keeps the list open', async () => {
    type(control(), 'Pantry');
    await settle(fixture);
    expect(activeId(control())).toBe(createOption()!.id);
    keydown(control(), 'Enter');
    await settle(fixture);
    await settle(fixture);
    expect(fixture.componentInstance.rooms).toEqual(['Attic', 'Pantry']);
    expect(chips()).toEqual(['Attic', 'Pantry']);
    expect(control().value).toBe('');
    expect(fixture.componentInstance.searches.at(-1)).toBe('');
    expect(control().getAttribute('aria-expanded')).toBe('true');
    expect(createOption()).toBeNull();
    // The add option is gone; the first option is active instead.
    expect(activeId(control())).toBe(options()[0].id);
  });

  it('does not offer a selected value again', async () => {
    type(control(), 'attic');
    await settle(fixture);
    expect(createOption()).toBeNull();
  });

  it('lists the add option before "select all"', async () => {
    fixture.componentInstance.selectAll.set(true);
    await settle(fixture);
    type(control(), 'b');
    await settle(fixture);
    const [add, all, bathroom] = options();
    expect(add).toBe(createOption()!);
    expect(all.classList).toContain('ui-listbox__select-all');
    expect(bathroom.textContent!.trim()).toBe('Bathroom');
    // "Select all" covers the options the search shows, not the add option.
    all.click();
    await settle(fixture);
    expect(fixture.componentInstance.rooms).toEqual(['Attic', 'Bathroom', 'Balcony']);
  });

  it('offers nothing to add once maxSelections is reached', async () => {
    fixture.componentInstance.maxSelections.set(1);
    await settle(fixture);
    type(control(), 'Pantry');
    await settle(fixture);
    expect(createOption()).toBeNull();
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.rooms).toEqual(['Attic']);
  });
});

describe('UiSelect creatable with items', () => {
  let fixture: ComponentFixture<ItemsHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLInputElement>('.ui-select__control')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ItemsHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('opens the set of a virtual list with the add option', async () => {
    // "12" matches 13 apartments (12, 112, 120–129, 212) and no label.
    type(control(), '12');
    await frame(fixture);
    expect(document.querySelector('cdk-virtual-scroll-viewport')).not.toBeNull();
    const add = createOption()!;
    expect(add.closest('cdk-virtual-scroll-viewport')).toBeNull();
    expect(add.getAttribute('aria-posinset')).toBe('1');
    expect(add.getAttribute('aria-setsize')).toBe('14');
    const first = options()[1];
    expect(first.textContent!.trim()).toBe('Apartment 12');
    expect(first.getAttribute('aria-posinset')).toBe('2');
    expect(first.getAttribute('aria-setsize')).toBe('14');
    expect(activeId(control())).toBe(first.id);

    keydown(control(), 'ArrowUp');
    await settle(fixture);
    expect(activeId(control())).toBe(add.id);
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.apartment).toBe('12');
    expect(control().value).toBe('12');
  });

  it('counts "select all" after the add option of a multi-select', async () => {
    fixture.componentInstance.multiple.set(true);
    await settle(fixture);
    type(control(), '12');
    await frame(fixture);
    const all = document.querySelector<HTMLElement>('ui-option.ui-listbox__select-all')!;
    expect(createOption()!.getAttribute('aria-posinset')).toBe('1');
    expect(all.getAttribute('aria-posinset')).toBe('2');
    expect(all.getAttribute('aria-setsize')).toBe('15');
    expect(options()[2].getAttribute('aria-posinset')).toBe('3');
    expect(options()[2].getAttribute('aria-setsize')).toBe('15');
  });
});

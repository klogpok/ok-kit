import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiOption } from '@vplans/ui-kit/listbox';
import { UiMultiSelect } from './multi-select';
import { UiSelect } from './select';

// The rules of "Add «…»" (when it is shown, its place in the keyboard order, Enter right after
// typing, aria-posinset) are the listbox's: see `listbox/listbox.spec.ts`. These tests cover what
// a created value means to the field.

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

function type(control: HTMLInputElement, text: string): void {
  control.value = text;
  control.dispatchEvent(new Event('input'));
}

const options = () => [...document.querySelectorAll<HTMLElement>('ui-option:not([hidden])')];
const createOption = () => document.querySelector<HTMLElement>('ui-option.ui-listbox__create');
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
  readonly maxSelections = signal<number | null>(null);
  readonly searches: string[] = [];
}

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

  it('makes the trimmed search text the value with "Add «…»" and closes the list', async () => {
    type(control(), '  Storage room ');
    await settle(fixture);
    expect(createOption()!.textContent!.trim()).toBe('Add «Storage room»');

    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('Storage room');
    expect(fixture.componentInstance.control.dirty).toBe(true);
    expect(control().getAttribute('aria-expanded')).toBe('false');
    // A string value outside the list is its own label.
    expect(control().value).toBe('Storage room');
    expect(fixture.componentInstance.searches.at(-1)).toBe('');
  });

  it('does not offer the label of the value again', async () => {
    fixture.componentInstance.control.setValue('Attic');
    await settle(fixture);
    type(control(), 'ATTIC');
    await settle(fixture);
    expect(createOption()).toBeNull();
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

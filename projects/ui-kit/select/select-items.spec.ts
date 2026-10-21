import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UiMultiSelect } from './multi-select';
import { UiOptionItem } from '@vplans/ui-kit/listbox';
import { UiSelect } from './select';

// The CDK key managers read the legacy keyCode.
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
  Home: 36,
  End: 35,
  PageDown: 34,
  PageUp: 33,
  ' ': 32,
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

// jsdom has no Element.scrollTo, which the viewport calls to bring an option into view.
beforeAll(() => {
  Element.prototype.scrollTo = () => undefined;
});

afterAll(() => {
  delete (Element.prototype as Partial<Element>).scrollTo;
});

const options = () => [...document.querySelectorAll<HTMLElement>('ui-option')];

/** `count` apartments; every tenth one is disabled. */
function apartments(count: number): UiOptionItem<number>[] {
  return Array.from({ length: count }, (_, i) => ({
    value: i + 1,
    label: `Apartment ${i + 1}`,
    disabled: i % 10 === 9,
  }));
}

const SHORT: UiOptionItem<string>[] = [
  { value: 'dana', label: 'Dana', description: 'Coordinator' },
  { value: 'david', label: 'David', disabled: true },
  { value: 'yael', label: 'Yael' },
];

@Component({
  imports: [UiSelect, ReactiveFormsModule],
  template: `<ui-select aria-label="Apartment" [formControl]="control" [items]="items()" />`,
})
class SelectHost {
  readonly control = new FormControl<unknown>(null);
  readonly items = signal<readonly UiOptionItem[]>(apartments(1000));
}

@Component({
  imports: [UiMultiSelect],
  template: `
    <ui-multi-select
      aria-label="Apartments"
      selectAll
      [searchable]="searchable()"
      [items]="items()"
      [(value)]="value"
    />
  `,
})
class MultiHost {
  readonly items = signal(apartments(300));
  readonly value = signal<readonly number[]>([]);
  readonly searchable = signal(false);
}

@Component({
  imports: [UiSelect, FormsModule],
  template: `<ui-select aria-label="Apartment" [items]="items" [(ngModel)]="value" />`,
})
class NgModelHost {
  readonly items = apartments(300);
  value: number | null = 42;
}

// The listbox behavior of items (virtual scroll, keyboard, kept entries) is tested in
// listbox/listbox.spec.ts; these tests cover what the select fields add.
describe('UiSelect with items', () => {
  let fixture: ComponentFixture<SelectHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLElement>('.ui-select__control')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SelectHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.componentInstance.items.set(SHORT);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('selects an item on click and reports it to the form', async () => {
    control().click();
    await settle(fixture);
    options()[2].click();
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe('yael');
    expect(control().textContent!.trim()).toBe('Yael');
  });

  it('labels the value from the items without opening the list', async () => {
    fixture.componentInstance.control.setValue('dana');
    await settle(fixture);
    expect(control().textContent!.trim()).toBe('Dana');
  });

  it('labels an item that is not rendered in the trigger', async () => {
    fixture.componentInstance.items.set(apartments(1000));
    await settle(fixture);
    keydown(control(), 'End');
    await frame(fixture);
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe(999);
    expect(control().textContent!.trim()).toBe('Apartment 999');
  });
});

describe('UiSelect with items and ngModel', () => {
  it('shows the model value and writes the chosen item back', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const control = root.querySelector<HTMLElement>('.ui-select__control')!;
    expect(control.textContent!.trim()).toBe('Apartment 42');

    keydown(control, 'ArrowDown');
    await settle(fixture);
    keydown(control, 'ArrowDown');
    keydown(control, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value).toBe(43);
    root.remove();
  });
});

describe('UiMultiSelect with items', () => {
  let fixture: ComponentFixture<MultiHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLElement>('.ui-select__control')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(MultiHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('keeps "select all" above the viewport and selects every enabled item', async () => {
    control().click();
    await frame(fixture);
    const all = document.querySelector<HTMLElement>('.ui-listbox__select-all')!;
    expect(all.closest('cdk-virtual-scroll-viewport')).toBeNull();
    // "Select all" opens the set that the items continue.
    expect(all.getAttribute('aria-posinset')).toBe('1');
    expect(all.getAttribute('aria-setsize')).toBe('301');
    expect(options()[1].getAttribute('aria-posinset')).toBe('2');
    expect(options()[1].getAttribute('aria-setsize')).toBe('301');
    all.click();
    await settle(fixture);
    expect(fixture.componentInstance.value().length).toBe(270);
  });

  it('toggles items that are not rendered with the keyboard', async () => {
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    keydown(control(), 'End');
    keydown(control(), 'Enter');
    await settle(fixture);
    // 300 is disabled, like every tenth one.
    expect(fixture.componentInstance.value()).toEqual([299]);
  });

  it('opens a closed list at the last item with End and toggles it', async () => {
    fixture.componentInstance.searchable.set(true);
    fixture.componentInstance.value.set([3, 120]);
    await settle(fixture);
    keydown(control(), 'End');
    await frame(fixture);
    keydown(control(), 'Enter');
    await settle(fixture);
    // 300 is disabled, like every tenth one.
    expect(fixture.componentInstance.value()).toEqual([3, 120, 299]);
  });

  it('lists the labels of the selected items in the trigger', async () => {
    fixture.componentInstance.value.set([250, 3]);
    await settle(fixture);
    expect(control().textContent!.trim()).toBe('Apartment 3, Apartment 250');
  });
});

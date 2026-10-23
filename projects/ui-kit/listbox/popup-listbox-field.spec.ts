import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  forwardRef,
  model,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UiSize, ɵUiDropdownPanel as UiDropdownPanel } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiComboboxControl } from './combobox-control';
import { injectListbox } from './listbox-controller';
import { UiListbox } from './listbox';
import { UiOption } from './option';
import { UiPopupListboxField, provideUiPopupListboxField } from './popup-listbox-field';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** A minimal popup listbox field: a combobox input over the listbox controller. */
@Component({
  selector: 'ui-test-popup-field',
  imports: [CdkOverlayOrigin, UiComboboxControl, UiDropdownPanel, UiListbox],
  providers: [
    provideUiPopupListboxField(() => TestPopupField),
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TestPopupField), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <!-- uiComboboxControl sets aria-expanded and aria-controls. -->
      <!-- eslint-disable @angular-eslint/template/role-has-required-aria -->
      <input
        #control
        uiComboboxControl
        class="control"
        role="combobox"
        (click)="listbox.open({ activate: false })"
        (keydown)="listbox.handleKeydown($event)"
        (blur)="onBlur()"
      />
      <!-- eslint-enable @angular-eslint/template/role-has-required-aria -->
    </div>
    <ng-template [uiDropdownPanel]="origin" [open]="listbox.shown()" (closed)="close()">
      <ui-listbox><ng-content /></ui-listbox>
    </ng-template>
  `,
  host: { class: 'ui-test-field' },
})
class TestPopupField extends UiPopupListboxField<string | null> {
  readonly value = model<string | null>(null);

  private readonly content = contentChildren<UiOption<string>>(UiOption, { descendants: true });

  protected classPrefix(): string {
    return 'ui-test-field';
  }

  readonly listbox = injectListbox<string>({
    ...this.fieldListboxConfig(),
    mode: () => 'trigger',
    id: this.id,
    contentOptions: this.content,
    isSelected: (value) => value === this.value(),
    select: (value) => {
      this.value.set(value as string);
      this.notifyChange(value as string);
      this.close();
    },
  });

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }
}

@Component({
  imports: [TestPopupField, UiOption],
  template: `
    <ui-test-popup-field
      [id]="id()"
      [aria-label]="label()"
      [size]="size()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [invalid]="invalid()"
      (opened)="events.push('opened')"
      (closed)="events.push('closed')"
    >
      @for (fruit of fruits; track fruit) {
        <ui-option [value]="fruit">{{ fruit }}</ui-option>
      }
    </ui-test-popup-field>
  `,
})
class Host {
  readonly events: string[] = [];
  readonly fruits = ['Apple', 'Banana'];
  readonly id = signal('fruit');
  readonly label = signal('Fruit');
  readonly size = signal<UiSize>('md');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly invalid = signal(false);
}

describe('[uiComboboxControl] on a popup listbox field', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLInputElement>('.control')!;
  const field = () => root.querySelector<HTMLElement>('ui-test-popup-field')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('names a closed combobox and points nowhere', () => {
    expect(control().id).toBe('fruit-control');
    expect(control().getAttribute('aria-label')).toBe('Fruit');
    expect(control().getAttribute('aria-expanded')).toBe('false');
    expect(control().hasAttribute('aria-controls')).toBe(false);
    expect(control().hasAttribute('aria-activedescendant')).toBe(false);
    expect(control().hasAttribute('aria-required')).toBe(false);
    expect(control().hasAttribute('aria-invalid')).toBe(false);
    expect(control().hasAttribute('aria-describedby')).toBe(false);
  });

  it('points at the shown list and its active option while open, and nowhere once closed', async () => {
    control().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }),
    );
    await settle(fixture);
    expect(control().getAttribute('aria-expanded')).toBe('true');
    expect(control().getAttribute('aria-controls')).toBe('fruit-listbox');
    const active = document.getElementById(control().getAttribute('aria-activedescendant')!);
    expect((active?.textContent ?? '').trim()).toBe('Apple');

    control().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
    );
    await settle(fixture);
    expect(control().getAttribute('aria-expanded')).toBe('false');
    expect(control().hasAttribute('aria-controls')).toBe(false);
    expect(control().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('follows a new id and label of the field', async () => {
    host.label.set('');
    host.id.set('veg');
    await settle(fixture);
    expect(control().id).toBe('veg-control');
    expect(control().hasAttribute('aria-label')).toBe(false);
  });

  it('reports aria-readonly only while the field is readonly', async () => {
    expect(control().hasAttribute('aria-readonly')).toBe(false);

    host.readonly.set(true);
    await settle(fixture);
    expect(control().getAttribute('aria-readonly')).toBe('true');

    host.readonly.set(false);
    await settle(fixture);
    expect(control().hasAttribute('aria-readonly')).toBe(false);
  });

  it('emits opened and closed as the list opens and closes', async () => {
    control().click();
    await settle(fixture);
    expect(host.events).toEqual(['opened']);

    control().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
    );
    await settle(fixture);
    expect(host.events).toEqual(['opened', 'closed']);
  });

  it('closes the list when the inner control loses focus', async () => {
    control().click();
    await settle(fixture);
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(control().getAttribute('aria-expanded')).toBe('false');
    expect(host.events).toEqual(['opened', 'closed']);
  });

  it('builds the host classes from the field prefix', async () => {
    expect([...field().classList].sort()).toEqual(['ui-test-field', 'ui-test-field--md']);

    host.size.set('lg');
    host.disabled.set(true);
    host.readonly.set(true);
    host.invalid.set(true);
    await settle(fixture);
    expect([...field().classList].sort()).toEqual([
      'ui-test-field',
      'ui-test-field--disabled',
      'ui-test-field--invalid',
      'ui-test-field--lg',
      'ui-test-field--readonly',
    ]);
  });
});

/** Reactive forms show the message of an error value that is a string. */
const pickAFruit: ValidatorFn = (control) => (control.value ? null : { pick: 'Pick a fruit' });

@Component({
  imports: [TestPopupField, UiOption, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Fruit" hint="Pick one">
      <ui-test-popup-field
        id="fruit"
        [formControl]="fruit"
        aria-label="Fruit"
        aria-describedby="note"
      >
        <ui-option value="Apple">Apple</ui-option>
      </ui-test-popup-field>
    </ui-form-field>
    <p id="note">Seasonal</p>
  `,
})
class ReactiveHost {
  readonly fruit = new FormControl<string | null>(null, [Validators.required, pickAFruit]);
}

describe('[uiComboboxControl] on a popup listbox field with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLInputElement>('.control')!;
  const field = () => root.querySelector<HTMLElement>('ui-test-popup-field')!;
  const describedBy = () => (control().getAttribute('aria-describedby') ?? '').split(' ');
  const text = (id: string) => (document.getElementById(id)?.textContent ?? '').trim();

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('is required from the validators and described by the app note and the hint', () => {
    expect(control().getAttribute('aria-required')).toBe('true');
    expect(control().hasAttribute('aria-invalid')).toBe(false);
    expect(describedBy().map(text)).toEqual(['Seasonal', 'Pick one']);
  });

  it('is invalid once the empty control is touched, and described by its error', async () => {
    fixture.componentInstance.fruit.markAsTouched();
    await settle(fixture);
    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(describedBy().map(text)).toEqual(['Seasonal', 'Pick a fruit']);
  });

  it('marks the control touched when the inner control loses focus', async () => {
    const fruit = fixture.componentInstance.fruit;
    expect(fruit.touched).toBe(false);
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(fruit.touched).toBe(true);
    expect(control().getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps its id on the host and its label and descriptions on the inner control', () => {
    expect(field().id).toBe('fruit');
    expect(field().hasAttribute('aria-label')).toBe(false);
    expect(field().hasAttribute('aria-describedby')).toBe(false);
    expect(control().id).toBe('fruit-control');
    expect(control().getAttribute('aria-label')).toBe('Fruit');
    expect(root.querySelector('label')?.htmlFor).toBe('fruit-control');
  });
});

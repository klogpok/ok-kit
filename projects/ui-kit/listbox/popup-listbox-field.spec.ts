import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  forwardRef,
  input,
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
import {
  UI_FORM_FIELD_CONTROL,
  UiFormControlBase,
  ɵUiDropdownPanel as UiDropdownPanel,
} from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiComboboxControl, UI_POPUP_LISTBOX_FIELD } from './combobox-control';
import { injectListbox, provideUiListbox } from './listbox-controller';
import { UiListbox } from './listbox';
import { UiOption } from './option';

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
    { provide: UI_POPUP_LISTBOX_FIELD, useExisting: forwardRef(() => TestPopupField) },
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => TestPopupField) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TestPopupField), multi: true },
    provideUiListbox(),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <!-- uiComboboxControl sets aria-expanded and aria-controls. -->
      <!-- eslint-disable @angular-eslint/template/role-has-required-aria -->
      <input
        uiComboboxControl
        class="control"
        role="combobox"
        (click)="listbox.open({ activate: false })"
        (keydown)="listbox.handleKeydown($event)"
      />
      <!-- eslint-enable @angular-eslint/template/role-has-required-aria -->
    </div>
    <ng-template [uiDropdownPanel]="origin" [open]="listbox.shown()" (closed)="listbox.close()">
      <ui-listbox><ng-content /></ui-listbox>
    </ng-template>
  `,
})
class TestPopupField extends UiFormControlBase<string | null> {
  readonly id = input('fruit');
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly value = model<string | null>(null);
  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-control`);

  private readonly content = contentChildren<UiOption<string>>(UiOption, { descendants: true });

  readonly listbox = injectListbox<string>({
    mode: () => 'trigger',
    id: this.id,
    ariaLabel: this.ariaLabel,
    contentOptions: this.content,
    isSelected: (value) => value === this.value(),
    select: (value) => {
      this.value.set(value as string);
      this.notifyChange(value as string);
      this.listbox.close();
    },
  });

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  focus(): void {
    // Not needed by the contract spec.
  }
}

@Component({
  imports: [TestPopupField, UiOption],
  template: `
    <ui-test-popup-field [id]="id()" [aria-label]="label()">
      @for (fruit of fruits; track fruit) {
        <ui-option [value]="fruit">{{ fruit }}</ui-option>
      }
    </ui-test-popup-field>
  `,
})
class Host {
  readonly fruits = ['Apple', 'Banana'];
  readonly id = signal('fruit');
  readonly label = signal('Fruit');
}

describe('[uiComboboxControl] on a popup listbox field', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLInputElement>('.control')!;

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
});

/** Reactive forms show the message of an error value that is a string. */
const pickAFruit: ValidatorFn = (control) => (control.value ? null : { pick: 'Pick a fruit' });

@Component({
  imports: [TestPopupField, UiOption, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Fruit" hint="Pick one">
      <ui-test-popup-field [formControl]="fruit" aria-describedby="note">
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
});

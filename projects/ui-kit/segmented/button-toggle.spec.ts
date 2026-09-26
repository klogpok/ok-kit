import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormField, form, minLength, readonly } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiButtonToggle, UiButtonToggleGroup } from './button-toggle';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [UiButtonToggleGroup, UiButtonToggle, UiFormField],
  template: `
    <ui-form-field label="Working days" hint="Visits are booked on these days">
      <ui-button-toggle-group
        [(value)]="value"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [fullWidth]="fullWidth()"
        size="lg"
      >
        <button ui-button-toggle value="sun">Sun</button>
        <button ui-button-toggle value="mon">Mon</button>
        <button ui-button-toggle value="fri" disabled>Fri</button>
      </ui-button-toggle-group>
    </ui-form-field>
  `,
})
class StandaloneHost {
  readonly value = signal<readonly string[]>(['mon']);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly fullWidth = signal(false);
  readonly group = viewChild.required(UiButtonToggleGroup);
}

describe('UiButtonToggleGroup', () => {
  let fixture: ComponentFixture<StandaloneHost>;
  let host: StandaloneHost;
  let root: HTMLElement;
  let group: HTMLElement;
  let buttons: HTMLButtonElement[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(StandaloneHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    group = root.querySelector('ui-button-toggle-group')!;
    buttons = [...root.querySelectorAll<HTMLButtonElement>('button[ui-button-toggle]')];
  });

  afterEach(() => root.remove());

  it('is a group labelled and described by the form field', () => {
    const label = root.querySelector('label.ui-form-field__label')!;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(group.getAttribute('aria-describedby')).toBe(
      root.querySelector('.ui-form-field__hint')!.id,
    );
    expect(group.classList).toContain('ui-button-toggle-group--lg');
  });

  it('renders native toggle buttons with aria-pressed and a check mark when pressed', () => {
    expect(buttons.map((button) => button.type)).toEqual(['button', 'button', 'button']);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    expect(buttons[1].classList).toContain('ui-button-toggle--pressed');
    expect(buttons[1].querySelector('.ui-button-toggle__check')).not.toBeNull();
    expect(buttons[0].querySelector('.ui-button-toggle__check')).toBeNull();
  });

  it('toggles values on click, in the order they are pressed', async () => {
    buttons[0].click();
    await settle(fixture);
    expect(host.value()).toEqual(['mon', 'sun']);
    buttons[1].click();
    await settle(fixture);
    expect(host.value()).toEqual(['sun']);
    host.value.set(['sun', 'mon']);
    await settle(fixture);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the value when readonly, and the buttons stay focusable', async () => {
    host.readonly.set(true);
    await settle(fixture);
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[0].getAttribute('aria-disabled')).toBe('true');
    expect(buttons[2].hasAttribute('aria-disabled')).toBe(false);
    buttons[0].click();
    await settle(fixture);
    expect(host.value()).toEqual(['mon']);
  });

  it('disables single buttons and the whole group', async () => {
    expect(buttons[2].disabled).toBe(true);
    expect(group.hasAttribute('aria-disabled')).toBe(false);
    host.disabled.set(true);
    await settle(fixture);
    expect(buttons.every((button) => button.disabled)).toBe(true);
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(group.classList).toContain('ui-button-toggle-group--disabled');
  });

  it('stretches with fullWidth', async () => {
    host.fullWidth.set(true);
    await settle(fixture);
    expect(group.classList).toContain('ui-button-toggle-group--full-width');
  });

  it('focus() and a click on the field label focus the first pressed button', async () => {
    root.querySelector<HTMLElement>('label.ui-form-field__label')!.click();
    expect(document.activeElement).toBe(buttons[1]);
    host.value.set([]);
    await settle(fixture);
    host.group().focus();
    expect(document.activeElement).toBe(buttons[0]);
  });
});

@Component({
  imports: [UiButtonToggleGroup, UiButtonToggle, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-button-toggle-group formControlName="layers" aria-label="Layers">
        <button ui-button-toggle value="walls">Walls</button>
        <button ui-button-toggle value="pipes">Pipes</button>
      </ui-button-toggle-group>
    </form>
    <button type="button" class="outside">Outside</button>
  `,
})
class ReactiveHost {
  readonly form = new FormGroup({
    layers: new FormControl<readonly string[]>(['pipes'], Validators.required),
  });
}

describe('UiButtonToggleGroup with Reactive Forms', () => {
  it('writes and reads values, marks touched when focus leaves and follows disable()', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const control = fixture.componentInstance.form.controls.layers;
    const group = root.querySelector('ui-button-toggle-group')!;
    const buttons = root.querySelectorAll<HTMLButtonElement>('button[ui-button-toggle]');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    // aria-required is not allowed on role="group".
    expect(group.hasAttribute('aria-required')).toBe(false);

    buttons[1].focus();
    buttons[1].click();
    buttons[0].focus();
    await settle(fixture);
    expect(control.value).toEqual([]);
    expect(control.touched).toBe(false);
    root.querySelector<HTMLButtonElement>('.outside')!.focus();
    await settle(fixture);
    expect(control.touched).toBe(true);
    expect(group.getAttribute('aria-invalid')).toBe('true');

    control.setValue(null);
    await settle(fixture);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');

    control.disable();
    await settle(fixture);
    expect([...buttons].every((button) => button.disabled)).toBe(true);
    root.remove();
  });
});

@Component({
  imports: [UiButtonToggleGroup, UiButtonToggle, FormsModule],
  template: `
    <ui-button-toggle-group name="rooms" aria-label="Rooms" [(ngModel)]="rooms">
      <button ui-button-toggle [value]="1">1</button>
      <button ui-button-toggle [value]="2">2</button>
    </ui-button-toggle-group>
  `,
})
class NgModelHost {
  readonly rooms = signal<readonly number[]>([2]);
}

describe('UiButtonToggleGroup with ngModel', () => {
  it('binds both ways', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    await settle(fixture);
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    buttons[0].click();
    await settle(fixture);
    expect(fixture.componentInstance.rooms()).toEqual([2, 1]);
    fixture.componentInstance.rooms.set([]);
    await settle(fixture);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });
});

@Component({
  imports: [UiButtonToggleGroup, UiButtonToggle, FormField, UiFormField],
  template: `
    <ui-form-field label="Notify by">
      <ui-button-toggle-group [formField]="f.channels">
        <button ui-button-toggle value="sms">SMS</button>
        <button ui-button-toggle value="email">Email</button>
      </ui-button-toggle-group>
    </ui-form-field>
  `,
})
class SignalHost {
  readonly locked = signal(false);
  readonly model = signal<{ channels: readonly string[] }>({ channels: [] });
  readonly f = form(this.model, (p) => {
    minLength(p.channels, 1, { message: 'Choose at least one channel' });
    readonly(p.channels, () => this.locked());
  });
}

describe('UiButtonToggleGroup with Signal Forms', () => {
  it('binds the value, shows the error after touch and follows a readonly rule', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const host = fixture.componentInstance;
    const group = root.querySelector('ui-button-toggle-group')!;
    const buttons = root.querySelectorAll<HTMLButtonElement>('button');

    buttons[0].focus();
    buttons[0].blur();
    await settle(fixture);
    expect(host.f.channels().touched()).toBe(true);
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('.ui-form-field__error')!.textContent).toContain(
      'Choose at least one channel',
    );

    buttons[1].click();
    await settle(fixture);
    expect(host.model().channels).toEqual(['email']);
    expect(group.getAttribute('aria-invalid')).toBeNull();

    host.model.set({ channels: ['sms'] });
    await settle(fixture);
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');

    host.locked.set(true);
    await settle(fixture);
    buttons[1].click();
    await settle(fixture);
    expect(host.model().channels).toEqual(['sms']);
    root.remove();
  });
});

interface Layer {
  id: number;
  name: string;
}

@Component({
  imports: [UiButtonToggleGroup, UiButtonToggle],
  template: `
    <ui-button-toggle-group aria-label="Layers" [(value)]="value" [compareWith]="byId">
      @for (layer of layers; track layer.id) {
        <button ui-button-toggle [value]="layer">{{ layer.name }}</button>
      }
    </ui-button-toggle-group>
  `,
})
class CompareHost {
  readonly layers: Layer[] = [
    { id: 1, name: 'Walls' },
    { id: 2, name: 'Pipes' },
  ];
  readonly value = signal<readonly Layer[]>([{ id: 2, name: 'Pipes (old)' }]);
  readonly byId = (option: Layer, selected: Layer) => option.id === selected.id;
}

describe('UiButtonToggleGroup with compareWith', () => {
  it('presses the buttons equal to the selected objects and removes them by the same rule', async () => {
    const fixture = TestBed.createComponent(CompareHost);
    await settle(fixture);
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    buttons[1].click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([]);
  });
});

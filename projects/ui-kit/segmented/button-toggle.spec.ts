import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiButtonToggleGroupHarness } from '@vplans/ui-kit/testing';
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
        [orientation]="orientation()"
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
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
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

  it('stacks the buttons when vertical, without aria-orientation (not allowed on a group)', async () => {
    host.orientation.set('vertical');
    await settle(fixture);
    expect(group.classList).toContain('ui-button-toggle-group--vertical');
    expect(group.hasAttribute('aria-orientation')).toBe(false);
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

/** Stands in for an application validator with a message of its own. */
const atLeastOneChannel: ValidatorFn = (control) =>
  (control.value as readonly string[] | null)?.length
    ? null
    : { uiChannels: { message: 'Choose at least one channel' } };

@Component({
  imports: [UiButtonToggleGroup, UiButtonToggle, UiFormField, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-form-field label="Notify by">
        <ui-button-toggle-group formControlName="channels" [readonly]="locked()">
          <button ui-button-toggle value="sms">SMS</button>
          <button ui-button-toggle value="email">Email</button>
        </ui-button-toggle-group>
      </ui-form-field>
    </form>
    <button type="button" class="outside">Outside</button>
  `,
})
class ReactiveHost {
  readonly locked = signal(false);
  readonly form = new FormGroup({
    channels: new FormControl<readonly string[] | null>(
      ['email'],
      [Validators.required, atLeastOneChannel],
    ),
  });
}

describe('UiButtonToggleGroup with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let host: ReactiveHost;
  let control: ReactiveHost['form']['controls']['channels'];
  let root: HTMLElement;
  let group: UiButtonToggleGroupHarness;

  /** The message `ui-form-field` shows under the group. */
  const error = (): string =>
    root.querySelector('.ui-form-field__error')?.textContent?.trim() ?? '';

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    control = host.form.controls.channels;
    await settle(fixture);
    group = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      UiButtonToggleGroupHarness.with({ label: 'Notify by' }),
    );
  });

  afterEach(() => root.remove());

  it('binds the value both ways and marks the group required in the label', async () => {
    expect(await group.getPressedTexts()).toEqual(['Email']);
    // aria-required is not allowed on role="group", so the label carries the marker.
    expect(root.querySelector('ui-button-toggle-group')!.hasAttribute('aria-required')).toBe(false);
    expect(
      root.querySelector('.ui-form-field__required, .ui-form-field__required-text'),
    ).not.toBeNull();

    await group.toggle({ text: 'SMS' });
    await settle(fixture);
    expect(control.value).toEqual(['email', 'sms']);

    control.setValue(['sms']);
    await settle(fixture);
    expect(await group.getPressedTexts()).toEqual(['SMS']);
  });

  it('disables the buttons from the control', async () => {
    control.disable();
    await settle(fixture);
    expect(await group.isDisabled()).toBe(true);
  });

  it('keeps the value when the control is readonly', async () => {
    host.locked.set(true);
    await settle(fixture);
    await group.toggle({ text: 'SMS' });
    await settle(fixture);
    expect(control.value).toEqual(['email']);
    expect(await group.getPressedTexts()).toEqual(['Email']);
  });

  it('marks the control touched when focus leaves', async () => {
    await group.focus();
    expect(control.touched).toBe(false);
    await group.blur();
    await settle(fixture);
    expect(control.touched).toBe(true);
  });

  it('shows the validator message only once the control is invalid and touched', async () => {
    await group.toggle({ text: 'Email' });
    await settle(fixture);
    expect(control.value).toEqual([]);
    expect(control.invalid).toBe(true);
    expect(await group.isInvalid()).toBe(false);
    expect(error()).toBe('');

    await group.focus();
    await group.blur();
    await settle(fixture);
    expect(await group.isInvalid()).toBe(true);
    expect(error()).toContain('Choose at least one channel');

    await group.toggle({ text: 'SMS' });
    await settle(fixture);
    expect(await group.isInvalid()).toBe(false);
    expect(error()).toBe('');
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

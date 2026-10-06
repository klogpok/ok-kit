import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiSwitch } from './switch';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** Stands in for an application validator with a message of its own. */
const mustEnable: ValidatorFn = (control) =>
  control.value === true ? null : { uiBluetooth: { message: 'Turn Bluetooth on' } };

@Component({
  imports: [UiSwitch, ReactiveFormsModule, UiFormField],
  template: `
    <ui-switch id="plain" [(checked)]="checked" labelPosition="start" size="lg">Wi-Fi</ui-switch>
    <ui-form-field label="Bluetooth">
      <ui-switch id="reactive" [formControl]="control">Bluetooth</ui-switch>
    </ui-form-field>
  `,
})
class Host {
  readonly checked = signal(false);
  readonly control = new FormControl(true, [Validators.requiredTrue, mustEnable]);
}

describe('UiSwitch', () => {
  let fixture: ComponentFixture<Host>;
  const input = (id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id} input`)!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await settle(fixture);
  });

  it('renders a native checkbox with role="switch"', () => {
    const el = input('plain');
    expect(el.type).toBe('checkbox');
    expect(el.getAttribute('role')).toBe('switch');
    expect(el.checked).toBe(false);
    expect(el.hasAttribute('aria-checked')).toBe(false);
    expect(el.closest('label')?.textContent).toContain('Wi-Fi');
  });

  it('applies size and label position classes', () => {
    const host = (fixture.nativeElement as HTMLElement).querySelector('#plain')!;
    expect(host.classList).toContain('ui-switch--lg');
    expect(host.classList).toContain('ui-switch--label-start');
  });

  it('toggles the model and the native checked state', async () => {
    input('plain').click();
    await settle(fixture);
    expect(fixture.componentInstance.checked()).toBe(true);
    expect(input('plain').checked).toBe(true);
  });

  it('binds checked both ways and marks the field required', async () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(input('reactive').checked).toBe(true);
    expect(input('reactive').required).toBe(true);
    expect(root.querySelector('.ui-form-field__required')).not.toBeNull();

    input('reactive').click();
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toBe(false);

    fixture.componentInstance.control.setValue(true);
    await settle(fixture);
    expect(input('reactive').checked).toBe(true);
  });

  it('marks the control touched when the user leaves it', () => {
    expect(fixture.componentInstance.control.touched).toBe(false);
    input('reactive').dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('disables the switch from the control', async () => {
    fixture.componentInstance.control.disable();
    await settle(fixture);
    expect(input('reactive').disabled).toBe(true);
  });

  it('shows the validator message only once the control is invalid and touched', async () => {
    const error = () =>
      (fixture.nativeElement as HTMLElement).querySelector('.ui-form-field__error')!;
    fixture.componentInstance.control.setValue(false);
    await settle(fixture);
    expect(fixture.componentInstance.control.invalid).toBe(true);
    expect(input('reactive').hasAttribute('aria-invalid')).toBe(false);
    expect(error().textContent?.trim()).toBe('');

    input('reactive').dispatchEvent(new Event('blur'));
    await settle(fixture);
    expect(input('reactive').getAttribute('aria-invalid')).toBe('true');
    expect(error().textContent).toContain('Turn Bluetooth on');
    expect(input('reactive').getAttribute('aria-describedby')).toBe(error().id);

    input('reactive').click();
    await settle(fixture);
    expect(fixture.componentInstance.control.valid).toBe(true);
    expect(input('reactive').hasAttribute('aria-invalid')).toBe(false);
    expect(error().textContent?.trim()).toBe('');
  });
});

@Component({
  imports: [UiSwitch],
  // Simulates a bare attribute in non-strict templates (strictTemplates rejects it at compile time).
  template: `<ui-switch [checked]="$any('')">A</ui-switch>`,
})
class StaticAttributeHost {}

describe('UiSwitch static attributes', () => {
  it('treats a bare checked attribute as true', async () => {
    const fixture = TestBed.createComponent(StaticAttributeHost);
    await settle(fixture);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(input.checked).toBe(true);
  });
});

@Component({
  imports: [ReactiveFormsModule, UiSwitch],
  template: `<ui-switch aria-label="Alerts" [readonly]="true" [formControl]="alerts" />`,
})
class ReadonlySwitchHost {
  readonly alerts = new FormControl(true);
}

describe('UiSwitch readonly', () => {
  it('keeps the state of a bound control on click', async () => {
    const fixture = TestBed.createComponent(ReadonlySwitchHost);
    await settle(fixture);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.click();
    await settle(fixture);
    expect(fixture.componentInstance.alerts.value).toBe(true);
    expect(input.checked).toBe(true);
    expect(input.getAttribute('aria-readonly')).toBe('true');
    // Readonly is not disabled: the switch stays focusable.
    expect(input.disabled).toBe(false);
  });

  it('moves aria-label from the host to the native input', async () => {
    const fixture = TestBed.createComponent(ReadonlySwitchHost);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('input')!.getAttribute('aria-label')).toBe('Alerts');
    expect(root.querySelector('ui-switch')!.hasAttribute('aria-label')).toBe(false);
  });
});

@Component({
  imports: [FormsModule, UiSwitch],
  template: `<ui-switch name="consent" required [(ngModel)]="consent">Consent</ui-switch>`,
})
class RequiredSwitchHost {
  readonly consent = signal(false);
  readonly ngModel = viewChild.required(NgModel);
}

describe('UiSwitch required', () => {
  it('is invalid with ngModel + required until switched on', async () => {
    const fixture = TestBed.createComponent(RequiredSwitchHost);
    await settle(fixture);
    expect(fixture.componentInstance.ngModel().hasError('required')).toBe(true);
    (fixture.nativeElement as HTMLElement).querySelector('input')!.click();
    await settle(fixture);
    expect(fixture.componentInstance.ngModel().valid).toBe(true);
  });
});

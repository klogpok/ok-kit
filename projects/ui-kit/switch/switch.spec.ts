import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, readonly } from '@angular/forms/signals';
import { UiSwitch } from './switch';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [UiSwitch, ReactiveFormsModule, FormField],
  template: `
    <ui-switch id="plain" [(checked)]="checked" labelPosition="start" size="lg">Wi-Fi</ui-switch>
    <ui-switch id="reactive" [formControl]="control">Bluetooth</ui-switch>
    <ui-switch id="signal" [formField]="f.airplane">Airplane mode</ui-switch>
  `,
})
class Host {
  readonly checked = signal(false);
  readonly control = new FormControl(true);
  readonly model = signal({ airplane: false });
  readonly f = form(this.model);
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
    expect(el.getAttribute('aria-checked')).toBe('false');
    expect(el.closest('label')?.textContent).toContain('Wi-Fi');
  });

  it('applies size and label position classes', () => {
    const host = (fixture.nativeElement as HTMLElement).querySelector('#plain')!;
    expect(host.classList).toContain('ui-switch--lg');
    expect(host.classList).toContain('ui-switch--label-start');
  });

  it('toggles the model and aria-checked', async () => {
    input('plain').click();
    await settle(fixture);
    expect(fixture.componentInstance.checked()).toBe(true);
    expect(input('plain').getAttribute('aria-checked')).toBe('true');
  });

  it('works with Reactive Forms', async () => {
    expect(input('reactive').checked).toBe(true);
    input('reactive').click();
    expect(fixture.componentInstance.control.value).toBe(false);

    input('reactive').dispatchEvent(new Event('blur'));
    expect(fixture.componentInstance.control.touched).toBe(true);

    fixture.componentInstance.control.disable();
    await settle(fixture);
    expect(input('reactive').disabled).toBe(true);
  });

  it('works with Signal Forms', async () => {
    input('signal').click();
    await settle(fixture);
    expect(fixture.componentInstance.model().airplane).toBe(true);

    fixture.componentInstance.model.set({ airplane: false });
    await settle(fixture);
    expect(input('signal').checked).toBe(false);
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
    expect(input.getAttribute('aria-checked')).toBe('true');
  });
});

@Component({
  imports: [FormField, UiSwitch],
  template: `<ui-switch aria-label="Alerts" [formField]="f.alerts" />`,
})
class ReadonlySwitchHost {
  readonly model = signal({ alerts: true });
  readonly f = form(this.model, (p) => {
    readonly(p.alerts);
  });
}

describe('UiSwitch readonly', () => {
  it('keeps its state on click under a Signal Forms readonly rule', async () => {
    const fixture = TestBed.createComponent(ReadonlySwitchHost);
    await settle(fixture);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.click();
    await settle(fixture);
    expect(fixture.componentInstance.model().alerts).toBe(true);
    expect(input.checked).toBe(true);
    expect(input.getAttribute('aria-readonly')).toBe('true');
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

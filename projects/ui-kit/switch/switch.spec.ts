import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
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

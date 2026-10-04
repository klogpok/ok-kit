import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiNumberInputHarness } from '@vplans/ui-kit/testing';
import { UiNumberInput } from './number-input';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function keydown(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

@Component({
  imports: [UiNumberInput, UiFormField],
  template: `
    <ui-form-field label="Area">
      <ui-number-input
        [(value)]="value"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [maxFractionDigits]="digits()"
        [readonly]="readonly()"
        [disabled]="disabled()"
      />
    </ui-form-field>
  `,
})
class Host {
  readonly value = signal<number | null>(null);
  readonly min = signal<number | null>(0);
  readonly max = signal<number | null>(100);
  readonly step = signal(1);
  readonly digits = signal<number | null>(null);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
}

describe('UiNumberInput', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;
  const buttons = () => [...root.querySelectorAll<HTMLButtonElement>('.ui-number-input__step')];
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
  };
  const blur = async () => {
    input().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
  };
  const press = async (key: string) => {
    keydown(input(), key);
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
  });

  it('is a labelled spinbutton with its limits', async () => {
    host.value.set(40);
    await settle(fixture);
    expect(root.querySelector('label')!.htmlFor).toBe(input().id);
    expect(input().getAttribute('role')).toBe('spinbutton');
    expect(input().getAttribute('dir')).toBe('ltr');
    expect(input().getAttribute('inputmode')).toBe('decimal');
    expect(input().getAttribute('aria-valuenow')).toBe('40');
    expect(input().getAttribute('aria-valuemin')).toBe('0');
    expect(input().getAttribute('aria-valuemax')).toBe('100');
    const [down, up] = buttons();
    expect(down.getAttribute('aria-label')).toBe('הקטנה');
    expect(up.getAttribute('aria-label')).toBe('הגדלה');
    expect(up.tabIndex).toBe(-1);
    expect(up.getAttribute('aria-controls')).toBe(input().id);
  });

  it('uses the numeric keyboard for whole numbers', async () => {
    host.digits.set(0);
    await settle(fixture);
    expect(input().getAttribute('inputmode')).toBe('numeric');
  });

  it('sets the value while typing and formats it on blur', async () => {
    await type('1234.5');
    host.max.set(null);
    await settle(fixture);
    expect(host.value()).toBe(1234.5);
    expect(input().value).toBe('1234.5');
    await blur();
    expect(input().value).toBe('1,234.5');
  });

  it('clamps and rounds the value on blur', async () => {
    host.digits.set(1);
    await type('150');
    expect(host.value()).toBe(150);
    await blur();
    expect(host.value()).toBe(100);
    expect(input().value).toBe('100');

    await type('2.46');
    await press('Enter');
    expect(host.value()).toBe(2.5);
  });

  it('reports text that is not a number once the user leaves', async () => {
    host.value.set(5);
    await settle(fixture);
    await type('5x');
    expect(host.value()).toBeNull();
    expect(input().hasAttribute('aria-invalid')).toBe(false);
    await blur();
    expect(input().value).toBe('5x');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('.ui-form-field__error')!.textContent).toContain('מספר לא תקין');

    await type('');
    await blur();
    expect(input().hasAttribute('aria-invalid')).toBe(false);
  });

  it('steps with the arrow, page, Home and End keys within the limits', async () => {
    await press('ArrowUp');
    expect(host.value()).toBe(0);
    await press('ArrowUp');
    expect(host.value()).toBe(1);
    await press('PageUp');
    expect(host.value()).toBe(11);
    await press('ArrowDown');
    expect(host.value()).toBe(10);
    await press('End');
    expect(host.value()).toBe(100);
    await press('ArrowUp');
    expect(host.value()).toBe(100);
    await press('Home');
    expect(host.value()).toBe(0);
    await press('PageDown');
    expect(host.value()).toBe(0);
  });

  it('steps by decimals without floating point noise', async () => {
    host.step.set(0.1);
    host.value.set(0.2);
    await settle(fixture);
    await press('ArrowUp');
    expect(host.value()).toBe(0.3);
    expect(input().value).toBe('0.3');
  });

  it('leaves Home and End to the caret without limits', async () => {
    host.min.set(null);
    host.value.set(5);
    await settle(fixture);
    const event = new KeyboardEvent('keydown', { key: 'Home', cancelable: true });
    input().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(host.value()).toBe(5);
  });

  it('steps with the buttons and disables them at the limits', async () => {
    host.value.set(99);
    await settle(fixture);
    const [down, up] = buttons();
    up.click();
    await settle(fixture);
    expect(host.value()).toBe(100);
    expect(up.disabled).toBe(true);
    down.click();
    await settle(fixture);
    expect(host.value()).toBe(99);
  });

  it('steps once per press and repeats while a button is held', async () => {
    vi.useFakeTimers();
    try {
      host.value.set(10);
      await settle(fixture);
      const up = buttons()[1];
      up.dispatchEvent(
        new MouseEvent('pointerdown', { button: 0, bubbles: true, cancelable: true }),
      );
      expect(host.value()).toBe(11);
      expect(document.activeElement).toBe(input());
      vi.advanceTimersByTime(400 + 60 * 2);
      expect(host.value()).toBe(14);
      up.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      up.click();
      vi.advanceTimersByTime(1000);
      expect(host.value()).toBe(14);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not change while readonly or disabled', async () => {
    host.value.set(3);
    host.readonly.set(true);
    await settle(fixture);
    await press('ArrowUp');
    expect(host.value()).toBe(3);
    expect(buttons().every((button) => button.disabled)).toBe(true);
    expect(input().readOnly).toBe(true);

    host.readonly.set(false);
    host.disabled.set(true);
    await settle(fixture);
    expect(input().disabled).toBe(true);
  });

  it('shows a value that is not a finite number as empty', async () => {
    host.value.set(Number.NaN);
    await settle(fixture);
    expect(input().value).toBe('');
    expect(input().hasAttribute('aria-valuenow')).toBe(false);
  });

  it('offers stepUp and stepDown', async () => {
    const control = fixture.debugElement
      .query((el) => el.name === 'ui-number-input')
      .injector.get(UiNumberInput);
    host.value.set(5);
    await settle(fixture);
    control.stepUp(3);
    expect(host.value()).toBe(8);
    control.stepDown();
    expect(host.value()).toBe(7);
  });
});

/** Stands in for an application validator with a message of its own. */
const atMostForty: ValidatorFn = (control) =>
  typeof control.value === 'number' && control.value > 40
    ? { uiTooMany: { message: 'Up to 40 floors' } }
    : null;

@Component({
  imports: [UiNumberInput, UiFormField, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-form-field label="Floors">
        <ui-number-input min="1" max="40" formControlName="floors" />
      </ui-form-field>
      <ui-form-field label="Area">
        <ui-number-input formControlName="area" />
      </ui-form-field>
    </form>
  `,
})
class ReactiveHost {
  readonly form = new FormGroup({
    floors: new FormControl<number | null>(2, [Validators.required, atMostForty]),
    area: new FormControl<number | null>(null),
  });
}

describe('UiNumberInput with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let controls: ReactiveHost['form']['controls'];
  let loader: HarnessLoader;
  const field = (label: string) => loader.getHarness(UiNumberInputHarness.with({ label }));
  /** The `ui-form-field` that carries this label, for what the harness does not expose. */
  const fieldOf = (label: string): Element =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('ui-form-field')].find((it) =>
      it.querySelector('label')?.textContent.includes(label),
    )!;
  /** The message `ui-form-field` shows under the field with this label. */
  const errorOf = (label: string): string =>
    fieldOf(label).querySelector('.ui-form-field__error')?.textContent.trim() ?? '';

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    controls = fixture.componentInstance.form.controls;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await settle(fixture);
  });

  it('binds the value both ways and takes its limits from the inputs', async () => {
    const floors = await field('Floors');
    expect(await floors.getText()).toBe('2');
    expect(await floors.getMin()).toBe(1);
    expect(await floors.getMax()).toBe(40);
    expect(await floors.isRequired()).toBe(true);
    expect(fieldOf('Floors').querySelector('.ui-form-field__required')).not.toBeNull();

    await floors.increment();
    expect(controls.floors.value).toBe(3);

    controls.floors.setValue(7);
    await settle(fixture);
    expect(await floors.getText()).toBe('7');
  });

  it('disables the field from the control', async () => {
    const floors = await field('Floors');
    controls.floors.disable();
    await settle(fixture);
    expect(await floors.isDisabled()).toBe(true);
  });

  it('marks the control touched when the user leaves the field', async () => {
    const floors = await field('Floors');
    expect(controls.floors.touched).toBe(false);
    await floors.focus();
    await floors.blur();
    expect(controls.floors.touched).toBe(true);
  });

  it('shows the validator message only once the control is invalid and touched', async () => {
    const floors = await field('Floors');
    controls.floors.setValue(41);
    await settle(fixture);
    expect(controls.floors.invalid).toBe(true);
    expect(await floors.isInvalid()).toBe(false);
    expect(errorOf('Floors')).toBe('');

    await floors.focus();
    await floors.blur();
    await settle(fixture);
    expect(await floors.isInvalid()).toBe(true);
    expect(errorOf('Floors')).toContain('Up to 40 floors');
  });

  it('shows text that is not a number without failing the form', async () => {
    const area = await field('Area');
    await area.setText('abc');
    await area.blur();
    await settle(fixture);
    expect(controls.area.value).toBeNull();
    expect(controls.area.errors).toBeNull();
    expect(fixture.componentInstance.form.valid).toBe(true);
    expect(await area.isInvalid()).toBe(true);
    expect(errorOf('Area')).toContain('מספר לא תקין');

    await area.setText('5');
    await area.blur();
    await settle(fixture);
    expect(controls.area.value).toBe(5);
    expect(await area.isInvalid()).toBe(false);
    expect(errorOf('Area')).toBe('');
  });

  it('leaves validity to the validators of a control that has them', async () => {
    const floors = await field('Floors');
    await floors.setText('12x');
    await floors.blur();
    await settle(fixture);
    expect(controls.floors.value).toBeNull();
    // Invalid because the value is empty, not because the text does not parse.
    expect(Object.keys(controls.floors.errors ?? {})).toEqual(['required']);
    expect(errorOf('Floors')).toContain('מספר לא תקין');
  });

  it('drops the message when the value is written from the control', async () => {
    const area = await field('Area');
    await area.setText('abc');
    await area.blur();
    await settle(fixture);
    expect(await area.isInvalid()).toBe(true);

    controls.area.setValue(5);
    await settle(fixture);
    expect(await area.getText()).toBe('5');
    expect(await area.isInvalid()).toBe(false);

    await area.setText('abc');
    await area.blur();
    await settle(fixture);
    expect(await area.isInvalid()).toBe(true);
    // A reset writes `null` over a value that is already `null`: the text still has to go.
    controls.area.reset();
    await settle(fixture);
    expect(await area.getText()).toBe('');
    expect(await area.isInvalid()).toBe(false);
  });
});

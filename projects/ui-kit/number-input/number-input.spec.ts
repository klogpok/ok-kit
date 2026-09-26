import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, form, max, min, required } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
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

@Component({
  imports: [UiNumberInput, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Units">
      <ui-number-input [formControl]="control" />
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<number | null>(12);
}

describe('UiNumberInput with Reactive Forms', () => {
  it('binds the value both ways and reports parse errors as control errors', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const { control } = fixture.componentInstance;
    const input = root.querySelector('input')!;
    expect(input.value).toBe('12');

    input.value = '30';
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(control.value).toBe(30);

    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(control.value).toBeNull();
    expect(control.touched).toBe(true);
    expect(control.hasError('uiNumberParse')).toBe(true);
    expect(root.querySelector('.ui-form-field__error')!.textContent).toContain('מספר לא תקין');

    control.setValue(7);
    await settle(fixture);
    expect(input.value).toBe('7');
    expect(control.valid).toBe(true);

    control.disable();
    await settle(fixture);
    expect(input.disabled).toBe(true);
  });

  it('removes its parse validator when destroyed', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    await settle(fixture);
    const { control } = fixture.componentInstance;
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    input.value = 'x';
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(control.invalid).toBe(true);
    fixture.destroy();
    expect(control.valid).toBe(true);
  });
});

@Component({
  imports: [UiNumberInput, UiFormField, FormField],
  template: `
    <ui-form-field label="Floors">
      <ui-number-input [formField]="plan.floors" />
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ floors: number | null }>({ floors: 2 });
  readonly plan = form(this.model, (p) => {
    required(p.floors, { message: 'Enter the floors' });
    min(p.floors, 1);
    max(p.floors, 40);
  });
}

describe('UiNumberInput with Signal Forms', () => {
  it('binds the value, takes min and max from the rules and reports parse errors', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const host = fixture.componentInstance;
    const input = root.querySelector('input')!;
    expect(input.value).toBe('2');
    expect(input.getAttribute('aria-valuemin')).toBe('1');
    expect(input.getAttribute('aria-valuemax')).toBe('40');
    expect(input.getAttribute('aria-required')).toBe('true');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    await settle(fixture);
    expect(host.model().floors).toBe(3);

    input.value = '3a';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(host.model().floors).toBeNull();
    expect(host.plan.floors().touched()).toBe(true);
    expect(
      host.plan
        .floors()
        .errors()
        .map((e) => e.kind),
    ).toContain('uiNumberParse');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    host.plan().reset({ floors: 5 });
    await settle(fixture);
    expect(input.value).toBe('5');
    expect(host.plan.floors().errors()).toEqual([]);
  });
});

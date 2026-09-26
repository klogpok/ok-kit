import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, readonly, required } from '@angular/forms/signals';
import { of } from 'rxjs';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiDateRangePicker, UiDateRangePreset } from './date-range-picker';
import { UiDateRange } from './date-utils';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): void {
  const keyCode = { Escape: 27, Enter: 13, ArrowDown: 40 }[key];
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true, ...init }),
  );
}

/** Focus leaves the element to `relatedTarget` (outside the picker by default). */
function leave(target: Element, relatedTarget: Element | null = null): void {
  target.dispatchEvent(new FocusEvent('blur', { relatedTarget }));
  target.dispatchEvent(new FocusEvent('focusout', { relatedTarget, bubbles: true }));
}

const panel = () => document.querySelector<HTMLElement>('.ui-date-range-picker__panel');
const day = (key: string) => document.querySelector<HTMLElement>(`td[data-date="${key}"]`)!;
const range = (start: Date | null, end: Date | null): UiDateRange => ({ start, end });

@Component({
  imports: [UiDateRangePicker, UiFormField],
  template: `
    <ui-form-field label="Period">
      <ui-date-range-picker
        [(value)]="value"
        [minDate]="min"
        [maxDate]="max"
        [presets]="presets"
        (opened)="events.push('opened')"
        (closed)="events.push('closed')"
      />
    </ui-form-field>
  `,
})
class Host {
  readonly value = signal<UiDateRange | null>(null);
  readonly min = new Date(2026, 0, 1);
  readonly max = new Date(2026, 11, 31);
  readonly events: string[] = [];
  readonly presets: UiDateRangePreset[] = [
    { label: 'September', range: range(new Date(2026, 8, 1), new Date(2026, 8, 30)) },
    { label: 'First week', range: () => range(new Date(2026, 8, 7), new Date(2026, 8, 1)) },
  ];
}

describe('UiDateRangePicker', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const inputs = () => [...root.querySelectorAll<HTMLInputElement>('input')];
  const start = () => inputs()[0];
  const end = () => inputs()[1];
  const toggle = () => root.querySelector<HTMLButtonElement>('.ui-date-range-picker__toggle')!;
  const type = async (input: HTMLInputElement, text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
  };
  const blur = async (input: HTMLInputElement) => {
    leave(input);
    await settle(fixture);
  };
  const open = async () => {
    toggle().click();
    await settle(fixture);
  };
  const names = (input: HTMLInputElement) =>
    input
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((id) => document.getElementById(id)!.textContent.trim());

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('is a group named by the field label with named start and end fields', () => {
    const picker = root.querySelector('ui-date-range-picker')!;
    expect(picker.getAttribute('role')).toBe('group');
    const label = document.getElementById(picker.getAttribute('aria-labelledby')!)!;
    expect(label.textContent).toContain('Period');
    expect(names(start())).toEqual(['Period', 'תאריך התחלה']);
    expect(names(end())).toEqual(['Period', 'תאריך סיום']);
    expect(start().placeholder).toBe('DD.MM.YYYY');
    expect(start().getAttribute('dir')).toBe('ltr');
    expect(toggle().getAttribute('aria-label')).toBe('בחירת טווח תאריכים');
    expect(toggle().getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('focuses the start field from the label', async () => {
    root.querySelector<HTMLElement>('.ui-form-field__label')!.click();
    await settle(fixture);
    expect(document.activeElement).toBe(start());
  });

  it('parses both fields and formats them on blur', async () => {
    await type(start(), '05/09/26');
    expect(host.value()).toEqual(range(new Date(2026, 8, 5), null));
    await type(end(), '12.9.2026');
    expect(host.value()).toEqual(range(new Date(2026, 8, 5), new Date(2026, 8, 12)));
    await blur(end());
    expect(start().value).toBe('5.9.2026');
    expect(end().value).toBe('12.9.2026');
  });

  it('shows a written value and keeps an open end', async () => {
    host.value.set(range(null, new Date(2026, 9, 1)));
    await settle(fixture);
    expect(start().value).toBe('');
    expect(end().value).toBe('1.10.2026');
    host.value.set(null);
    await settle(fixture);
    expect(end().value).toBe('');
  });

  it('shows a value that is not a range as empty', async () => {
    host.value.set({ start: 'x', end: new Date(Number.NaN) } as unknown as UiDateRange);
    await settle(fixture);
    expect(start().value).toBe('');
    expect(end().value).toBe('');
  });

  it('marks the field with text that is not an allowed date once the user leaves it', async () => {
    await type(start(), '1.9.2026');
    await type(end(), '31.2.2026');
    expect(host.value()).toEqual(range(new Date(2026, 8, 1), null));
    expect(end().getAttribute('aria-invalid')).toBeNull();
    await blur(end());
    expect(end().value).toBe('31.2.2026');
    expect(end().getAttribute('aria-invalid')).toBe('true');
    expect(start().getAttribute('aria-invalid')).toBeNull();
    expect(root.textContent).toContain('תאריך לא תקין');

    await type(end(), '1.1.2027');
    await blur(end());
    expect(end().getAttribute('aria-invalid')).toBe('true');
    await type(end(), '');
    await blur(end());
    expect(end().getAttribute('aria-invalid')).toBeNull();
    expect(root.textContent).not.toContain('תאריך לא תקין');
  });

  it('rejects an end before the start in the field typed last', async () => {
    await type(start(), '10.9.2026');
    await type(end(), '5.9.2026');
    await blur(end());
    expect(host.value()).toEqual(range(new Date(2026, 8, 10), null));
    expect(end().getAttribute('aria-invalid')).toBe('true');
    expect(root.textContent).toContain('תאריך הסיום מוקדם מתאריך ההתחלה');

    await type(start(), '1.9.2026');
    expect(host.value()).toEqual(range(new Date(2026, 8, 1), new Date(2026, 8, 5)));
    await blur(start());
    expect(end().getAttribute('aria-invalid')).toBeNull();

    await type(start(), '20.9.2026');
    await blur(start());
    expect(host.value()).toEqual(range(null, new Date(2026, 8, 5)));
    expect(start().getAttribute('aria-invalid')).toBe('true');
  });

  it('opens a dialog with the calendar, picks the start and the end and closes', async () => {
    host.value.set(range(new Date(2026, 8, 10), null));
    await settle(fixture);
    await open();
    expect(panel()!.getAttribute('role')).toBe('dialog');
    expect(panel()!.getAttribute('aria-label')).toBe('בחירת טווח תאריכים');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(host.events).toEqual(['opened']);
    expect(document.activeElement).toBe(day('2026-09-10'));
    // One month when the screen is narrow (jsdom matches no media query).
    expect(panel()!.querySelectorAll('table')).toHaveLength(1);

    day('2026-09-03').click();
    await settle(fixture);
    expect(host.value()).toEqual(range(new Date(2026, 8, 3), null));
    expect(panel()).not.toBeNull();
    expect(start().value).toBe('3.9.2026');

    day('2026-09-08').click();
    await settle(fixture);
    expect(host.value()).toEqual(range(new Date(2026, 8, 3), new Date(2026, 8, 8)));
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(toggle());
    expect(host.events).toEqual(['opened', 'closed']);
  });

  it('opens with Alt+ArrowDown and closes with Escape', async () => {
    keydown(end(), 'ArrowDown', { altKey: true });
    await settle(fixture);
    expect(panel()).not.toBeNull();
    keydown(panel()!, 'Escape');
    await settle(fixture);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(toggle());
  });

  it('drops invalid text when a day is picked', async () => {
    await type(end(), 'abc');
    await blur(end());
    await open();
    day('2026-09-15').click();
    await settle(fixture);
    expect(host.value()).toEqual(range(new Date(2026, 8, 15), null));
    expect(end().value).toBe('');
    expect(end().getAttribute('aria-invalid')).toBeNull();
  });

  it('picks presets, also from a function, and puts their days in order', async () => {
    await open();
    const presets = panel()!.querySelector('.ui-date-range-picker__presets')!;
    expect(presets.getAttribute('role')).toBe('group');
    expect(presets.getAttribute('aria-label')).toBe('טווחים מוכנים');
    const buttons = [...presets.querySelectorAll('button')];
    expect(buttons.map((b) => b.textContent.trim())).toEqual(['September', 'First week']);
    buttons[1].click();
    await settle(fixture);
    expect(host.value()).toEqual(range(new Date(2026, 8, 1), new Date(2026, 8, 7)));
    expect(panel()).toBeNull();
    await open();
    panel()!.querySelector<HTMLButtonElement>('.ui-date-range-picker__preset')!.click();
    await settle(fixture);
    expect(end().value).toBe('30.9.2026');
  });

  it('clears both fields from the dialog', async () => {
    await open();
    expect(panel()!.querySelector('.ui-date-range-picker__footer')).toBeNull();
    keydown(panel()!, 'Escape');
    await settle(fixture);

    host.value.set(range(new Date(2026, 8, 1), new Date(2026, 8, 2)));
    await settle(fixture);
    await open();
    panel()!.querySelector<HTMLButtonElement>('.ui-date-range-picker__footer button')!.click();
    await settle(fixture);
    expect(host.value()).toBeNull();
    expect(start().value).toBe('');
  });

  it('closes on a click outside, but not on its own button', async () => {
    await open();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    expect(panel()).toBeNull();
    await open();
    toggle().click();
    await settle(fixture);
    expect(panel()).toBeNull();
  });
});

@Component({
  imports: [UiDateRangePicker],
  template: `<ui-date-range-picker aria-label="Stay" />`,
})
class WideHost {}

describe('UiDateRangePicker on wide screens', () => {
  it('shows two months and names the group by its aria-label', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            isMatched: () => true,
            observe: () => of({ matches: true, breakpoints: {} }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(WideHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const picker = root.querySelector('ui-date-range-picker')!;
    expect(picker.hasAttribute('aria-label')).toBe(false);
    expect(document.getElementById(picker.getAttribute('aria-labelledby')!)!.textContent).toBe(
      'Stay',
    );
    root.querySelector<HTMLButtonElement>('.ui-date-range-picker__toggle')!.click();
    await settle(fixture);
    expect(panel()!.classList).toContain('ui-date-range-picker__panel--wide');
    expect(panel()!.querySelectorAll('table')).toHaveLength(2);
    fixture.destroy();
    root.remove();
  });
});

@Component({
  imports: [UiDateRangePicker, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Period">
      <ui-date-range-picker [formControl]="control" />
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<UiDateRange | null>(
    range(new Date(2026, 8, 1), new Date(2026, 8, 5)),
    Validators.required,
  );
}

describe('UiDateRangePicker with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let root: HTMLElement;
  let control: FormControl<UiDateRange | null>;
  const inputs = () => [...root.querySelectorAll<HTMLInputElement>('input')];
  const type = async (input: HTMLInputElement, text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    root = fixture.nativeElement as HTMLElement;
    control = fixture.componentInstance.control;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('binds the value both ways and shows the required state', async () => {
    expect(inputs().map((i) => i.value)).toEqual(['1.9.2026', '5.9.2026']);
    expect(inputs()[0].getAttribute('aria-required')).toBe('true');
    await type(inputs()[1], '9.9.2026');
    expect(control.value).toEqual(range(new Date(2026, 8, 1), new Date(2026, 8, 9)));
    control.setValue(range(new Date(2026, 3, 1), new Date(2026, 3, 2)));
    await settle(fixture);
    expect(inputs().map((i) => i.value)).toEqual(['1.4.2026', '2.4.2026']);
  });

  it('reports parse and order errors to the control', async () => {
    await type(inputs()[0], 'abc');
    expect(control.hasError('uiDateParse')).toBe(true);
    expect(control.getError('uiDateParse')).toEqual({ message: 'תאריך לא תקין' });
    await type(inputs()[0], '10.9.2026');
    expect(control.hasError('uiDateParse')).toBe(false);
    expect(control.hasError('uiDateRangeOrder')).toBe(true);
    await type(inputs()[0], '');
    await type(inputs()[1], '');
    expect(control.value).toBeNull();
    expect(control.hasError('required')).toBe(true);
    expect(control.hasError('uiDateRangeOrder')).toBe(false);
  });

  it('clears the parse error when the form is reset', async () => {
    await type(inputs()[1], 'abc');
    control.reset(range(new Date(2026, 3, 1), null));
    await settle(fixture);
    expect(control.valid).toBe(true);
    expect(inputs().map((i) => i.value)).toEqual(['1.4.2026', '']);
    await type(inputs()[1], 'abc');
    control.reset();
    await settle(fixture);
    expect(control.hasError('uiDateParse')).toBe(false);
  });

  it('is not touched while focus moves between its fields', async () => {
    leave(inputs()[0], inputs()[1]);
    await settle(fixture);
    expect(control.touched).toBe(false);
    leave(inputs()[1]);
    await settle(fixture);
    expect(control.touched).toBe(true);
    expect(inputs()[0].getAttribute('aria-invalid')).toBeNull();
  });

  it('disables both fields and the calendar button', async () => {
    control.disable();
    await settle(fixture);
    expect(inputs().every((i) => i.disabled)).toBe(true);
    expect(root.querySelector('ui-date-range-picker')!.getAttribute('aria-disabled')).toBe('true');
    expect(root.querySelector<HTMLButtonElement>('.ui-date-range-picker__toggle')!.disabled).toBe(
      true,
    );
  });

  it('removes its validator when destroyed', async () => {
    await type(inputs()[0], 'abc');
    fixture.destroy();
    expect(control.valid).toBe(true);
    expect(control.hasValidator(Validators.required)).toBe(true);
  });
});

@Component({
  imports: [UiDateRangePicker, UiFormField, FormField],
  template: `
    <ui-form-field label="Period">
      <ui-date-range-picker [formField]="f.period" [minDate]="min" />
    </ui-form-field>
  `,
})
class SignalHost {
  readonly min = new Date(2026, 0, 1);
  readonly model = signal<{ period: UiDateRange | null }>({ period: null });
  readonly f = form(this.model, (p) => {
    required(p.period, { message: 'Choose the dates' });
  });
}

describe('UiDateRangePicker with Signal Forms', () => {
  let fixture: ComponentFixture<SignalHost>;
  let root: HTMLElement;
  const inputs = () => [...root.querySelectorAll<HTMLInputElement>('input')];
  const type = async (input: HTMLInputElement, text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(SignalHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('binds the value both ways', async () => {
    await type(inputs()[0], '3.3.2026');
    expect(fixture.componentInstance.model().period).toEqual(range(new Date(2026, 2, 3), null));
    fixture.componentInstance.model.set({
      period: range(new Date(2026, 6, 14), new Date(2026, 6, 20)),
    });
    await settle(fixture);
    expect(inputs().map((i) => i.value)).toEqual(['14.7.2026', '20.7.2026']);
  });

  it('shows the required error once touched', async () => {
    expect(inputs()[1].getAttribute('aria-required')).toBe('true');
    leave(inputs()[0]);
    await settle(fixture);
    expect(fixture.componentInstance.f.period().touched()).toBe(true);
    expect(inputs().every((i) => i.getAttribute('aria-invalid') === 'true')).toBe(true);
    expect(root.textContent).toContain('Choose the dates');
  });

  it('reports parse errors to the field and drops them on reset', async () => {
    const field = fixture.componentInstance.f.period;
    await type(inputs()[0], '31.12.2025');
    expect(
      field()
        .errors()
        .map((e) => e.kind),
    ).toContain('uiDateParse');
    leave(inputs()[0]);
    await settle(fixture);
    expect(root.textContent).toContain('תאריך לא תקין');

    fixture.componentInstance.f().reset();
    await settle(fixture);
    expect(inputs()[0].value).toBe('');
    expect(
      field()
        .errors()
        .map((e) => e.kind),
    ).not.toContain('uiDateParse');
  });
});

@Component({
  imports: [UiDateRangePicker, FormField],
  template: `<ui-date-range-picker aria-label="Period" [formField]="f.period" />`,
})
class ReadonlyHost {
  readonly model = signal<{ period: UiDateRange | null }>({
    period: range(new Date(2026, 3, 1), new Date(2026, 3, 3)),
  });
  readonly f = form(this.model, (p) => {
    readonly(p.period);
  });
}

describe('UiDateRangePicker readonly', () => {
  it('makes the fields readonly and does not open the calendar', async () => {
    const fixture = TestBed.createComponent(ReadonlyHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const inputs = [...root.querySelectorAll('input')];
    expect(inputs.every((i) => i.readOnly && !i.disabled)).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('.ui-date-range-picker__toggle')!.disabled).toBe(
      true,
    );
    keydown(inputs[0], 'ArrowDown', { altKey: true });
    await settle(fixture);
    expect(panel()).toBeNull();
    fixture.destroy();
    root.remove();
  });
});

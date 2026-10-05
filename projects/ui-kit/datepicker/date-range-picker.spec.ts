import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
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

// The calendar opens on today's month when nothing is selected, and these specs click days in
// September 2026 by key. Freeze the clock on the day the visual baselines use, so these specs do
// not depend on the day the suite runs and the calendar has one "today" across both layers.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

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

  it('drops typed text and its message when the model writes a value it cannot read', async () => {
    await type(end(), '31.2.2026');
    await blur(end());
    expect(end().value).toBe('31.2.2026');
    expect(root.textContent).toContain('תאריך לא תקין');

    host.value.set({ start: new Date(Number.NaN), end: null });
    await settle(fixture);
    expect(end().value).toBe('');
    expect(end().getAttribute('aria-invalid')).toBeNull();
    expect(root.textContent).not.toContain('תאריך לא תקין');
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
  imports: [UiDateRangePicker, UiFormField, UiError, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-form-field label="Period">
        <ui-date-range-picker formControlName="period" />
        <ui-error>Choose the dates</ui-error>
      </ui-form-field>
      <ui-form-field label="Window">
        <ui-date-range-picker formControlName="window" [minDate]="min" />
      </ui-form-field>
    </form>
  `,
})
class ReactiveHost {
  readonly min = new Date(2026, 0, 1);
  readonly form = new FormGroup({
    period: new FormControl<UiDateRange | null>(
      range(new Date(2026, 8, 1), new Date(2026, 8, 5)),
      Validators.required,
    ),
    window: new FormControl<UiDateRange | null>(range(new Date(2026, 8, 1), new Date(2026, 8, 5))),
  });
}

describe('UiDateRangePicker with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let root: HTMLElement;
  let controls: ReactiveHost['form']['controls'];
  const fieldOf = (label: string): HTMLElement =>
    [...root.querySelectorAll<HTMLElement>('ui-form-field')].find((it) =>
      it.querySelector('label')!.textContent.includes(label),
    )!;
  const inputs = (label: string) => [...fieldOf(label).querySelectorAll<HTMLInputElement>('input')];
  /** The message `ui-form-field` shows under the fields with this label. */
  const errorOf = (label: string): string =>
    fieldOf(label).querySelector('.ui-form-field__error')?.textContent.trim() ?? '';
  const type = async (input: HTMLInputElement, text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
  };
  const blur = async (input: HTMLInputElement) => {
    leave(input);
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    root = fixture.nativeElement as HTMLElement;
    controls = fixture.componentInstance.form.controls;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('binds the value both ways and shows the required state', async () => {
    expect(inputs('Period').map((i) => i.value)).toEqual(['1.9.2026', '5.9.2026']);
    expect(inputs('Period')[0].getAttribute('aria-required')).toBe('true');
    await type(inputs('Period')[1], '9.9.2026');
    expect(controls.period.value).toEqual(range(new Date(2026, 8, 1), new Date(2026, 8, 9)));
    controls.period.setValue(range(new Date(2026, 3, 1), new Date(2026, 3, 2)));
    await settle(fixture);
    expect(inputs('Period').map((i) => i.value)).toEqual(['1.4.2026', '2.4.2026']);
  });

  it('shows text that is not a date without failing the control', async () => {
    await type(inputs('Window')[0], 'abc');
    expect(controls.window.value).toEqual(range(null, new Date(2026, 8, 5)));
    expect(inputs('Window')[0].getAttribute('aria-invalid')).toBeNull();

    await blur(inputs('Window')[0]);
    expect(controls.window.errors).toBeNull();
    expect(controls.window.valid).toBe(true);
    expect(fixture.componentInstance.form.valid).toBe(true);
    expect(inputs('Window')[0].value).toBe('abc');
    expect(inputs('Window')[0].getAttribute('aria-invalid')).toBe('true');
    expect(inputs('Window')[1].getAttribute('aria-invalid')).toBeNull();
    expect(errorOf('Window')).toContain('תאריך לא תקין');

    await type(inputs('Window')[0], '2.9.2026');
    await blur(inputs('Window')[0]);
    expect(controls.window.value).toEqual(range(new Date(2026, 8, 2), new Date(2026, 8, 5)));
    expect(inputs('Window')[0].getAttribute('aria-invalid')).toBeNull();
    expect(errorOf('Window')).toBe('');
  });

  it('shows an end before the start without failing the control', async () => {
    await type(inputs('Window')[0], '10.9.2026');
    await blur(inputs('Window')[0]);
    expect(controls.window.value).toEqual(range(null, new Date(2026, 8, 5)));
    expect(controls.window.errors).toBeNull();
    expect(controls.window.valid).toBe(true);
    expect(inputs('Window')[0].getAttribute('aria-invalid')).toBe('true');
    expect(errorOf('Window')).toContain('תאריך הסיום מוקדם מתאריך ההתחלה');
  });

  it("shows the consumer's required message once both fields are empty", async () => {
    await type(inputs('Period')[0], '');
    await type(inputs('Period')[1], '');
    expect(controls.period.value).toBeNull();
    expect(controls.period.hasError('required')).toBe(true);
    await blur(inputs('Period')[1]);
    expect(controls.period.touched).toBe(true);
    expect(inputs('Period').every((i) => i.getAttribute('aria-invalid') === 'true')).toBe(true);
    expect(errorOf('Period')).toContain('Choose the dates');
  });

  it('drops typed text and its message when the control writes a value', async () => {
    await type(inputs('Window')[1], 'abc');
    await blur(inputs('Window')[1]);
    expect(inputs('Window')[1].getAttribute('aria-invalid')).toBe('true');

    controls.window.reset(range(new Date(2026, 3, 1), null));
    await settle(fixture);
    expect(controls.window.valid).toBe(true);
    expect(inputs('Window').map((i) => i.value)).toEqual(['1.4.2026', '']);
    expect(inputs('Window')[1].getAttribute('aria-invalid')).toBeNull();
    expect(errorOf('Window')).toBe('');

    // `null` written over `null`: only `writeValue` itself can drop the text here.
    await type(inputs('Window')[0], '');
    await type(inputs('Window')[0], 'abc');
    await blur(inputs('Window')[0]);
    expect(errorOf('Window')).toContain('תאריך לא תקין');
    controls.window.reset();
    await settle(fixture);
    expect(inputs('Window')[0].value).toBe('');
    expect(inputs('Window')[0].getAttribute('aria-invalid')).toBeNull();
    expect(errorOf('Window')).toBe('');
  });

  it('drops typed text and its message when a day is picked', async () => {
    await type(inputs('Window')[0], 'abc');
    await blur(inputs('Window')[0]);
    expect(inputs('Window')[0].getAttribute('aria-invalid')).toBe('true');
    fieldOf('Window').querySelector<HTMLButtonElement>('.ui-date-range-picker__toggle')!.click();
    await settle(fixture);
    day('2026-09-15').click();
    await settle(fixture);
    expect(controls.window.value).toEqual(range(new Date(2026, 8, 15), null));
    expect(inputs('Window')[0].value).toBe('15.9.2026');
    expect(inputs('Window')[0].getAttribute('aria-invalid')).toBeNull();
    expect(errorOf('Window')).toBe('');
  });

  it('is not touched while focus moves between its fields', async () => {
    leave(inputs('Period')[0], inputs('Period')[1]);
    await settle(fixture);
    expect(controls.period.touched).toBe(false);
    leave(inputs('Period')[1]);
    await settle(fixture);
    expect(controls.period.touched).toBe(true);
    expect(inputs('Period')[0].getAttribute('aria-invalid')).toBeNull();
  });

  it('disables both fields and the calendar button', async () => {
    controls.period.disable();
    await settle(fixture);
    expect(inputs('Period').every((i) => i.disabled)).toBe(true);
    expect(
      fieldOf('Period').querySelector('ui-date-range-picker')!.getAttribute('aria-disabled'),
    ).toBe('true');
    expect(
      fieldOf('Period').querySelector<HTMLButtonElement>('.ui-date-range-picker__toggle')!.disabled,
    ).toBe(true);
  });
});

@Component({
  imports: [UiDateRangePicker, ReactiveFormsModule],
  template: `
    @if (shown()) {
      <ui-date-range-picker aria-label="Period" [formControl]="control()" />
    }
  `,
})
class ConditionalHost {
  readonly shown = signal(true);
  readonly first = new FormControl<UiDateRange | null>(null);
  readonly second = new FormControl<UiDateRange | null>(null);
  readonly control = signal(this.first);
}

describe('UiDateRangePicker bound to a changing control', () => {
  let fixture: ComponentFixture<ConditionalHost>;
  let root: HTMLElement;
  const type = async (text: string) => {
    const input = root.querySelector<HTMLInputElement>('input')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ConditionalHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  // The field used to add a parse validator to the bound control and take it off again; now it
  // adds nothing, so no control it is bound to - or was bound to - may end up with a validator.
  it('adds no validator of its own, and leaves none behind', async () => {
    const { first, second } = fixture.componentInstance;
    await type('abc');
    expect(first.value).toBeNull();
    expect(first.valid).toBe(true);
    expect(first.validator).toBeNull();

    fixture.componentInstance.control.set(second);
    await settle(fixture);
    await type('xyz');
    expect(second.valid).toBe(true);
    expect(second.validator).toBeNull();

    fixture.componentInstance.shown.set(false);
    await settle(fixture);
    expect(first.valid).toBe(true);
    expect(second.valid).toBe(true);
  });
});

@Component({
  imports: [UiDateRangePicker],
  template: `<ui-date-range-picker aria-label="Period" readonly [value]="value" />`,
})
class ReadonlyHost {
  readonly value = range(new Date(2026, 3, 1), new Date(2026, 3, 3));
}

describe('UiDateRangePicker readonly', () => {
  it('makes the fields readonly and does not open the calendar', async () => {
    const fixture = TestBed.createComponent(ReadonlyHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const inputs = [...root.querySelectorAll('input')];
    expect(inputs.map((i) => i.value)).toEqual(['1.4.2026', '3.4.2026']);
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

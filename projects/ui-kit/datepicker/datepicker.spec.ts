import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, minDate, required } from '@angular/forms/signals';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiDatepicker } from './datepicker';

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

/** Focus leaves the element to outside the datepicker. */
function leave(target: Element, relatedTarget: Element | null = null): void {
  target.dispatchEvent(new FocusEvent('blur', { relatedTarget }));
  target.dispatchEvent(new FocusEvent('focusout', { relatedTarget, bubbles: true }));
}

const dialog = () => document.querySelector<HTMLElement>('.ui-datepicker__panel');

@Component({
  imports: [UiDatepicker, UiFormField],
  template: `
    <div [attr.dir]="dir()">
      <ui-form-field label="Signing date">
        <ui-datepicker [(value)]="value" [min]="min" [max]="max" />
      </ui-form-field>
    </div>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly value = signal<Date | null>(null);
  readonly min = new Date(2026, 0, 1);
  readonly max = new Date(2026, 11, 31);
}

describe('UiDatepicker', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;
  const toggle = () => root.querySelector<HTMLButtonElement>('.ui-datepicker__toggle')!;
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
  };
  const blur = async () => {
    leave(input());
    await settle(fixture);
  };

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

  it('labels the text field and shows the expected format', () => {
    const label = root.querySelector('label')!;
    expect(label.htmlFor).toBe(input().id);
    expect(input().placeholder).toBe('DD.MM.YYYY');
    expect(toggle().getAttribute('aria-label')).toBe('בחירת תאריך');
    expect(toggle().getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });

  it('parses typed dates in the locale format and formats them on blur', async () => {
    await type('05/09/26');
    expect(host.value()).toEqual(new Date(2026, 8, 5));
    expect(input().value).toBe('05/09/26');
    await blur();
    expect(input().value).toBe('5.9.2026');
  });

  it('shows a written value', async () => {
    host.value.set(new Date(2026, 11, 24));
    await settle(fixture);
    expect(input().value).toBe('24.12.2026');
  });

  it('marks invalid text only after the user leaves the field', async () => {
    host.value.set(new Date(2026, 8, 5));
    await settle(fixture);
    await type('31.2.2026');
    expect(host.value()).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
    await blur();
    expect(input().value).toBe('31.2.2026');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    const error = document.getElementById(input().getAttribute('aria-describedby')!);
    expect(error!.textContent).toContain('תאריך לא תקין');
    expect(root.querySelector('ui-form-field')!.classList).toContain('ui-form-field--invalid');

    await type('');
    await blur();
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('shows an Invalid Date or a string value as empty instead of failing', async () => {
    host.value.set(new Date(Number.NaN));
    await settle(fixture);
    expect(input().value).toBe('');
    host.value.set('2026-04-01' as unknown as Date);
    await settle(fixture);
    expect(input().value).toBe('');
    toggle().click();
    await settle(fixture);
    expect(dialog()).not.toBeNull();
  });

  it('drops invalid text when the value is changed elsewhere', async () => {
    await type('abc');
    await blur();
    host.value.set(new Date(2026, 3, 1));
    await settle(fixture);
    host.value.set(null);
    await settle(fixture);
    expect(input().value).toBe('');
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('rejects typed dates outside min and max', async () => {
    await type('1.1.2027');
    await blur();
    expect(host.value()).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('opens a modal dialog and focuses the selected day', async () => {
    host.value.set(new Date(2026, 8, 5));
    await settle(fixture);
    toggle().click();
    await settle(fixture);
    expect(dialog()!.getAttribute('role')).toBe('dialog');
    expect(dialog()!.getAttribute('aria-modal')).toBe('true');
    expect(dialog()!.getAttribute('aria-label')).toBe('בחירת תאריך');
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-09-05');
  });

  it('picks a day, closes and returns focus to the button', async () => {
    toggle().click();
    await settle(fixture);
    document.querySelector<HTMLElement>('td[data-date="2026-09-17"]')!.click();
    await settle(fixture);
    expect(host.value()).toEqual(new Date(2026, 8, 17));
    expect(dialog()).toBeNull();
    expect(input().value).toBe('17.9.2026');
    expect(document.activeElement).toBe(toggle());
  });

  it('closes with Escape and returns focus to the button', async () => {
    toggle().click();
    await settle(fixture);
    keydown(document.activeElement!, 'Escape');
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(toggle());
    expect(host.value()).toBeNull();
  });

  it('opens with Alt+ArrowDown in the field', async () => {
    input().focus();
    keydown(input(), 'ArrowDown', { altKey: true });
    await settle(fixture);
    expect(dialog()).not.toBeNull();
  });

  it('opens in the current text direction', async () => {
    host.dir.set('rtl');
    await settle(fixture);
    toggle().click();
    await settle(fixture);
    expect(dialog()!.closest('[dir]')!.getAttribute('dir')).toBe('rtl');
  });
});

@Component({
  imports: [UiDatepicker, UiFormField, UiError, ReactiveFormsModule],
  template: `
    <ui-form-field label="Date">
      <ui-datepicker [formControl]="control" />
      <ui-error>Choose a date</ui-error>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<Date | null>(new Date(2026, 3, 1), Validators.required);
}

describe('UiDatepicker with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('binds the value both ways', async () => {
    expect(input().value).toBe('1.4.2026');
    input().value = '2.4.2026';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(fixture.componentInstance.control.value).toEqual(new Date(2026, 3, 2));
    fixture.componentInstance.control.setValue(new Date(2026, 4, 9));
    await settle(fixture);
    expect(input().value).toBe('9.5.2026');
  });

  it('marks touched on blur and links the error', async () => {
    fixture.componentInstance.control.setValue(null);
    leave(input());
    await settle(fixture);
    expect(fixture.componentInstance.control.touched).toBe(true);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    const error = document.getElementById(input().getAttribute('aria-describedby')!);
    expect(error!.textContent).toContain('Choose a date');
  });

  it('reports unparsable text as a uiDateParse error until it is fixed', async () => {
    const control = fixture.componentInstance.control;
    input().value = 'abc';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(control.value).toBeNull();
    expect(control.hasError('uiDateParse')).toBe(true);
    expect(control.hasError('required')).toBe(true);

    leave(input());
    await settle(fixture);
    expect(input().getAttribute('aria-invalid')).toBe('true');

    input().value = '7.4.2026';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(control.valid).toBe(true);
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('clears the parse error when the form is reset', async () => {
    const control = fixture.componentInstance.control;
    input().value = 'abc';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    control.reset(new Date(2026, 3, 1));
    await settle(fixture);
    expect(control.valid).toBe(true);
    expect(input().value).toBe('1.4.2026');
  });

  it('is not touched while focus moves to its own calendar button', async () => {
    const control = fixture.componentInstance.control;
    leave(input(), root.querySelector('.ui-datepicker__toggle'));
    await settle(fixture);
    expect(control.touched).toBe(false);
  });

  it('is touched when the calendar closes without a pick', async () => {
    const control = fixture.componentInstance.control;
    root.querySelector<HTMLButtonElement>('.ui-datepicker__toggle')!.click();
    await settle(fixture);
    keydown(dialog()!, 'Escape');
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(control.touched).toBe(true);
  });

  it('disables the field and the calendar button', async () => {
    fixture.componentInstance.control.disable();
    await settle(fixture);
    expect(input().disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('.ui-datepicker__toggle')!.disabled).toBe(true);
  });
});

@Component({
  imports: [UiDatepicker, ReactiveFormsModule],
  template: `
    @if (shown()) {
      <ui-datepicker aria-label="Deadline" [formControl]="control()" />
    }
  `,
})
class ConditionalHost {
  readonly shown = signal(true);
  readonly first = new FormControl<Date | null>(null);
  readonly second = new FormControl<Date | null>(null);
  readonly control = signal(this.first);
}

describe('UiDatepicker parse validator', () => {
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

  it('is removed from the control when the datepicker is destroyed', async () => {
    const { first } = fixture.componentInstance;
    await type('abc');
    expect(first.hasError('uiDateParse')).toBe(true);

    fixture.componentInstance.shown.set(false);
    await settle(fixture);
    expect(first.valid).toBe(true);
    expect(first.validator).toBeNull();
  });

  it('moves to the new control when the bound control changes', async () => {
    const { first, second } = fixture.componentInstance;
    await type('abc');
    fixture.componentInstance.control.set(second);
    await settle(fixture);
    expect(first.valid).toBe(true);
    expect(first.validator).toBeNull();

    await type('xyz');
    expect(second.hasError('uiDateParse')).toBe(true);
  });
});

@Component({
  imports: [UiDatepicker, UiFormField, FormField],
  template: `
    <ui-form-field label="Date">
      <ui-datepicker [formField]="f.date" />
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ date: Date | null }>({ date: null });
  readonly f = form(this.model, (p) => {
    required(p.date, { message: 'Choose a date' });
    minDate(p.date, new Date(2026, 0, 1));
  });
}

describe('UiDatepicker with Signal Forms', () => {
  let fixture: ComponentFixture<SignalHost>;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SignalHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('binds the value both ways', async () => {
    input().value = '3.3.2026';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(fixture.componentInstance.model().date).toEqual(new Date(2026, 2, 3));
    fixture.componentInstance.model.set({ date: new Date(2026, 6, 14) });
    await settle(fixture);
    expect(input().value).toBe('14.7.2026');
  });

  it('shows the required state and the error once touched', async () => {
    expect(input().getAttribute('aria-required')).toBe('true');
    leave(input());
    await settle(fixture);
    expect(fixture.componentInstance.f.date().touched()).toBe(true);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(root.textContent).toContain('Choose a date');
  });

  it('reports unparsable text to the field and shows the message once touched', async () => {
    const field = fixture.componentInstance.f.date;
    input().value = '31.2.2026';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(field().invalid()).toBe(true);
    expect(
      field()
        .errors()
        .map((e) => e.kind),
    ).toContain('uiDateParse');
    expect(root.textContent).not.toContain('תאריך לא תקין');

    leave(input());
    await settle(fixture);
    expect(root.textContent).toContain('תאריך לא תקין');

    input().value = '3.3.2026';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(field().valid()).toBe(true);
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('takes min from minDate() in the schema', async () => {
    input().value = '31.12.2025';
    input().dispatchEvent(new Event('input'));
    leave(input());
    await settle(fixture);
    expect(fixture.componentInstance.model().date).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });
});

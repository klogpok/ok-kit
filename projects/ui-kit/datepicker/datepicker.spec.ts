import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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

  it('keeps the date text LTR and asks phones for a numeric keypad', () => {
    expect(input().getAttribute('dir')).toBe('ltr');
    expect(input().getAttribute('inputmode')).toBe('decimal');
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

  it('drops invalid text when a value that shows empty is written', async () => {
    await type('abc');
    await blur();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    host.value.set(new Date(Number.NaN));
    await settle(fixture);
    expect(input().value).toBe('');
    expect(input().getAttribute('aria-invalid')).toBeNull();
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

  it('picks today from the calendar dialog', async () => {
    toggle().click();
    await settle(fixture);
    const today = [
      ...dialog()!.querySelectorAll<HTMLButtonElement>('.ui-datepicker__footer button'),
    ];
    // No value yet: only "Today".
    expect(today.map((b) => b.textContent.trim())).toEqual(['היום']);
    today[0].click();
    await settle(fixture);
    const now = new Date();
    expect(host.value()).toEqual(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(toggle());
  });

  it('clears the value, or text that is not a date, from the calendar dialog', async () => {
    host.value.set(new Date(2026, 8, 16));
    await settle(fixture);
    toggle().click();
    await settle(fixture);
    const clear = () =>
      [...dialog()!.querySelectorAll<HTMLButtonElement>('.ui-datepicker__footer button')].find(
        (b) => b.textContent.trim() === 'ניקוי',
      )!;
    clear().click();
    await settle(fixture);
    expect(host.value()).toBeNull();
    expect(input().value).toBe('');

    await type('31.02.2026');
    await blur();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    toggle().click();
    await settle(fixture);
    clear().click();
    await settle(fixture);
    expect(input().value).toBe('');
    expect(input().hasAttribute('aria-invalid')).toBe(false);
  });

  it('disables Today when today is outside min and max', async () => {
    fixture.destroy();
    root.remove();
    @Component({
      imports: [UiDatepicker],
      template: `<ui-datepicker aria-label="Date" [min]="min" />`,
    })
    class FutureHost {
      readonly min = new Date(new Date().getFullYear() + 1, 0, 1);
    }
    const future = TestBed.createComponent(FutureHost);
    document.body.appendChild(future.nativeElement);
    await settle(future);
    (future.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.ui-datepicker__toggle')!
      .click();
    await settle(future);
    const today = dialog()!.querySelector<HTMLButtonElement>('.ui-datepicker__today')!;
    expect(today.getAttribute('aria-disabled')).toBe('true');
    today.click();
    await settle(future);
    expect(dialog()).not.toBeNull();
    future.destroy();
    (future.nativeElement as HTMLElement).remove();
  });
});

/** Reactive forms show the message of an error value that is a string. */
const notBefore2026: ValidatorFn = (control) =>
  !control.value || control.value >= new Date(2026, 0, 1) ? null : { uiMinDate: 'Too early' };

@Component({
  imports: [UiDatepicker, UiFormField, UiError, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-form-field label="Date">
        <ui-datepicker formControlName="date" />
        <ui-error>Choose a date</ui-error>
      </ui-form-field>
      <ui-form-field label="Deadline">
        <ui-datepicker formControlName="deadline" />
      </ui-form-field>
    </form>
  `,
})
class ReactiveHost {
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(new Date(2026, 3, 1), Validators.required),
    deadline: new FormControl<Date | null>(null, notBefore2026),
  });
}

describe('UiDatepicker with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let host: ReactiveHost;
  let root: HTMLElement;
  let controls: ReactiveHost['form']['controls'];
  const fieldOf = (label: string): HTMLElement =>
    [...root.querySelectorAll<HTMLElement>('ui-form-field')].find((it) =>
      it.querySelector('label')!.textContent.includes(label),
    )!;
  const input = (label: string) => fieldOf(label).querySelector('input')!;
  const toggleOf = (label: string) =>
    fieldOf(label).querySelector<HTMLButtonElement>('.ui-datepicker__toggle')!;
  /** The message `ui-form-field` shows under the field with this label. */
  const errorOf = (label: string): string =>
    fieldOf(label).querySelector('.ui-form-field__error')?.textContent.trim() ?? '';
  const type = async (label: string, text: string) => {
    input(label).value = text;
    input(label).dispatchEvent(new Event('input'));
    await settle(fixture);
  };
  const blur = async (label: string) => {
    leave(input(label));
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    controls = host.form.controls;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('binds the value both ways and marks the required field', async () => {
    expect(input('Date').value).toBe('1.4.2026');
    expect(input('Date').getAttribute('aria-required')).toBe('true');
    await type('Date', '2.4.2026');
    expect(controls.date.value).toEqual(new Date(2026, 3, 2));
    controls.date.setValue(new Date(2026, 4, 9));
    await settle(fixture);
    expect(input('Date').value).toBe('9.5.2026');
  });

  it('marks touched on blur and links the projected error', async () => {
    controls.date.setValue(null);
    await blur('Date');
    expect(controls.date.touched).toBe(true);
    expect(input('Date').getAttribute('aria-invalid')).toBe('true');
    const error = document.getElementById(input('Date').getAttribute('aria-describedby')!);
    expect(error!.textContent).toContain('Choose a date');
  });

  it('shows text that is not a date without failing the control', async () => {
    await type('Deadline', '31.2.2026');
    expect(controls.deadline.value).toBeNull();
    expect(input('Deadline').getAttribute('aria-invalid')).toBeNull();

    await blur('Deadline');
    expect(controls.deadline.errors).toBeNull();
    expect(controls.deadline.valid).toBe(true);
    expect(host.form.valid).toBe(true);
    expect(input('Deadline').value).toBe('31.2.2026');
    expect(input('Deadline').getAttribute('aria-invalid')).toBe('true');
    expect(errorOf('Deadline')).toContain('תאריך לא תקין');

    await type('Deadline', '3.3.2026');
    await blur('Deadline');
    expect(controls.deadline.value).toEqual(new Date(2026, 2, 3));
    expect(input('Deadline').getAttribute('aria-invalid')).toBeNull();
    expect(errorOf('Deadline')).toBe('');
  });

  it("keeps the consumer's minimum date validator", async () => {
    await type('Deadline', '31.12.2025');
    await blur('Deadline');
    expect(controls.deadline.value).toEqual(new Date(2025, 11, 31));
    expect(controls.deadline.hasError('uiMinDate')).toBe(true);
    expect(input('Deadline').getAttribute('aria-invalid')).toBe('true');
    expect(errorOf('Deadline')).toContain('Too early');
  });

  it('drops typed text when the control writes a value', async () => {
    await type('Deadline', 'abc');
    await blur('Deadline');
    expect(input('Deadline').getAttribute('aria-invalid')).toBe('true');

    // `null` written over `null`: only `writeValue` itself can drop the text here.
    controls.deadline.reset();
    await settle(fixture);
    expect(input('Deadline').value).toBe('');
    expect(input('Deadline').getAttribute('aria-invalid')).toBeNull();
    expect(errorOf('Deadline')).toBe('');

    await type('Deadline', 'abc');
    controls.deadline.setValue(new Date(2026, 3, 1));
    await settle(fixture);
    expect(input('Deadline').value).toBe('1.4.2026');
    expect(input('Deadline').getAttribute('aria-invalid')).toBeNull();
  });

  it('drops typed text and its message when a day is picked', async () => {
    await type('Deadline', 'abc');
    await blur('Deadline');
    expect(input('Deadline').getAttribute('aria-invalid')).toBe('true');
    toggleOf('Deadline').click();
    await settle(fixture);
    document.querySelector<HTMLElement>('td[data-date="2026-09-17"]')!.click();
    await settle(fixture);
    expect(controls.deadline.value).toEqual(new Date(2026, 8, 17));
    expect(input('Deadline').value).toBe('17.9.2026');
    expect(input('Deadline').getAttribute('aria-invalid')).toBeNull();
  });

  it('is not touched while focus moves to its own calendar button', async () => {
    leave(input('Date'), toggleOf('Date'));
    await settle(fixture);
    expect(controls.date.touched).toBe(false);
  });

  it('is touched when the calendar closes without a pick', async () => {
    toggleOf('Date').click();
    await settle(fixture);
    keydown(dialog()!, 'Escape');
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(controls.date.touched).toBe(true);
  });

  it('disables the field and the calendar button', async () => {
    controls.date.disable();
    await settle(fixture);
    expect(input('Date').disabled).toBe(true);
    expect(toggleOf('Date').disabled).toBe(true);
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

describe('UiDatepicker bound to a changing control', () => {
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
  imports: [UiDatepicker],
  template: `<ui-datepicker aria-label="Date" readonly [value]="value" />`,
})
class ReadonlyHost {
  readonly value = new Date(2026, 3, 1);
}

describe('UiDatepicker readonly', () => {
  it('makes the text readonly and does not open the calendar', async () => {
    const fixture = TestBed.createComponent(ReadonlyHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const input = root.querySelector('input')!;
    const toggle = root.querySelector<HTMLButtonElement>('.ui-datepicker__toggle')!;
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
    expect(input.value).toBe('1.4.2026');
    expect(input.getAttribute('aria-label')).toBe('Date');
    expect(root.querySelector('ui-datepicker')!.hasAttribute('aria-label')).toBe(false);
    expect(toggle.disabled).toBe(true);
    keydown(input, 'ArrowDown', { altKey: true });
    await settle(fixture);
    expect(dialog()).toBeNull();
    root.remove();
  });
});

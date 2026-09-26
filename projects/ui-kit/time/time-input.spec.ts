import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, readonly, required } from '@angular/forms/signals';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiTimeInput } from './time-input';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): void {
  const keyCode = {
    ArrowDown: 40,
    ArrowUp: 38,
    PageDown: 34,
    PageUp: 33,
    Enter: 13,
    Escape: 27,
    Tab: 9,
  }[key];
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true, ...init }),
  );
}

/** Types like a user at the end of the field (`inputType` drives the mask). */
function type(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.setSelectionRange(text.length, text.length);
  input.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: text.at(-1) }));
}

const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');
const options = () => [...document.querySelectorAll<HTMLElement>('ui-option')];
const optionTexts = () => options().map((option) => option.textContent.trim());
const active = (input: HTMLInputElement) =>
  document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent.trim();

@Component({
  imports: [UiTimeInput, UiFormField],
  template: `
    <ui-form-field label="Start">
      <ui-time-input
        [(value)]="value"
        [minTime]="min()"
        [maxTime]="max()"
        [interval]="interval()"
        (opened)="events.push('opened')"
        (closed)="events.push('closed')"
      />
    </ui-form-field>
  `,
})
class Host {
  readonly value = signal<string | null>(null);
  readonly min = signal<string | null>('08:00');
  readonly max = signal<string | null>('12:00');
  readonly interval = signal(60);
  readonly events: string[] = [];
}

describe('UiTimeInput', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;
  const typeText = async (text: string) => {
    type(input(), text);
    await settle(fixture);
  };
  const blur = async () => {
    input().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
  };

  beforeEach(async () => {
    Element.prototype.scrollIntoView = () => undefined;
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

  it('is a labelled combobox that shows the expected format', () => {
    const label = root.querySelector('label')!;
    expect(label.htmlFor).toBe(input().id);
    expect(input().getAttribute('role')).toBe('combobox');
    expect(input().getAttribute('aria-haspopup')).toBe('listbox');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().placeholder).toBe('HH:MM');
    expect(input().getAttribute('dir')).toBe('ltr');
    expect(input().getAttribute('inputmode')).toBe('numeric');
    expect(input().maxLength).toBe(5);
  });

  it('keeps only the characters of a time', async () => {
    await typeText('1a4:3b0');
    expect(input().value).toBe('14:30');
    expect(host.value()).toBeNull();
  });

  it('parses typed times, adds the colon and formats on blur', async () => {
    await typeText('0930');
    expect(input().value).toBe('09:30');
    expect(host.value()).toBe('09:30');
    await typeText('930');
    expect(input().value).toBe('9:30');
    await blur();
    expect(input().value).toBe('09:30');
  });

  it('does not mask text changed in the middle', async () => {
    input().value = '1030';
    input().setSelectionRange(1, 1);
    input().dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: '0' }));
    await settle(fixture);
    expect(input().value).toBe('1030');
    expect(host.value()).toBe('10:30');
  });

  it('shows a written value and ignores values that are not times', async () => {
    host.value.set('11:15');
    await settle(fixture);
    expect(input().value).toBe('11:15');
    host.value.set('7:5');
    await settle(fixture);
    expect(input().value).toBe('');
  });

  it('marks invalid or out-of-range text once the user leaves the field', async () => {
    await typeText('25:00');
    expect(host.value()).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBeNull();
    await blur();
    expect(input().value).toBe('25:00');
    expect(input().getAttribute('aria-invalid')).toBe('true');
    const error = document.getElementById(input().getAttribute('aria-describedby')!);
    expect(error!.textContent).toContain('שעה לא תקינה');

    await typeText('13:00');
    await blur();
    expect(host.value()).toBeNull();
    expect(input().getAttribute('aria-invalid')).toBe('true');

    await typeText('');
    await blur();
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('lists the times between the limits and marks the selected one', async () => {
    host.value.set('10:00');
    await settle(fixture);
    input().click();
    await settle(fixture);
    expect(listbox()!.getAttribute('aria-labelledby')).toBe(
      root.querySelector('.ui-form-field__label')!.id,
    );
    expect(optionTexts()).toEqual(['08:00', '09:00', '10:00', '11:00', '12:00']);
    expect(options()[2].getAttribute('aria-selected')).toBe('true');
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(input().getAttribute('aria-controls')).toBe(listbox()!.id);
    expect(active(input())).toBe('10:00');
    expect(host.events).toEqual(['opened']);
  });

  it('opens at the next time for a value between two times', async () => {
    host.value.set('09:20');
    await settle(fixture);
    keydown(input(), 'ArrowDown');
    await settle(fixture);
    expect(active(input())).toBe('10:00');
  });

  it('moves with the arrows and picks with Enter', async () => {
    host.value.set('09:00');
    await settle(fixture);
    keydown(input(), 'ArrowDown');
    await settle(fixture);
    keydown(input(), 'ArrowDown');
    await settle(fixture);
    expect(active(input())).toBe('10:00');
    keydown(input(), 'PageDown');
    await settle(fixture);
    expect(active(input())).toBe('12:00');
    keydown(input(), 'Enter');
    await settle(fixture);
    expect(host.value()).toBe('12:00');
    expect(listbox()).toBeNull();
    expect(host.events).toEqual(['opened', 'closed']);
  });

  it('opens without moving on Alt+ArrowDown and closes on Alt+ArrowUp and Escape', async () => {
    keydown(input(), 'ArrowDown', { altKey: true });
    await settle(fixture);
    expect(listbox()).not.toBeNull();
    keydown(input(), 'ArrowUp', { altKey: true });
    await settle(fixture);
    expect(listbox()).toBeNull();

    keydown(input(), 'ArrowUp');
    await settle(fixture);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true });
    const outside = vi.fn();
    root.addEventListener('keydown', outside);
    input().dispatchEvent(escape);
    await settle(fixture);
    expect(listbox()).toBeNull();
    expect(outside).not.toHaveBeenCalled();
  });

  it('follows typing in the list and picks a clicked time', async () => {
    await typeText('1015');
    expect(listbox()).not.toBeNull();
    expect(active(input())).toBe('11:00');
    options()[0].click();
    await settle(fixture);
    expect(host.value()).toBe('08:00');
    expect(input().value).toBe('08:00');
    expect(listbox()).toBeNull();
  });

  it('drops invalid text when a time is picked', async () => {
    await typeText('99');
    await blur();
    expect(input().getAttribute('aria-invalid')).toBe('true');
    input().click();
    await settle(fixture);
    options()[1].click();
    await settle(fixture);
    expect(input().value).toBe('09:00');
    expect(input().getAttribute('aria-invalid')).toBeNull();
  });

  it('closes on Tab, blur and a click outside', async () => {
    input().click();
    await settle(fixture);
    keydown(input(), 'Tab');
    await settle(fixture);
    expect(listbox()).toBeNull();
    input().click();
    await settle(fixture);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    expect(listbox()).toBeNull();
    root.querySelector<HTMLElement>('.ui-time-input__field')!.click();
    await settle(fixture);
    expect(document.activeElement).toBe(input());
    await blur();
    expect(listbox()).toBeNull();
  });

  it('lists every interval of the day without limits', async () => {
    host.min.set(null);
    host.max.set(null);
    host.interval.set(180);
    await settle(fixture);
    input().click();
    await settle(fixture);
    expect(optionTexts()).toEqual([
      '00:00',
      '03:00',
      '06:00',
      '09:00',
      '12:00',
      '15:00',
      '18:00',
      '21:00',
    ]);
    expect(active(input())).toBeTruthy();
  });
});

@Component({
  imports: [UiTimeInput],
  providers: [provideUiLabels(UI_LABELS_EN)],
  template: `<ui-time-input aria-label="Start" interval="720" [(value)]="value" />`,
})
class EnglishHost {
  readonly value = signal<string | null>('14:30');
}

describe('UiTimeInput in a 12-hour locale', () => {
  it('shows and reads times with a day period', async () => {
    Element.prototype.scrollIntoView = () => undefined;
    const fixture = TestBed.createComponent(EnglishHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const input = root.querySelector('input')!;
    expect(input.value).toBe('2:30 PM');
    expect(input.placeholder).toBe('HH:MM AM');
    expect(input.getAttribute('inputmode')).toBeNull();
    expect(input.hasAttribute('maxlength')).toBe(false);
    expect(input.getAttribute('aria-label')).toBe('Start');
    expect(root.querySelector('ui-time-input')!.hasAttribute('aria-label')).toBe(false);

    type(input, '9:15 pm');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toBe('21:15');
    expect(listbox()!.getAttribute('aria-label')).toBe('Start');
    expect(optionTexts()).toEqual(['12:00 AM', '12:00 PM']);
    fixture.destroy();
    root.remove();
  });
});

@Component({
  imports: [UiTimeInput, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Start">
      <ui-time-input maxTime="18:00" [formControl]="control" />
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<string | null>('08:30', Validators.required);
}

describe('UiTimeInput with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let root: HTMLElement;
  let control: FormControl<string | null>;
  const input = () => root.querySelector<HTMLInputElement>('input')!;

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

  it('binds the value both ways', async () => {
    expect(input().value).toBe('08:30');
    expect(input().getAttribute('aria-required')).toBe('true');
    type(input(), '1745');
    await settle(fixture);
    expect(control.value).toBe('17:45');
    control.setValue('06:00');
    await settle(fixture);
    expect(input().value).toBe('06:00');
  });

  it('reports parse errors to the control and clears them on reset', async () => {
    type(input(), '19:00');
    await settle(fixture);
    expect(control.value).toBeNull();
    expect(control.getError('uiTimeParse')).toEqual({ message: 'שעה לא תקינה' });
    control.reset('10:00');
    await settle(fixture);
    expect(control.valid).toBe(true);
    expect(input().value).toBe('10:00');
  });

  it('is touched on blur and disabled with the control', async () => {
    input().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(control.touched).toBe(true);
    control.disable();
    await settle(fixture);
    expect(input().disabled).toBe(true);
    root.querySelector<HTMLElement>('.ui-time-input__field')!.click();
    await settle(fixture);
    expect(listbox()).toBeNull();
  });

  it('removes its validator when destroyed', async () => {
    type(input(), '99');
    await settle(fixture);
    expect(control.hasError('uiTimeParse')).toBe(true);
    fixture.destroy();
    expect(control.hasError('uiTimeParse')).toBe(false);
    expect(control.hasError('required')).toBe(true);
  });
});

@Component({
  imports: [UiTimeInput, UiFormField, FormField],
  template: `
    <ui-form-field label="Start">
      <ui-time-input [formField]="f.start" minTime="09:00" />
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ start: string | null }>({ start: null });
  readonly f = form(this.model, (p) => {
    required(p.start, { message: 'Choose a time' });
  });
}

describe('UiTimeInput with Signal Forms', () => {
  let fixture: ComponentFixture<SignalHost>;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;

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
    type(input(), '1000');
    await settle(fixture);
    expect(fixture.componentInstance.model().start).toBe('10:00');
    fixture.componentInstance.model.set({ start: '16:45' });
    await settle(fixture);
    expect(input().value).toBe('16:45');
  });

  it('shows the required error once touched', async () => {
    expect(input().getAttribute('aria-required')).toBe('true');
    input().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(root.textContent).toContain('Choose a time');
  });

  it('reports parse errors to the field and drops them on reset', async () => {
    const field = fixture.componentInstance.f.start;
    type(input(), '0830');
    await settle(fixture);
    expect(
      field()
        .errors()
        .map((e) => e.kind),
    ).toContain('uiTimeParse');
    fixture.componentInstance.f().reset();
    await settle(fixture);
    expect(input().value).toBe('');
    expect(
      field()
        .errors()
        .map((e) => e.kind),
    ).not.toContain('uiTimeParse');
  });
});

@Component({
  imports: [UiTimeInput, FormField],
  template: `<ui-time-input aria-label="Start" [formField]="f.start" />`,
})
class ReadonlyHost {
  readonly model = signal<{ start: string | null }>({ start: '09:00' });
  readonly f = form(this.model, (p) => {
    readonly(p.start);
  });
}

describe('UiTimeInput readonly', () => {
  it('keeps the text readonly and does not open the list', async () => {
    const fixture = TestBed.createComponent(ReadonlyHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const input = root.querySelector('input')!;
    expect(input.readOnly).toBe(true);
    keydown(input, 'ArrowDown');
    input.click();
    await settle(fixture);
    expect(listbox()).toBeNull();
    fixture.destroy();
    root.remove();
  });
});

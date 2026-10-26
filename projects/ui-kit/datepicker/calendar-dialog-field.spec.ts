import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  model,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import {
  UI_FORM_FIELD_CONTROL,
  UiSize,
  ɵinjectTypedText as injectTypedText,
  ɵUiDropdownPanel as UiDropdownPanel,
} from '@vplans/ui-kit/core';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiCalendar } from './calendar';
import { UiCalendarDialogField } from './calendar-dialog-field';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const keyCode = { Escape: 27, Enter: 13, ArrowDown: 40 }[key];
  const event = new KeyboardEvent('keydown', {
    key,
    keyCode,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

/**
 * A minimal calendar dialog field that follows the template contract: a text field whose typed
 * text is upper-cased on commit, the calendar button and the dialog with one calendar.
 */
@Component({
  selector: 'ui-test-calendar-field',
  imports: [CdkOverlayOrigin, CdkTrapFocus, UiCalendar, UiDropdownPanel, UiIcon],
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => TestCalendarField) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TestCalendarField), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <input
        class="control"
        [id]="controlId()"
        [value]="typedText.text()"
        [placeholder]="placeholder() || hint()"
        [attr.inputmode]="inputMode()"
        [attr.aria-label]="ariaLabel() || null"
        (input)="onInput($event)"
        (keydown)="onInputKeydown($event)"
        (blur)="onBlur()"
      />
      <button
        #toggleButton
        type="button"
        class="toggle"
        [disabled]="isDisabled() || readonly()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="labels().chooseDate"
        [attr.aria-controls]="isOpen() ? panelId() : null"
        (click)="toggle()"
      >
        <ui-icon [icon]="calendarIcon" />
      </button>
    </div>
    <ng-template
      [uiDropdownPanel]="origin"
      [open]="isOpen()"
      [positions]="positions"
      [matchWidth]="false"
      [returnFocusTo]="toggleElement()"
      (attached)="onAttach()"
      (closed)="close()"
    >
      <div #panel class="test-panel" role="dialog" [id]="panelId()" cdkTrapFocus>
        <ui-calendar [dateFilter]="dateFilter()" [startAt]="startAt()" />
      </div>
    </ng-template>
  `,
})
class TestCalendarField extends UiCalendarDialogField<string | null> {
  readonly value = model<string | null>(null);

  protected classPrefix(): string {
    return 'ui-test-field';
  }

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-control`);

  protected readonly typedText = injectTypedText<string, string, never>({
    value: this.value,
    notify: (value) => this.notifyChange(value),
    parse: (text) => ({ value: text.trim() ? text.trim().toUpperCase() : null, error: null }),
    format: (value) => value ?? '',
    valid: (raw) => (typeof raw === 'string' ? raw : null),
    equals: (a, b) => a === b,
  });

  writeValue(value: string | null | undefined): void {
    this.typedText.write(value);
  }

  focus(options?: FocusOptions): void {
    document.getElementById(this.controlId())?.focus(options);
  }

  protected onInput(event: Event): void {
    this.typedText.input((event.target as HTMLInputElement).value);
  }
}

@Component({
  imports: [TestCalendarField],
  template: `
    <ui-test-calendar-field
      id="due"
      aria-label="Due date"
      aria-describedby="note"
      [(value)]="value"
      [startAt]="startAt"
      [placeholder]="placeholder()"
      [size]="size()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [invalid]="invalid()"
      (opened)="events.push('opened')"
      (closed)="events.push('closed')"
    />
  `,
})
class Host {
  readonly events: string[] = [];
  readonly value = signal<string | null>(null);
  readonly startAt = new Date(2026, 8, 5);
  readonly placeholder = signal('');
  readonly size = signal<UiSize>('md');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly invalid = signal(false);
}

const dialog = () => document.querySelector<HTMLElement>('.test-panel');

describe('a calendar dialog field', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const toggle = () => root.querySelector<HTMLButtonElement>('.toggle')!;
  const control = () => root.querySelector<HTMLInputElement>('.control')!;
  const type = async (text: string) => {
    control().value = text;
    control().dispatchEvent(new Event('input'));
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

  it('opens the dialog from the calendar button and closes it on a second click', async () => {
    expect(dialog()).toBeNull();

    toggle().click();
    await settle(fixture);
    expect(dialog()).not.toBeNull();
    expect(dialog()!.querySelector('ui-calendar')).not.toBeNull();

    toggle().click();
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(host.events).toEqual(['opened', 'closed']);
  });

  it('opens the dialog with Alt+ArrowDown in the field, and not with a plain ArrowDown', async () => {
    control().focus();
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    expect(dialog()).toBeNull();

    const event = keydown(control(), 'ArrowDown', { altKey: true });
    await settle(fixture);
    expect(dialog()).not.toBeNull();
    expect(event.defaultPrevented).toBe(true);
    expect(host.events).toEqual(['opened']);
  });

  it('closes the dialog with Escape', async () => {
    toggle().click();
    await settle(fixture);
    keydown(dialog()!, 'Escape');
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(host.events).toEqual(['opened', 'closed']);
  });

  it('does not open while disabled or readonly', async () => {
    const field = fixture.debugElement.query(By.directive(TestCalendarField))
      .componentInstance as TestCalendarField;

    for (const state of [host.disabled, host.readonly]) {
      state.set(true);
      await settle(fixture);
      keydown(control(), 'ArrowDown', { altKey: true });
      field.open();
      await settle(fixture);
      expect(dialog()).toBeNull();
      state.set(false);
    }
    expect(host.events).toEqual([]);
  });

  it('commits the typed text when the dialog opens', async () => {
    await type(' may ');
    expect(host.value()).toBe('MAY');
    expect(control().value).toBe(' may ');

    toggle().click();
    await settle(fixture);
    expect(control().value).toBe('MAY');
  });

  it('commits the typed text on Enter', async () => {
    await type('june');
    keydown(control(), 'Enter');
    await settle(fixture);
    expect(control().value).toBe('JUNE');
    expect(dialog()).toBeNull();
  });

  it('commits the typed text when the field loses focus', async () => {
    await type('july');
    control().dispatchEvent(new FocusEvent('blur'));
    await settle(fixture);
    expect(control().value).toBe('JULY');
  });

  it('moves focus to the active day when the dialog opens, and back to the button when it closes', async () => {
    toggle().focus();
    toggle().click();
    await settle(fixture);
    expect((document.activeElement as HTMLElement).dataset['date']).toBe('2026-09-05');

    keydown(document.activeElement!, 'Escape');
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(toggle());
  });

  it('names the open dialog in aria-controls and reports the open state in aria-expanded', async () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(toggle().hasAttribute('aria-controls')).toBe(false);

    toggle().click();
    await settle(fixture);
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().getAttribute('aria-controls')).toBe('due-panel');
    expect(dialog()!.id).toBe('due-panel');

    toggle().click();
    await settle(fixture);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(toggle().hasAttribute('aria-controls')).toBe(false);
  });

  it('keeps its id on the host and its label on the field', () => {
    const field = root.querySelector<HTMLElement>('ui-test-calendar-field')!;
    expect(field.id).toBe('due');
    expect(field.hasAttribute('aria-label')).toBe(false);
    expect(field.hasAttribute('aria-describedby')).toBe(false);
    expect(control().id).toBe('due-control');
    expect(control().getAttribute('aria-label')).toBe('Due date');
    expect(toggle().getAttribute('aria-label')).toBe('בחירת תאריך');
    expect(toggle().querySelector('ui-icon svg')).not.toBeNull();
  });

  it('shows the expected format until a placeholder is given, and asks phones for a numeric keypad', async () => {
    expect(control().placeholder).toBe('DD.MM.YYYY');
    expect(control().getAttribute('inputmode')).toBe('decimal');

    host.placeholder.set('When is it due?');
    await settle(fixture);
    expect(control().placeholder).toBe('When is it due?');
  });

  it('builds the host classes from the field prefix', async () => {
    const field = root.querySelector<HTMLElement>('ui-test-calendar-field')!;
    expect([...field.classList].sort()).toEqual(['ui-test-field', 'ui-test-field--md']);

    host.size.set('lg');
    host.disabled.set(true);
    host.readonly.set(true);
    host.invalid.set(true);
    await settle(fixture);
    expect([...field.classList].sort()).toEqual([
      'ui-test-field',
      'ui-test-field--disabled',
      'ui-test-field--invalid',
      'ui-test-field--lg',
      'ui-test-field--readonly',
    ]);
  });
});

@Component({
  imports: [TestCalendarField],
  template: `<ui-test-calendar-field /><ui-test-calendar-field />`,
})
class UnnamedHost {}

describe('a calendar dialog field without a bound id', () => {
  it('builds a unique id from its class prefix, and the panel id from it', async () => {
    const fixture = TestBed.createComponent(UnnamedHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const [first, second] = [...root.querySelectorAll<HTMLElement>('ui-test-calendar-field')];

    expect(first.id).toMatch(/^ui-test-field-\w+$/);
    expect(second.id).toMatch(/^ui-test-field-\w+$/);
    expect(second.id).not.toBe(first.id);

    first.querySelector<HTMLButtonElement>('.toggle')!.click();
    await settle(fixture);
    expect(dialog()!.id).toBe(`${first.id}-panel`);
    fixture.destroy();
    root.remove();
  });
});

/** Focus leaves the element for `relatedTarget` (outside the page when `null`). */
function leave(target: Element, relatedTarget: Element | null = null): void {
  target.dispatchEvent(new FocusEvent('blur', { relatedTarget }));
  target.dispatchEvent(new FocusEvent('focusout', { relatedTarget, bubbles: true }));
}

@Component({
  imports: [TestCalendarField, ReactiveFormsModule],
  template: `<ui-test-calendar-field [formControl]="due" [startAt]="startAt" />`,
})
class ReactiveHost {
  readonly due = new FormControl<string | null>(null);
  readonly startAt = new Date(2026, 8, 5);
}

describe('a calendar dialog field bound to a form control', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let due: FormControl<string | null>;
  let root: HTMLElement;
  const toggle = () => root.querySelector<HTMLButtonElement>('.toggle')!;
  const control = () => root.querySelector<HTMLInputElement>('.control')!;
  const day = () => document.querySelector<HTMLElement>('td[data-date="2026-09-05"]')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    due = fixture.componentInstance.due;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('is touched when the dialog closes without a pick', async () => {
    toggle().click();
    await settle(fixture);
    expect(due.touched).toBe(false);

    keydown(dialog()!, 'Escape');
    await settle(fixture);
    expect(dialog()).toBeNull();
    expect(due.touched).toBe(true);
  });

  it('is not touched while focus moves to its own calendar button', async () => {
    leave(control(), toggle());
    await settle(fixture);
    expect(due.touched).toBe(false);
  });

  it('is not touched while focus moves from the field into the open dialog', async () => {
    keydown(control(), 'ArrowDown', { altKey: true });
    await settle(fixture);
    leave(control(), day());
    await settle(fixture);
    expect(due.touched).toBe(false);
  });

  it('is touched once focus leaves the field, its button and the dialog', async () => {
    leave(toggle());
    await settle(fixture);
    expect(due.touched).toBe(true);
  });
});

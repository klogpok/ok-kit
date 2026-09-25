import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { ValidationErrors, ValidatorFn } from '@angular/forms';
import { transformedValue } from '@angular/forms/signals';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { UiIconButton } from '@vplans/ui-kit/button';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  resolveDirection,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconCalendar } from '@vplans/ui-kit/icon';
import { UiCalendar } from './calendar';
import { UiDateFilter, formatDay, formatHint, isDayEnabled, parseDay, sameDay } from './date-utils';

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
];

/** Text the user is typing and the value it produced. */
interface Draft {
  text: string;
  value: Date | null;
  /** The user left the field or pressed Enter: an invalid text is now an error. */
  committed: boolean;
}

/**
 * Date field: type a date in the locale format or pick it from a calendar.
 *
 * - The text is parsed with the `locale` label (default `he-IL`, "25.9.2026"). Text that is not a
 *   date, or a date outside `min`/`max`/`dateFilter`, sets the value to `null` and reports a
 *   `uiDateParse` error (message `labels().invalidDate`) to Signal Forms or Reactive Forms, so
 *   the form is invalid and `ui-form-field` shows the message. Without a forms directive the
 *   message is shown once the user leaves the field.
 * - The calendar button (or Alt+ArrowDown in the field) opens a dialog with `ui-calendar`. Focus
 *   moves to the selected day and is trapped in the dialog; Escape or picking a day closes it
 *   and returns focus to the button.
 *
 * The value is a local `Date` at midnight. Implements `FormValueControl` (Signal Forms) and
 * `ControlValueAccessor`.
 *
 * @example
 * <ui-form-field label="Signing date" hint="DD.MM.YYYY">
 *   <ui-datepicker [formField]="form.signingDate" [min]="today" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-datepicker',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, UiCalendar, UiIcon, UiIconButton],
  template: `
    <div class="ui-datepicker__field" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <input
        #input
        type="text"
        class="ui-datepicker__input"
        autocomplete="off"
        [id]="controlId()"
        [value]="text()"
        [placeholder]="placeholder() || hint()"
        [disabled]="isDisabled()"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [attr.aria-invalid]="invalidState() ? 'true' : null"
        [attr.aria-describedby]="formField?.describedBy() ?? null"
        (input)="onInput($event)"
        (keydown)="onInputKeydown($event)"
        (blur)="onBlur()"
      />
      <button
        #toggleButton
        ui-icon-button
        class="ui-datepicker__toggle"
        size="sm"
        aria-haspopup="dialog"
        [label]="labels().chooseDate"
        [disabled]="isDisabled()"
        [attr.aria-expanded]="isOpen()"
        (click)="toggle()"
      >
        <ui-icon [icon]="calendarIcon" />
      </button>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="positions"
      (attach)="onAttach()"
      (detach)="close()"
      (overlayOutsideClick)="onOutsideClick($event)"
    >
      <div
        #panel
        class="ui-datepicker__panel"
        role="dialog"
        aria-modal="true"
        cdkTrapFocus
        [attr.aria-label]="labels().chooseDate"
      >
        <ui-calendar
          [selected]="value()"
          [min]="min()"
          [max]="max()"
          [dateFilter]="dateFilter()"
          [startAt]="startAt()"
          (dateSelected)="onPick($event)"
        />
      </div>
    </ng-template>
  `,
  styleUrl: './datepicker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiDatepicker) }],
  host: {
    class: 'ui-datepicker',
    '[class]': '"ui-datepicker--" + size()',
    '[class.ui-datepicker--disabled]': 'isDisabled()',
    '[class.ui-datepicker--invalid]': 'invalidState()',
    '[attr.id]': 'id()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiDatepicker extends UiFormControlBase<Date | null> implements UiFormFieldControl {
  protected readonly labels = inject(UI_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  readonly value = model<Date | null>(null);
  readonly min = input<Date | null | undefined>(null);
  readonly max = input<Date | null | undefined>(null);
  /** Return `false` for days that cannot be picked or typed. */
  readonly dateFilter = input<UiDateFilter | null>(null);
  /** Month shown when the calendar opens without a value. Defaults to today. */
  readonly startAt = input<Date | null>(null);
  /** Defaults to the expected format, e.g. "DD.MM.YYYY". */
  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /** Host id; the text field gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-datepicker-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly opened = output<void>();
  readonly closed = output<void>();

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly toggleButton = viewChild.required('toggleButton', { read: ElementRef });
  private readonly overlay = viewChild(CdkConnectedOverlay);
  private readonly calendar = viewChild(UiCalendar);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly isOpen = signal(false);
  protected readonly positions = POSITIONS;
  protected readonly calendarIcon = uiIconCalendar;
  /** Dropped when the value changes elsewhere (e.g. a reset), so old text does not come back. */
  private readonly draft = linkedSignal<Date | null, Draft | null>({
    source: this.value,
    computation: (value, previous) => {
      const draft = previous?.value;
      return draft && (draft.value === value || sameDay(draft.value, value)) ? draft : null;
    },
  });

  /**
   * Parses typed text into the value. Through `transformedValue` Signal Forms receives the parse
   * errors; they clear when the value changes elsewhere or the form is reset.
   */
  private readonly rawText = transformedValue(this.value, {
    parse: (text: string) => {
      const parsed = text.trim() ? parseDay(text, this.locale()) : null;
      const allowed =
        parsed && isDayEnabled(parsed, this.min(), this.max(), this.dateFilter()) ? parsed : null;
      const current = this.value();
      const changed = !sameDay(allowed, current) && !(allowed === null && current === null);
      return {
        value: changed ? allowed : undefined,
        error:
          text.trim() && !allowed
            ? { kind: 'uiDateParse', message: this.labels().invalidDate }
            : undefined,
      };
    },
    format: (value: Date | null) => (value ? formatDay(value, this.locale()) : ''),
  });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);

  private readonly locale = computed(() => this.labels().locale);
  protected readonly hint = computed(() => formatHint(this.locale()));

  /** The typed text while it belongs to the current value, otherwise the formatted value. */
  protected readonly text = computed(() => {
    const value = this.value();
    return this.draft()?.text ?? (value ? formatDay(value, this.locale()) : '');
  });

  /** Typed text that is not an allowed date. */
  protected readonly parseError = computed(() => {
    const draft = this.draft();
    return (
      !!draft &&
      draft.committed &&
      draft.text.trim() !== '' &&
      draft.value === null &&
      this.value() === null
    );
  });

  protected readonly invalidState = computed(() => this.showError() || this.parseError());

  /** Reports the parse errors to Reactive / template forms, which read them only from validators. */
  private readonly parseValidator: ValidatorFn = (): ValidationErrors | null => {
    const [error] = this.rawText.parseErrors();
    return error ? { [error.kind]: { message: error.message } } : null;
  };

  /** Without a forms directive, the field itself shows the parse error. */
  protected override ownErrors(): readonly string[] {
    return !this.controlState.bound && this.parseError() ? [this.labels().invalidDate] : [];
  }

  writeValue(value: Date | null | undefined): void {
    this.draft.set(null);
    this.value.set(value ?? null);
    // A new date clears the parse errors by itself; `null` over `null` (reset) does not.
    if (value == null) this.rawText.set('');
  }

  override registerOnChange(fn: (value: Date | null) => void): void {
    const control = this.ngControl?.control;
    if (control && !control.hasValidator(this.parseValidator)) {
      control.addValidators(this.parseValidator);
    }
    super.registerOnChange(fn);
  }

  focus(options?: FocusOptions): void {
    this.input().nativeElement.focus(options);
  }

  open(): void {
    if (this.isOpen() || this.isDisabled()) return;
    this.commitDraft();
    this.isOpen.set(true);
    this.opened.emit();
  }

  close(): void {
    if (!this.isOpen()) return;
    // Focus inside the panel (or lost with it, after Escape) returns to the button.
    const active = document.activeElement;
    const focusInPanel =
      !active || active === document.body || !!this.panel()?.nativeElement.contains(active);
    this.isOpen.set(false);
    this.closed.emit();
    if (focusInPanel) this.toggleButton().nativeElement.focus();
    // The user has dealt with the field, even when no day was picked.
    this.notifyTouched();
  }

  protected toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  protected onAttach(): void {
    // The CDK reads the direction once; follow runtime `dir` changes.
    this.overlay()?.overlayRef?.setDirection(resolveDirection(this.host));
    afterNextRender(
      { write: () => this.calendar()?.focusActiveCell() },
      { injector: this.injector },
    );
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.contains(event.target as Node)) this.close();
  }

  protected onPick(date: Date): void {
    this.draft.set(null);
    this.setValue(date);
    this.close();
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    const before = this.value();
    const hadError = this.rawText.parseErrors().length > 0;
    this.rawText.set(text);
    const value = this.value();
    this.draft.set({ text, value, committed: false });
    if (value !== before) this.notifyChange(value);
    else if (hadError !== this.rawText.parseErrors().length > 0) {
      this.ngControl?.control?.updateValueAndValidity();
    }
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.open();
    } else if (event.key === 'Enter') {
      this.commitDraft();
    }
  }

  protected onBlur(): void {
    this.commitDraft();
  }

  /** Touched once focus leaves the field, its button and the calendar. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (this.host.contains(next) || this.panel()?.nativeElement.contains(next))) return;
    this.notifyTouched();
  }

  /** Shows a valid typed date in the locale format; keeps invalid text for the user to fix. */
  private commitDraft(): void {
    const draft = this.draft();
    if (!draft) return;
    this.draft.set(draft.value ? null : { ...draft, committed: true });
  }

  private setValue(value: Date | null): void {
    if (sameDay(value, this.value()) || (value === null && this.value() === null)) return;
    this.value.set(value);
    this.notifyChange(value);
  }
}

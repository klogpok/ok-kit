import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UI_FORM_FIELD_CONTROL, ɵinjectTypedText, ɵUiDropdownPanel } from '@vplans/ui-kit/core';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiCalendar } from './calendar';
import { UiCalendarDialogField } from './calendar-dialog-field';
import { formatDay, isDayEnabled, parseDay, sameDay, startOfDay, validDay } from './date-utils';

/**
 * Date field: type a date in the locale format or pick it from a calendar.
 *
 * - The text is parsed with the `locale` label (default `he-IL`, "25.9.2026"). Text that is not a
 *   date, or a date outside `min`/`max`/`dateFilter`, sets the value to `null` and, once the user
 *   leaves the field, shows `labels().invalidDate`. The message is the field's own: it never
 *   becomes an error of a bound form control.
 * - The calendar button (or Alt+ArrowDown in the field) opens a dialog with `ui-calendar`. Focus
 *   moves to the selected day and is trapped in the dialog; Escape or picking a day closes it
 *   and returns focus to the button. The dialog also has "Today" and "Clear" buttons.
 *
 * The value is a local `Date` at midnight. Implements `ControlValueAccessor`, so it binds with
 * `[formControl]`, `formControlName` and `[(ngModel)]`.
 *
 * @example
 * <ui-form-field label="Signing date" hint="DD.MM.YYYY">
 *   <ui-datepicker formControlName="signingDate" [min]="today" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-datepicker',
  imports: [
    CdkOverlayOrigin,
    CdkTrapFocus,
    UiButton,
    UiCalendar,
    ɵUiDropdownPanel,
    UiIcon,
    UiIconButton,
  ],
  template: `
    <div class="ui-datepicker__field" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <input
        #input
        type="text"
        class="ui-datepicker__input"
        autocomplete="off"
        dir="ltr"
        [attr.inputmode]="inputMode()"
        [id]="controlId()"
        [value]="text()"
        [placeholder]="placeholder() || hint()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [attr.aria-invalid]="showError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
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
        [disabled]="isDisabled() || readonly()"
        [attr.aria-expanded]="isOpen()"
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
      <div
        #panel
        class="ui-datepicker__panel"
        role="dialog"
        [id]="panelId()"
        aria-modal="true"
        cdkTrapFocus
        [attr.aria-label]="labels().chooseDate"
      >
        <ui-calendar
          [selected]="day()"
          [min]="min()"
          [max]="max()"
          [dateFilter]="dateFilter()"
          [startAt]="startAt()"
          (dateSelected)="onPick($event)"
        />
        <div class="ui-datepicker__footer">
          @if (text()) {
            <button
              ui-button
              variant="ghost"
              size="sm"
              class="ui-datepicker__clear"
              (click)="onClear()"
            >
              {{ labels().clear }}
            </button>
          }
          <button
            ui-button
            variant="ghost"
            size="sm"
            class="ui-datepicker__today"
            disabledInteractive
            [disabled]="!todayAllowed()"
            (click)="onToday()"
          >
            {{ labels().today }}
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: './datepicker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiDatepicker) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDatepicker), multi: true },
  ],
  // The base binds the modifier classes, `id`, the cleared `aria-label` and `aria-describedby`
  // (the input carries the label and descriptions) and `(focusout)`.
  host: { class: 'ui-datepicker' },
})
export class UiDatepicker extends UiCalendarDialogField<Date | null> {
  readonly value = model<Date | null>(null);
  readonly min = input<Date | null | undefined>(null);
  readonly max = input<Date | null | undefined>(null);
  readonly name = input('');

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  readonly labelStrategy = 'for' as const;
  /** The text field: `${id}-input`. */
  readonly controlId = computed(() => `${this.id()}-input`);

  /** The typed text, its commit and parse error, and writing the value. */
  protected readonly typedText = ɵinjectTypedText<Date, string, 'invalid'>({
    value: this.value,
    notify: (value) => this.notifyChange(value),
    // Text that is not an allowed day sets the value to `null` with a parse error.
    parse: (text) => {
      if (!text.trim()) return { value: null, error: null };
      const day = parseDay(text, this.locale());
      return day && isDayEnabled(day, this.min(), this.max(), this.dateFilter())
        ? { value: day, error: null }
        : { value: null, error: 'invalid' };
    },
    format: (day) => (day ? formatDay(day, this.locale()) : ''),
    // A written Invalid Date or string is a value the field shows empty.
    valid: validDay,
    equals: sameDay,
  });

  /** The typed text while there is one, otherwise the formatted value. */
  protected readonly text = this.typedText.text;

  /** The value when it is a valid `Date`; a string from an API or an Invalid Date is shown empty. */
  protected readonly day = computed(() => validDay(this.value()));

  /** Whether today can be picked (inside `min`/`max` and allowed by `dateFilter`). */
  protected readonly todayAllowed = computed(() =>
    isDayEnabled(startOfDay(new Date()), this.min(), this.max(), this.dateFilter()),
  );

  protected classPrefix(): string {
    return 'ui-datepicker';
  }

  /**
   * The field shows the parse message itself, bound or not: a text the user still has to fix is
   * not a validation failure of the consumer's control, which only ever sees `null`.
   */
  protected override ownErrors(): readonly string[] {
    return this.typedText.error() === 'invalid' ? [this.labels().invalidDate] : [];
  }

  writeValue(value: Date | null | undefined): void {
    this.typedText.write(value);
  }

  focus(options?: FocusOptions): void {
    this.input().nativeElement.focus(options);
  }

  protected onPick(date: Date): void {
    this.typedText.set(date);
    this.close();
  }

  protected onToday(): void {
    if (this.todayAllowed()) this.onPick(startOfDay(new Date()));
  }

  /** Empties the field, also when it holds text that is not a date. */
  protected onClear(): void {
    this.typedText.set(null);
    this.close();
  }

  protected onInput(event: Event): void {
    this.typedText.input((event.target as HTMLInputElement).value);
  }
}

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
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  ɵinjectTypedText,
  UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK,
  ɵUiDropdownPanel,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconCalendar } from '@vplans/ui-kit/icon';
import { UiCalendar } from './calendar';
import {
  UiDateFilter,
  formatDay,
  datePattern,
  formatHint,
  isDayEnabled,
  parseDay,
  sameDay,
  startOfDay,
  validDay,
} from './date-utils';

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
  host: {
    class: 'ui-datepicker',
    '[class]': '"ui-datepicker--" + size()',
    '[class.ui-datepicker--disabled]': 'isDisabled()',
    '[class.ui-datepicker--readonly]': 'readonly()',
    '[class.ui-datepicker--invalid]': 'showError()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
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
  readonly startAt = input<Date | null | undefined>(null);
  /** Defaults to the expected format, e.g. "DD.MM.YYYY". */
  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /** Host id; the text field gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-datepicker-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly opened = output();
  readonly closed = output();

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  protected readonly toggleElement = viewChild.required<string, ElementRef<HTMLButtonElement>>(
    'toggleButton',
    { read: ElementRef },
  );
  private readonly calendar = viewChild(UiCalendar);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly isOpen = signal(false);
  protected readonly positions = [...UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK];
  protected readonly calendarIcon = uiIconCalendar;

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);
  /** The calendar dialog, named by `aria-controls` of the button while it is open. */
  protected readonly panelId = computed(() => `${this.id()}-panel`);

  private readonly locale = computed(() => this.labels().locale);

  /** The typed text, its commit and parse error, and writing the value. */
  private readonly typedText = ɵinjectTypedText<Date, string, 'invalid'>({
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

  protected readonly hint = computed(() => formatHint(this.locale()));
  /** Numeric keypad with a dot on phones, when the locale separates the date with dots. */
  protected readonly inputMode = computed(() =>
    datePattern(this.locale()).separator === '.' ? 'decimal' : null,
  );

  /** The value when it is a valid `Date`; a string from an API or an Invalid Date is shown empty. */
  protected readonly day = computed(() => validDay(this.value()));

  /** Whether today can be picked (inside `min`/`max` and allowed by `dateFilter`). */
  protected readonly todayAllowed = computed(() =>
    isDayEnabled(startOfDay(new Date()), this.min(), this.max(), this.dateFilter()),
  );

  /**
   * The field shows the parse message itself, bound or not: a text the user still has to fix is
   * not a validation failure of the consumer's control, which only ever sees `null`.
   */
  protected override ownErrors(): readonly string[] {
    return this.typedText.error() ? [this.labels().invalidDate] : [];
  }

  writeValue(value: Date | null | undefined): void {
    this.typedText.write(value);
  }

  focus(options?: FocusOptions): void {
    this.input().nativeElement.focus(options);
  }

  open(): void {
    if (this.isOpen() || this.isDisabled() || this.readonly()) return;
    this.typedText.commit();
    this.isOpen.set(true);
    this.opened.emit();
  }

  close(): void {
    if (!this.isOpen()) return;
    // The panel returns focus that was inside it (or lost with it, after Escape) to the button.
    this.isOpen.set(false);
    this.closed.emit();
    // The user has dealt with the field, even when no day was picked.
    this.notifyTouched();
  }

  protected toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  protected onAttach(): void {
    afterNextRender(
      { write: () => this.calendar()?.focusActiveCell() },
      { injector: this.injector },
    );
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

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.open();
    } else if (event.key === 'Enter') {
      this.typedText.commit();
    }
  }

  protected onBlur(): void {
    this.typedText.commit();
  }

  /** Touched once focus leaves the field, its button and the calendar. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (this.host.contains(next) || this.panel()?.nativeElement.contains(next))) return;
    this.notifyTouched();
  }
}

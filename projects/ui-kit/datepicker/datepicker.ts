import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
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
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
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
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    CdkTrapFocus,
    UiButton,
    UiCalendar,
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
          [selected]="day()"
          [min]="min()"
          [max]="max()"
          [dateFilter]="dateFilter()"
          [startAt]="startAt()"
          (dateSelected)="onPick($event)"
        />
        <div class="ui-datepicker__footer">
          @if (text()) {
            <button ui-button variant="ghost" size="sm" (click)="onClear()">
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
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiDatepicker) }],
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
  private readonly document = inject(DOCUMENT);

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
  private readonly toggleButton = viewChild.required<string, ElementRef<HTMLButtonElement>>(
    'toggleButton',
    { read: ElementRef },
  );
  private readonly overlay = viewChild(CdkConnectedOverlay);
  private readonly calendar = viewChild(UiCalendar);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly isOpen = signal(false);
  protected readonly positions = POSITIONS;
  protected readonly calendarIcon = uiIconCalendar;

  /** Dropped when the value changes elsewhere, so old text does not come back. */
  private readonly draft = linkedSignal<Date | null, Draft | null>({
    source: () => this.value(),
    computation: (value, previous) => {
      const draft = previous?.value;
      // A written Invalid Date or string also drops the text: it is a value, and it shows empty.
      return draft && (draft.value === value || sameDay(draft.value, validDay(value)))
        ? draft
        : null;
    },
  });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);

  private readonly locale = computed(() => this.labels().locale);
  protected readonly hint = computed(() => formatHint(this.locale()));
  /** Numeric keypad with a dot on phones, when the locale separates the date with dots. */
  protected readonly inputMode = computed(() =>
    datePattern(this.locale()).separator === '.' ? 'decimal' : null,
  );

  /** The value when it is a valid `Date`; a string from an API or an Invalid Date is shown empty. */
  protected readonly day = computed(() => validDay(this.value()));

  /** The typed text while it belongs to the current value, otherwise the formatted value. */
  protected readonly text = computed(() => {
    const day = this.day();
    return this.draft()?.text ?? (day ? formatDay(day, this.locale()) : '');
  });

  /** Typed text that is not an allowed date. */
  protected readonly parseError = computed(() => {
    const draft = this.draft();
    return !!draft && draft.committed && draft.text.trim() !== '' && draft.value === null;
  });

  /** Whether today can be picked (inside `min`/`max` and allowed by `dateFilter`). */
  protected readonly todayAllowed = computed(() =>
    isDayEnabled(startOfDay(new Date()), this.min(), this.max(), this.dateFilter()),
  );

  /**
   * The field shows the parse message itself, bound or not: a text the user still has to fix is
   * not a validation failure of the consumer's control, which only ever sees `null`.
   */
  protected override ownErrors(): readonly string[] {
    return this.parseError() ? [this.labels().invalidDate] : [];
  }

  writeValue(value: Date | null | undefined): void {
    this.draft.set(null);
    this.value.set(validDay(value));
  }

  focus(options?: FocusOptions): void {
    this.input().nativeElement.focus(options);
  }

  open(): void {
    if (this.isOpen() || this.isDisabled() || this.readonly()) return;
    this.commitDraft();
    this.isOpen.set(true);
    this.opened.emit();
  }

  close(): void {
    if (!this.isOpen()) return;
    // Focus inside the panel (or lost with it, after Escape) returns to the button.
    const active = this.document.activeElement;
    const focusInPanel =
      !active || active === this.document.body || !!this.panel()?.nativeElement.contains(active);
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
    this.overlay()?.overlayRef.setDirection(resolveDirection(this.host));
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

  protected onToday(): void {
    if (this.todayAllowed()) this.onPick(startOfDay(new Date()));
  }

  /** Empties the field, also when it holds text that is not a date. */
  protected onClear(): void {
    this.draft.set(null);
    this.setValue(null);
    this.close();
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    const parsed = text.trim() ? parseDay(text, this.locale()) : null;
    const value =
      parsed && isDayEnabled(parsed, this.min(), this.max(), this.dateFilter()) ? parsed : null;
    this.setValue(value);
    this.draft.set({ text, value, committed: false });
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

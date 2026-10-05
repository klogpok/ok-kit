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
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkTrapFocus, _IdGenerator } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { map } from 'rxjs';
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
  UiDateRange,
  compareDays,
  datePattern,
  formatDay,
  formatHint,
  isDayEnabled,
  parseDay,
  sameRange,
  validRange,
} from './date-utils';

/** A quick pick of `ui-date-range-picker`, e.g. "Last 7 days". */
export interface UiDateRangePreset {
  label: string;
  /** The range, or a function called on each click (for ranges relative to today). */
  range: UiDateRange | (() => UiDateRange);
}

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
];

/** From this viewport width the calendar shows two months. */
const TWO_MONTHS_QUERY = '(min-width: 52rem)';

type Edge = 'start' | 'end';

/** Texts of the two fields. `edited` is the field the user typed in last. */
interface RangeText {
  start: string;
  end: string;
  edited?: Edge;
}

/** What the two texts mean. */
interface ParsedRange {
  value: UiDateRange | null;
  /** Text that is not an allowed date. */
  invalid: Record<Edge, boolean>;
  /** The end is before the start; the field typed last gets the error and no date. */
  order: Edge | null;
}

/** Texts the user is typing and what they mean. */
interface Draft {
  start: string;
  end: string;
  parsed: ParsedRange;
  /** The user left a field or pressed Enter: invalid text is now shown as an error. */
  committed: boolean;
}

const hasErrors = (parsed: ParsedRange): boolean =>
  parsed.invalid.start || parsed.invalid.end || parsed.order !== null;
/**
 * Date range field: a start and an end field that parse typed dates, and a calendar dialog that
 * picks both.
 *
 * - Each field is parsed like `ui-datepicker` (the `locale` label, default `he-IL`). Text that is
 *   not a date, or a day outside `minDate`/`maxDate`/`dateFilter`, sets that end to `null` and,
 *   once the user leaves the field, shows `labels().invalidDate`. An end before the start sets
 *   the field typed last to `null` and shows `labels().invalidDateRange`. Both messages are the
 *   field's own: they never become errors of a bound form control.
 * - The calendar button (or Alt+ArrowDown in a field) opens a dialog with two months side by
 *   side (one on narrow screens). The first pick sets the start, the second the end and closes
 *   the dialog; until then the day under the pointer or the focused day previews the range.
 *   `presets` add quick picks next to the calendar.
 *
 * The value is `{ start, end }` with local dates at midnight, or `null` when both are empty. A
 * range with one open end is kept (e.g. "from September 1"); add a validator when both are
 * needed. Implements `ControlValueAccessor`, so it binds with `[formControl]`, `formControlName`
 * and `[(ngModel)]`.
 *
 * @example
 * <ui-form-field label="Report period">
 *   <ui-date-range-picker formControlName="period" [maxDate]="today" [presets]="presets" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-date-range-picker',
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
    <div class="ui-date-range-picker__field" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      @for (edge of edges; track edge) {
        @if (edge === 'end') {
          <span class="ui-date-range-picker__separator" aria-hidden="true">–</span>
        }
        <input
          type="text"
          class="ui-date-range-picker__input"
          [class.ui-date-range-picker__input--invalid]="invalidState(edge)"
          autocomplete="off"
          dir="ltr"
          [attr.inputmode]="inputMode()"
          [id]="id() + '-' + edge"
          [value]="texts()[edge]"
          [placeholder]="placeholder() || hint()"
          [disabled]="isDisabled()"
          [readOnly]="readonly()"
          [attr.aria-labelledby]="inputLabelledBy(edge)"
          [attr.aria-required]="isRequired() ? 'true' : null"
          [attr.aria-invalid]="invalidState(edge) ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (input)="onInput(edge, $event)"
          (keydown)="onInputKeydown($event)"
          (blur)="commitDraft()"
        />
      }
      <button
        #toggleButton
        ui-icon-button
        class="ui-date-range-picker__toggle"
        size="sm"
        aria-haspopup="dialog"
        [label]="labels().chooseDateRange"
        [disabled]="isDisabled() || readonly()"
        [attr.aria-expanded]="isOpen()"
        (click)="toggle()"
      >
        <ui-icon [icon]="calendarIcon" />
      </button>
    </div>
    @for (label of hiddenLabels(); track label.id) {
      <span hidden [id]="label.id">{{ label.text }}</span>
    }

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
        class="ui-date-range-picker__panel"
        role="dialog"
        aria-modal="true"
        cdkTrapFocus
        [class.ui-date-range-picker__panel--wide]="monthsShown() > 1"
        [attr.aria-label]="labels().chooseDateRange"
      >
        @if (presets().length) {
          <div
            class="ui-date-range-picker__presets"
            role="group"
            [attr.aria-label]="labels().dateRangePresets"
          >
            @for (preset of presets(); track $index) {
              <button
                ui-button
                variant="ghost"
                size="sm"
                class="ui-date-range-picker__preset"
                (click)="onPreset(preset)"
              >
                {{ preset.label }}
              </button>
            }
          </div>
        }
        <div class="ui-date-range-picker__main">
          <ui-calendar
            range
            [selectedRange]="range()"
            [months]="monthsShown()"
            [min]="minDate()"
            [max]="maxDate()"
            [dateFilter]="dateFilter()"
            [startAt]="startAt()"
            (rangeSelected)="onRangePick($event)"
          />
          @if (texts().start || texts().end) {
            <div class="ui-date-range-picker__footer">
              <button ui-button variant="ghost" size="sm" (click)="onClear()">
                {{ labels().clear }}
              </button>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  styleUrl: './date-range-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiDateRangePicker) }],
  host: {
    class: 'ui-date-range-picker',
    role: 'group',
    '[class]': '"ui-date-range-picker--" + size()',
    '[class.ui-date-range-picker--disabled]': 'isDisabled()',
    '[class.ui-date-range-picker--readonly]': 'readonly()',
    '[class.ui-date-range-picker--invalid]': 'showError()',
    '[attr.id]': 'id()',
    '[attr.aria-labelledby]': 'groupLabelledBy()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    // The fields carry the names and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiDateRangePicker
  extends UiFormControlBase<UiDateRange | null>
  implements UiFormFieldControl
{
  protected readonly labels = inject(UI_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  readonly value = model<UiDateRange | null>(null);
  /** First day that can be picked or typed. */
  readonly minDate = input<Date | null | undefined>(null);
  /** Last day that can be picked or typed. */
  readonly maxDate = input<Date | null | undefined>(null);
  /** Return `false` for days that cannot be picked or typed. */
  readonly dateFilter = input<UiDateFilter | null>(null);
  /** Month shown when the calendar opens without a value. Defaults to today. */
  readonly startAt = input<Date | null | undefined>(null);
  /** Quick picks shown next to the calendar. */
  readonly presets = input<readonly UiDateRangePreset[]>([]);
  /** Placeholder of both fields. Defaults to the expected format, e.g. "DD.MM.YYYY". */
  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  /** Host id; the fields get `${id}-start` and `${id}-end`. */
  readonly id = input(inject(_IdGenerator).getId('ui-date-range-picker-'));
  /** Names the group when there is no `ui-form-field` label. */
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly opened = output();
  readonly closed = output();

  private readonly toggleButton = viewChild.required<string, ElementRef<HTMLButtonElement>>(
    'toggleButton',
    { read: ElementRef },
  );
  private readonly overlay = viewChild(CdkConnectedOverlay);
  private readonly calendar = viewChild(UiCalendar);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly edges: readonly Edge[] = ['start', 'end'];
  protected readonly isOpen = signal(false);
  protected readonly positions = POSITIONS;
  protected readonly calendarIcon = uiIconCalendar;

  private readonly breakpoints = inject(BreakpointObserver);
  /** Two months side by side, one on narrow screens. */
  protected readonly monthsShown = toSignal(
    this.breakpoints.observe(TWO_MONTHS_QUERY).pipe(map((state) => (state.matches ? 2 : 1))),
    { initialValue: this.breakpoints.isMatched(TWO_MONTHS_QUERY) ? 2 : 1 },
  );

  private readonly locale = computed(() => this.labels().locale);
  protected readonly hint = computed(() => formatHint(this.locale()));
  /** Numeric keypad with a dot on phones, when the locale separates the date with dots. */
  protected readonly inputMode = computed(() =>
    datePattern(this.locale()).separator === '.' ? 'decimal' : null,
  );

  /** The value when it holds valid dates; anything else is shown empty. */
  protected readonly range = computed(() => validRange(this.value()));

  /** Dropped when the value changes elsewhere, so old text does not come back. */
  private readonly draft = linkedSignal<UiDateRange | null, Draft | null>({
    source: () => this.value(),
    computation: (value, previous) => {
      const draft = previous?.value;
      // A written range the picker cannot read also drops the text: it is a value, and it shows
      // empty. Only the very object the draft produced, or the same days, keeps the text.
      const parsed = draft?.parsed.value ?? null;
      const written = validRange(value);
      return draft && (parsed === value || (!!parsed && !!written && sameRange(parsed, written)))
        ? draft
        : null;
    },
  });

  readonly labelStrategy = 'labelledby' as const;
  readonly controlId = computed(() => `${this.id()}-start`);

  /** The typed texts while they belong to the current value, otherwise the formatted value. */
  protected readonly texts = computed<Record<Edge, string>>(() => {
    const draft = this.draft();
    return draft ? { start: draft.start, end: draft.end } : this.format(this.range());
  });

  /** Fields whose committed text is not an allowed date, or is on the wrong side of the other. */
  private readonly fieldErrors = computed<Record<Edge, boolean>>(() => {
    const draft = this.draft();
    if (!draft?.committed) return { start: false, end: false };
    const { invalid, order } = draft.parsed;
    return { start: invalid.start || order === 'start', end: invalid.end || order === 'end' };
  });

  /** Message for committed text that is not a valid range. */
  private readonly parseMessage = computed(() => {
    const draft = this.draft();
    if (!draft?.committed) return null;
    const { invalid, order } = draft.parsed;
    if (invalid.start || invalid.end) return this.labels().invalidDate;
    return order ? this.labels().invalidDateRange : null;
  });

  /** The `aria-label` names the group only without a field label. */
  private readonly ownLabel = computed(() => !this.formField?.labelledBy() && !!this.ariaLabel());
  protected readonly groupLabelledBy = computed(
    () => this.formField?.labelledBy() ?? (this.ownLabel() ? `${this.id()}-label` : null),
  );
  protected readonly hiddenLabels = computed(() => [
    ...(this.ownLabel() ? [{ id: `${this.id()}-label`, text: this.ariaLabel() }] : []),
    { id: `${this.id()}-start-name`, text: this.labels().startDate },
    { id: `${this.id()}-end-name`, text: this.labels().endDate },
  ]);

  /**
   * The field shows the parse and order messages itself, bound or not: text the user still has to
   * fix is not a validation failure of the consumer's control, which only ever sees the days it
   * could read.
   */
  protected override ownErrors(): readonly string[] {
    const message = this.parseMessage();
    return message ? [message] : [];
  }

  writeValue(value: UiDateRange | null | undefined): void {
    this.draft.set(null);
    this.value.set(validRange(value));
  }

  /** Focuses the start field. */
  focus(options?: FocusOptions): void {
    this.host.querySelector<HTMLInputElement>('.ui-date-range-picker__input')?.focus(options);
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
    // The user has dealt with the field, even when nothing was picked.
    this.notifyTouched();
  }

  protected toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  /** A field with invalid text is marked alone; other errors (e.g. required) mark both. */
  protected invalidState(edge: Edge): boolean {
    const errors = this.fieldErrors();
    return errors.start || errors.end ? errors[edge] : this.showError();
  }

  protected inputLabelledBy(edge: Edge): string {
    return [this.groupLabelledBy(), `${this.id()}-${edge}-name`].filter(Boolean).join(' ');
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

  /** The first pick sets the start; the second sets the end and closes the dialog. */
  protected onRangePick(range: UiDateRange): void {
    this.draft.set(null);
    this.setValue(validRange(range));
    if (range.end) this.close();
  }

  protected onPreset(preset: UiDateRangePreset): void {
    const range = typeof preset.range === 'function' ? preset.range() : preset.range;
    this.draft.set(null);
    this.setValue(validRange(range));
    this.close();
  }

  /** Empties both fields, also when they hold text that is not a date. */
  protected onClear(): void {
    this.draft.set(null);
    this.setValue(null);
    this.close();
  }

  protected onInput(edge: Edge, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    const raw: RangeText = { ...this.texts(), [edge]: text, edited: edge };
    const parsed = this.parse(raw);
    this.setValue(parsed.value);
    this.draft.set({ start: raw.start, end: raw.end, parsed, committed: false });
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.open();
    } else if (event.key === 'Enter') {
      this.commitDraft();
    }
  }

  /** Touched once focus leaves the fields, the button and the calendar. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && (this.host.contains(next) || this.panel()?.nativeElement.contains(next))) return;
    this.notifyTouched();
  }

  /** Shows valid typed dates in the locale format; keeps invalid text for the user to fix. */
  protected commitDraft(): void {
    const draft = this.draft();
    if (!draft) return;
    this.draft.set(hasErrors(draft.parsed) ? { ...draft, committed: true } : null);
  }

  private parse(raw: RangeText): ParsedRange {
    const day = (text: string): { date: Date | null; invalid: boolean } => {
      if (!text.trim()) return { date: null, invalid: false };
      const date = parseDay(text, this.locale());
      return date && isDayEnabled(date, this.minDate(), this.maxDate(), this.dateFilter())
        ? { date, invalid: false }
        : { date: null, invalid: true };
    };
    const start = day(raw.start);
    const end = day(raw.end);
    let order: Edge | null = null;
    if (start.date && end.date && compareDays(end.date, start.date) < 0) {
      order = raw.edited ?? 'end';
      (order === 'start' ? start : end).date = null;
    }
    return {
      value: start.date || end.date ? { start: start.date, end: end.date } : null,
      invalid: { start: start.invalid, end: end.invalid },
      order,
    };
  }

  private format(range: UiDateRange | null): RangeText {
    const text = (date: Date | null | undefined) => (date ? formatDay(date, this.locale()) : '');
    return { start: text(range?.start), end: text(range?.end) };
  }

  private setValue(value: UiDateRange | null): void {
    if (sameRange(value, this.range())) return;
    this.value.set(value);
    this.notifyChange(value);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { map } from 'rxjs';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import {
  UI_FORM_FIELD_CONTROL,
  ɵinjectTypedText,
  type ɵUiTypedTextParse,
  ɵUiDropdownPanel,
  UI_BREAKPOINTS,
} from '@vplans/ui-kit/core';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiCalendar } from './calendar';
import { UiCalendarDialogField } from './calendar-dialog-field';
import {
  UiDateRange,
  compareDays,
  formatDay,
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

/** From the md breakpoint up the calendar shows two months. */
const TWO_MONTHS_QUERY = UI_BREAKPOINTS.md;

type Edge = 'start' | 'end';

/** Texts of the two fields. `edited` is the field the user typed in last. */
interface RangeText {
  start: string;
  end: string;
  edited?: Edge;
}

/**
 * Parse error of the two texts: a field holds text that is not an allowed date (`invalid`), or
 * the end is before the start (`order`) and the field typed last gets the error and no date.
 * `fields` marks the fields with the error.
 */
interface RangeParseError {
  kind: 'invalid' | 'order';
  fields: Record<Edge, boolean>;
}

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
 * - `placeholder` applies to both fields. The fields get the ids `${id}-start` and `${id}-end`.
 *   `aria-label` names the group when there is no `ui-form-field` label.
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
    CdkOverlayOrigin,
    CdkTrapFocus,
    UiButton,
    UiCalendar,
    ɵUiDropdownPanel,
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
          (blur)="onBlur()"
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
        [attr.aria-controls]="isOpen() ? panelId() : null"
        (click)="toggle()"
      >
        <ui-icon [icon]="calendarIcon" />
      </button>
    </div>
    @for (label of hiddenLabels(); track label.id) {
      <span hidden [id]="label.id">{{ label.text }}</span>
    }

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
        class="ui-date-range-picker__panel"
        role="dialog"
        [id]="panelId()"
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
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiDateRangePicker) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDateRangePicker), multi: true },
  ],
  // The base binds the modifier classes, `id`, the cleared `aria-label` and `aria-describedby`
  // (the fields carry the names and descriptions) and `(focusout)`.
  host: {
    class: 'ui-date-range-picker',
    role: 'group',
    '[attr.aria-labelledby]': 'groupLabelledBy()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
  },
})
export class UiDateRangePicker extends UiCalendarDialogField<UiDateRange | null> {
  readonly value = model<UiDateRange | null>(null);
  /** First day that can be picked or typed. */
  readonly minDate = input<Date | null | undefined>(null);
  /** Last day that can be picked or typed. */
  readonly maxDate = input<Date | null | undefined>(null);
  /** Quick picks shown next to the calendar. */
  readonly presets = input<readonly UiDateRangePreset[]>([]);

  protected readonly edges: readonly Edge[] = ['start', 'end'];

  private readonly breakpoints = inject(BreakpointObserver);
  /** Two months side by side, one on narrow screens. */
  protected readonly monthsShown = toSignal(
    this.breakpoints.observe(TWO_MONTHS_QUERY).pipe(map((state) => (state.matches ? 2 : 1))),
    { initialValue: this.breakpoints.isMatched(TWO_MONTHS_QUERY) ? 2 : 1 },
  );

  /** The value when it holds valid dates; anything else is shown empty. */
  protected readonly range = computed(() => validRange(this.value()));

  /** The typed texts, their commit and parse error, and writing the value. */
  protected readonly typedText = ɵinjectTypedText<UiDateRange, RangeText, RangeParseError>({
    value: this.value,
    notify: (value) => this.notifyChange(value),
    parse: (text) => this.parse(text),
    format: (range) => this.format(range),
    // A written range the picker cannot read is a value it shows empty.
    valid: validRange,
    equals: sameRange,
  });

  readonly labelStrategy = 'labelledby' as const;
  /** The start field: `${id}-start`; the end field is `${id}-end`. */
  readonly controlId = computed(() => `${this.id()}-start`);

  /** The typed texts while there are some, otherwise the formatted value. */
  protected readonly texts = this.typedText.text;

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
    const error = this.typedText.error();
    if (!error) return [];
    const labels = this.labels();
    return [error.kind === 'invalid' ? labels.invalidDate : labels.invalidDateRange];
  }

  writeValue(value: UiDateRange | null | undefined): void {
    this.typedText.write(value);
  }

  /** Focuses the start field. */
  focus(options?: FocusOptions): void {
    this.host.querySelector<HTMLInputElement>('.ui-date-range-picker__input')?.focus(options);
  }

  protected classPrefix(): string {
    return 'ui-date-range-picker';
  }

  /** A field with invalid text is marked alone; other errors (e.g. required) mark both. */
  protected invalidState(edge: Edge): boolean {
    const fields = this.typedText.error()?.fields;
    return fields ? fields[edge] : this.showError();
  }

  protected inputLabelledBy(edge: Edge): string {
    return [this.groupLabelledBy(), `${this.id()}-${edge}-name`].filter(Boolean).join(' ');
  }

  /** The first pick sets the start; the second sets the end and closes the dialog. */
  protected onRangePick(range: UiDateRange): void {
    this.typedText.set(validRange(range));
    if (range.end) this.close();
  }

  protected onPreset(preset: UiDateRangePreset): void {
    const range = typeof preset.range === 'function' ? preset.range() : preset.range;
    this.typedText.set(validRange(range));
    this.close();
  }

  /** Empties both fields, also when they hold text that is not a date. */
  protected onClear(): void {
    this.typedText.set(null);
    this.close();
  }

  protected onInput(edge: Edge, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.typedText.input({ ...this.texts(), [edge]: text, edited: edge });
  }

  /**
   * Each text is a day like `ui-datepicker` reads it; an end before the start drops the day of the
   * field typed last. Two blank fields give no value and no error.
   */
  private parse(raw: RangeText): ɵUiTypedTextParse<UiDateRange, RangeParseError> {
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
    const fields = {
      start: start.invalid || order === 'start',
      end: end.invalid || order === 'end',
    };
    const kind = start.invalid || end.invalid ? 'invalid' : order ? 'order' : null;
    return {
      value: start.date || end.date ? { start: start.date, end: end.date } : null,
      error: kind ? { kind, fields } : null,
    };
  }

  private format(range: UiDateRange | null): RangeText {
    const text = (date: Date | null | undefined) => (date ? formatDay(date, this.locale()) : '');
    return { start: text(range?.start), end: text(range?.end) };
  }
}

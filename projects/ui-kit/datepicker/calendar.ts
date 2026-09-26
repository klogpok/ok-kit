import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UI_LABELS, resolveDirection } from '@vplans/ui-kit/core';
import {
  UiIcon,
  uiIconChevronLeft,
  uiIconChevronRight,
  uiIconChevronsLeft,
  uiIconChevronsRight,
} from '@vplans/ui-kit/icon';
import {
  UiDateFilter,
  addDays,
  addMonths,
  clampDay,
  compareDays,
  daysInMonth,
  firstDayOfWeek,
  isDayEnabled,
  sameDay,
  startOfDay,
  validDay,
} from './date-utils';

/** A Sunday, used to list the weekday names from the first day of the week. */
const REFERENCE_SUNDAY = new Date(2026, 0, 4);

/** What the calendar shows: the days of a month, the months of a year, or a page of years. */
export type UiCalendarView = 'day' | 'month' | 'year';

/** Columns of the month and year grids. */
const COLUMNS = 4;
/** Years on one page of the year view. */
const YEARS_PER_PAGE = 24;

interface PeriodCell {
  /** First day of the month or year. */
  date: Date;
  label: string;
  /** Accessible name, e.g. "September 2026". */
  name: string;
  key: string;
}

/**
 * Month grid for picking a date (WAI-ARIA date picker grid). Usable inline or inside
 * `ui-datepicker`. Month and weekday names, the first day of the week and the day labels come
 * from the `locale` label (default `he-IL`).
 *
 * Keyboard on the grid: arrows move by day and week (Left/Right mirrored in RTL), Home/End go to
 * the start/end of the week, PageUp/PageDown change the month and Shift+PageUp/PageDown the year,
 * Enter or Space picks the focused day. Days outside `min`/`max` or rejected by `dateFilter` can
 * be focused but not picked.
 *
 * The title button switches to a grid of months, and from there to a grid of years, for long
 * jumps. Picking a year shows its months; picking a month shows its days. The same keys move
 * in these grids (PageUp/PageDown by a year or a page of years); Escape goes back to the days.
 *
 * @example <ui-calendar [(selected)]="date" [min]="today" />
 */
@Component({
  selector: 'ui-calendar',
  imports: [UiIcon, UiIconButton],
  template: `
    <!-- disabledInteractive: a button disabled by its own click keeps focus in the dialog. -->
    <div class="ui-calendar__header">
      <button
        ui-icon-button
        size="sm"
        [label]="labels().previousYear"
        disabledInteractive
        [disabled]="!canMove(-step().long)"
        (click)="moveMonths(-step().long)"
      >
        <ui-icon [icon]="icons.previousYear" flipRtl />
      </button>
      @if (view() === 'day') {
        <button
          ui-icon-button
          size="sm"
          [label]="labels().previousMonth"
          disabledInteractive
          [disabled]="!canMove(-1)"
          (click)="moveMonths(-1)"
        >
          <ui-icon [icon]="icons.previousMonth" flipRtl />
        </button>
      }
      @if (view() === 'year') {
        <div class="ui-calendar__title ui-calendar__title--static">{{ heading() }}</div>
      } @else {
        <button
          type="button"
          class="ui-calendar__title"
          [attr.aria-label]="heading() + ', ' + switchLabel()"
          (click)="switchView()"
        >
          {{ heading() }}
        </button>
      }
      @if (view() === 'day') {
        <button
          ui-icon-button
          size="sm"
          [label]="labels().nextMonth"
          disabledInteractive
          [disabled]="!canMove(1)"
          (click)="moveMonths(1)"
        >
          <ui-icon [icon]="icons.nextMonth" flipRtl />
        </button>
      }
      <button
        ui-icon-button
        size="sm"
        [label]="labels().nextYear"
        disabledInteractive
        [disabled]="!canMove(step().long)"
        (click)="moveMonths(step().long)"
      >
        <ui-icon [icon]="icons.nextYear" flipRtl />
      </button>
    </div>
    <!-- Names the grid and announces month changes. -->
    <span class="ui-calendar__live" aria-live="polite" [id]="titleId">{{ heading() }}</span>

    <!-- Keyboard handling lives on the grid; the cells are the focusable elements. -->
    @if (view() === 'day') {
      <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
      <table
        role="grid"
        class="ui-calendar__grid"
        [attr.aria-labelledby]="titleId"
        (keydown)="onKeydown($event)"
      >
        <thead>
          <tr>
            @for (weekday of weekdays(); track weekday.long) {
              <th scope="col" [attr.abbr]="weekday.long">{{ weekday.short }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (week of weeks(); track $index) {
            <tr>
              @for (day of week; track $index) {
                @if (day) {
                  <td
                    class="ui-calendar__day"
                    [class.ui-calendar__day--selected]="isSelected(day)"
                    [class.ui-calendar__day--today]="isToday(day)"
                    [class.ui-calendar__day--disabled]="!isEnabled(day)"
                    [attr.tabindex]="isActive(day) ? 0 : -1"
                    [attr.aria-selected]="isSelected(day) ? 'true' : null"
                    [attr.aria-current]="isToday(day) ? 'date' : null"
                    [attr.aria-disabled]="isEnabled(day) ? null : 'true'"
                    [attr.aria-label]="dayLabel(day)"
                    [attr.data-date]="dayKey(day)"
                    (click)="pick(day)"
                    (focus)="active.set(day)"
                  >
                    {{ day.getDate() }}
                  </td>
                } @else {
                  <td class="ui-calendar__blank"></td>
                }
              }
            </tr>
          }
        </tbody>
      </table>
    } @else {
      <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
      <table
        role="grid"
        class="ui-calendar__grid ui-calendar__periods"
        [attr.aria-labelledby]="titleId"
        (keydown)="onKeydown($event)"
      >
        <tbody>
          @for (row of periods(); track $index) {
            <tr>
              @for (period of row; track period.key) {
                <td
                  class="ui-calendar__period"
                  [class.ui-calendar__day--selected]="isPeriodSelected(period.date)"
                  [class.ui-calendar__day--today]="isPeriodCurrent(period.date)"
                  [class.ui-calendar__day--disabled]="!isPeriodEnabled(period.date)"
                  [attr.tabindex]="isPeriodActive(period.date) ? 0 : -1"
                  [attr.aria-selected]="isPeriodSelected(period.date) ? 'true' : null"
                  [attr.aria-current]="isPeriodCurrent(period.date) ? 'date' : null"
                  [attr.aria-disabled]="isPeriodEnabled(period.date) ? null : 'true'"
                  [attr.aria-label]="period.name"
                  [attr.data-period]="period.key"
                  (click)="pickPeriod(period.date)"
                >
                  {{ period.label }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-calendar', '[class]': '"ui-calendar--" + view()' },
})
export class UiCalendar {
  protected readonly labels = inject(UI_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  protected readonly titleId = inject(_IdGenerator).getId('ui-calendar-title-');
  protected readonly icons = {
    previousYear: uiIconChevronsLeft,
    previousMonth: uiIconChevronLeft,
    nextMonth: uiIconChevronRight,
    nextYear: uiIconChevronsRight,
  };

  /** The picked day. Two-way bindable. */
  readonly selected = model<Date | null>(null);
  readonly min = input<Date | null | undefined>(null);
  readonly max = input<Date | null | undefined>(null);
  /** Return `false` for days that cannot be picked (e.g. weekends). */
  readonly dateFilter = input<UiDateFilter | null>(null);
  /** Day shown when nothing is selected. Defaults to today. */
  readonly startAt = input<Date | null | undefined>(null);

  /** Emits on every pick, also when the same day is picked again. */
  readonly dateSelected = output<Date>();

  private readonly today = startOfDay(new Date());

  /** Days, months or years. Starts with the days. */
  protected readonly view = signal<UiCalendarView>('day');

  /** The focusable day; it decides the month shown. Resets when the selection changes. */
  protected readonly active = linkedSignal(() =>
    clampDay(
      startOfDay(validDay(this.selected()) ?? validDay(this.startAt()) ?? this.today),
      this.min(),
      this.max(),
    ),
  );

  private readonly locale = computed(() => this.labels().locale);
  private readonly firstDay = computed(() => firstDayOfWeek(this.locale()));
  private readonly dayFormat = computed(
    () =>
      new Intl.DateTimeFormat(this.locale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
  );
  private readonly monthYearFormat = computed(
    () => new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }),
  );

  /** Months moved by the double-chevron buttons and Shift+PageUp/PageDown in each view. */
  protected readonly step = computed(() => ({
    long: this.view() === 'year' ? 12 * YEARS_PER_PAGE : 12,
  }));

  /** First year of the page shown in the year view. */
  private readonly pageStart = computed(
    () => Math.floor(this.active().getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE,
  );

  protected readonly heading = computed(() => {
    const active = this.active();
    switch (this.view()) {
      case 'day':
        return this.monthYearFormat().format(active);
      case 'month':
        return String(active.getFullYear());
      case 'year':
        return `⁦${this.pageStart()} – ${this.pageStart() + YEARS_PER_PAGE - 1}⁩`;
    }
  });

  protected readonly switchLabel = computed(() =>
    this.view() === 'day' ? this.labels().chooseMonth : this.labels().chooseYear,
  );

  protected readonly weekdays = computed(() => {
    const short = new Intl.DateTimeFormat(this.locale(), { weekday: 'narrow' });
    const long = new Intl.DateTimeFormat(this.locale(), { weekday: 'long' });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(REFERENCE_SUNDAY, (this.firstDay() + i) % 7);
      return { short: short.format(day), long: long.format(day) };
    });
  });

  /** Weeks of the active month; days of other months are `null`. */
  protected readonly weeks = computed(() => {
    const year = this.active().getFullYear();
    const month = this.active().getMonth();
    const offset = (new Date(year, month, 1).getDay() - this.firstDay() + 7) % 7;
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth(year, month); day++) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  });

  /** Rows of the month or year grid. */
  protected readonly periods = computed<PeriodCell[][]>(() => {
    const year = this.active().getFullYear();
    let cells: PeriodCell[];
    if (this.view() === 'month') {
      const short = new Intl.DateTimeFormat(this.locale(), { month: 'short' });
      cells = Array.from({ length: 12 }, (_, month) => {
        const date = new Date(year, month, 1);
        return {
          date,
          label: short.format(date),
          name: this.monthYearFormat().format(date),
          key: `${year}-${String(month + 1).padStart(2, '0')}`,
        };
      });
    } else {
      cells = Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
        const date = new Date(this.pageStart() + i, 0, 1);
        date.setFullYear(this.pageStart() + i);
        const label = String(date.getFullYear());
        return { date, label, name: label, key: label };
      });
    }
    return Array.from({ length: cells.length / COLUMNS }, (_, i) =>
      cells.slice(i * COLUMNS, i * COLUMNS + COLUMNS),
    );
  });

  /** Moves keyboard focus to the active cell. */
  focusActiveCell(): void {
    this.host.querySelector<HTMLElement>('.ui-calendar__grid [tabindex="0"]')?.focus();
  }

  protected isSelected(day: Date): boolean {
    return sameDay(day, validDay(this.selected()));
  }

  protected isToday(day: Date): boolean {
    return sameDay(day, this.today);
  }

  protected isActive(day: Date): boolean {
    return sameDay(day, this.active());
  }

  protected isEnabled(day: Date): boolean {
    return isDayEnabled(day, this.min(), this.max(), this.dateFilter());
  }

  protected dayLabel(day: Date): string {
    return this.dayFormat().format(day);
  }

  protected dayKey(day: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
  }

  // --- Month and year cells ----------------------------------------------------------------

  /** Whether a month (month view) or a year (year view) contains `date`. */
  private samePeriod(period: Date, date: Date | null | undefined): boolean {
    if (!date) return false;
    const sameYear = period.getFullYear() === date.getFullYear();
    return this.view() === 'month' ? sameYear && period.getMonth() === date.getMonth() : sameYear;
  }

  /** First and last day of a month or a year cell. */
  private periodRange(period: Date): [Date, Date] {
    const year = period.getFullYear();
    return this.view() === 'month'
      ? [period, new Date(year, period.getMonth() + 1, 0)]
      : [period, new Date(year, 11, 31)];
  }

  protected isPeriodSelected(period: Date): boolean {
    return this.samePeriod(period, validDay(this.selected()));
  }

  protected isPeriodCurrent(period: Date): boolean {
    return this.samePeriod(period, this.today);
  }

  protected isPeriodActive(period: Date): boolean {
    return this.samePeriod(period, this.active());
  }

  /** A month or year with at least one day inside `min`/`max`. */
  protected isPeriodEnabled(period: Date): boolean {
    const [first, last] = this.periodRange(period);
    const min = this.min();
    const max = this.max();
    return !(min && compareDays(last, min) < 0) && !(max && compareDays(first, max) > 0);
  }

  protected pickPeriod(period: Date): void {
    if (!this.isPeriodEnabled(period)) return;
    const active = this.active();
    const target =
      this.view() === 'month'
        ? addMonths(
            active,
            (period.getFullYear() - active.getFullYear()) * 12 +
              period.getMonth() -
              active.getMonth(),
          )
        : addMonths(active, (period.getFullYear() - active.getFullYear()) * 12);
    this.active.set(clampDay(target, this.min(), this.max()));
    this.setView(this.view() === 'month' ? 'day' : 'month');
  }

  protected switchView(): void {
    this.setView(this.view() === 'day' ? 'month' : 'year');
  }

  private setView(view: UiCalendarView): void {
    this.view.set(view);
    afterNextRender({ write: () => this.focusActiveCell() }, { injector: this.injector });
  }

  // --- Navigation ----------------------------------------------------------------------------

  /** Whether moving by `months` shows a period with at least one day inside `min`/`max`. */
  protected canMove(months: number): boolean {
    const target = addMonths(this.active(), months);
    let first: Date;
    let last: Date;
    if (this.view() === 'day') {
      first = new Date(target.getFullYear(), target.getMonth(), 1);
      last = new Date(target.getFullYear(), target.getMonth() + 1, 0);
    } else {
      const span = this.view() === 'year' ? YEARS_PER_PAGE : 1;
      const start =
        this.view() === 'year'
          ? Math.floor(target.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE
          : target.getFullYear();
      first = new Date(start, 0, 1);
      last = new Date(start + span - 1, 11, 31);
    }
    const min = this.min();
    const max = this.max();
    return !(min && compareDays(last, min) < 0) && !(max && compareDays(first, max) > 0);
  }

  protected moveMonths(months: number): void {
    this.active.set(clampDay(addMonths(this.active(), months), this.min(), this.max()));
  }

  protected pick(day: Date): void {
    if (!this.isEnabled(day)) return;
    this.active.set(day);
    this.selected.set(day);
    this.dateSelected.emit(day);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.view() === 'day') this.onDayKeydown(event);
    else this.onPeriodKeydown(event);
  }

  private onDayKeydown(event: KeyboardEvent): void {
    const active = this.active();
    const rtl = resolveDirection(this.host) === 'rtl';
    const weekStart = (active.getDay() - this.firstDay() + 7) % 7;
    let next: Date;

    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(active, rtl ? 1 : -1);
        break;
      case 'ArrowRight':
        next = addDays(active, rtl ? -1 : 1);
        break;
      case 'ArrowUp':
        next = addDays(active, -7);
        break;
      case 'ArrowDown':
        next = addDays(active, 7);
        break;
      case 'Home':
        next = addDays(active, -weekStart);
        break;
      case 'End':
        next = addDays(active, 6 - weekStart);
        break;
      case 'PageUp':
        next = addMonths(active, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(active, event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.pick(active);
        return;
      default:
        return;
    }

    event.preventDefault();
    this.active.set(clampDay(next, this.min(), this.max()));
    afterNextRender({ write: () => this.focusActiveCell() }, { injector: this.injector });
  }

  /** Arrows move by one month (year), Up/Down by a row, PageUp/PageDown by a year (page). */
  private onPeriodKeydown(event: KeyboardEvent): void {
    const active = this.active();
    const rtl = resolveDirection(this.host) === 'rtl';
    const unit = this.view() === 'month' ? 1 : 12;
    const index =
      this.view() === 'month' ? active.getMonth() : active.getFullYear() - this.pageStart();
    const column = index % COLUMNS;
    let cells: number;

    switch (event.key) {
      case 'ArrowLeft':
        cells = rtl ? 1 : -1;
        break;
      case 'ArrowRight':
        cells = rtl ? -1 : 1;
        break;
      case 'ArrowUp':
        cells = -COLUMNS;
        break;
      case 'ArrowDown':
        cells = COLUMNS;
        break;
      case 'Home':
        cells = -column;
        break;
      case 'End':
        cells = COLUMNS - 1 - column;
        break;
      case 'PageUp':
        cells = -(this.view() === 'month' ? 12 : YEARS_PER_PAGE);
        break;
      case 'PageDown':
        cells = this.view() === 'month' ? 12 : YEARS_PER_PAGE;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.pickPeriod(
          this.view() === 'month'
            ? new Date(active.getFullYear(), active.getMonth(), 1)
            : new Date(active.getFullYear(), 0, 1),
        );
        return;
      case 'Escape':
        // Back to the days; the datepicker panel stays open.
        event.preventDefault();
        event.stopPropagation();
        this.setView('day');
        return;
      default:
        return;
    }

    event.preventDefault();
    this.active.set(clampDay(addMonths(active, cells * unit), this.min(), this.max()));
    afterNextRender({ write: () => this.focusActiveCell() }, { injector: this.injector });
  }
}

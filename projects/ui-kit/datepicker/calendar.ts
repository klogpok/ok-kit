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
} from './date-utils';

/** A Sunday, used to list the weekday names from the first day of the week. */
const REFERENCE_SUNDAY = new Date(2026, 0, 4);

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
 * @example <ui-calendar [(selected)]="date" [min]="today" />
 */
@Component({
  selector: 'ui-calendar',
  imports: [UiIcon, UiIconButton],
  template: `
    <div class="ui-calendar__header">
      <button
        ui-icon-button
        size="sm"
        [label]="labels().previousYear"
        [disabled]="!canMove(-12)"
        (click)="moveMonths(-12)"
      >
        <ui-icon [icon]="icons.previousYear" flipRtl />
      </button>
      <button
        ui-icon-button
        size="sm"
        [label]="labels().previousMonth"
        [disabled]="!canMove(-1)"
        (click)="moveMonths(-1)"
      >
        <ui-icon [icon]="icons.previousMonth" flipRtl />
      </button>
      <div class="ui-calendar__title" [id]="titleId" aria-live="polite">{{ title() }}</div>
      <button
        ui-icon-button
        size="sm"
        [label]="labels().nextMonth"
        [disabled]="!canMove(1)"
        (click)="moveMonths(1)"
      >
        <ui-icon [icon]="icons.nextMonth" flipRtl />
      </button>
      <button
        ui-icon-button
        size="sm"
        [label]="labels().nextYear"
        [disabled]="!canMove(12)"
        (click)="moveMonths(12)"
      >
        <ui-icon [icon]="icons.nextYear" flipRtl />
      </button>
    </div>

    <!-- Keyboard handling lives on the grid; the day cells are the focusable elements. -->
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
                  [attr.aria-selected]="isSelected(day)"
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
  `,
  styleUrl: './calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-calendar' },
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
  readonly startAt = input<Date | null>(null);

  /** Emits on every pick, also when the same day is picked again. */
  readonly dateSelected = output<Date>();

  private readonly today = startOfDay(new Date());

  /** The focusable day; it decides the month shown. Resets when the selection changes. */
  protected readonly active = linkedSignal(() =>
    clampDay(startOfDay(this.selected() ?? this.startAt() ?? this.today), this.min(), this.max()),
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

  protected readonly title = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(
      this.active(),
    ),
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

  /** Moves keyboard focus to the active day. */
  focusActiveCell(): void {
    this.host.querySelector<HTMLElement>('.ui-calendar__day[tabindex="0"]')?.focus();
  }

  protected isSelected(day: Date): boolean {
    return sameDay(day, this.selected());
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

  /** Whether moving by `months` shows a month with at least one day inside `min`/`max`. */
  protected canMove(months: number): boolean {
    const target = addMonths(this.active(), months);
    const first = new Date(target.getFullYear(), target.getMonth(), 1);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0);
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
}

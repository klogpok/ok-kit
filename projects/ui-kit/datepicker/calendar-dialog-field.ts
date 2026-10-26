import {
  Directive,
  ElementRef,
  Injector,
  Signal,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  type ɵUiTypedText,
} from '@vplans/ui-kit/core';
import { uiIconCalendar } from '@vplans/ui-kit/icon';
import { UiCalendar } from './calendar';
import { UiDateFilter, datePattern, formatHint } from './date-utils';

/**
 * The calendar dialog of a date field (`ui-datepicker`, `ui-date-range-picker`): its open state,
 * opening and closing, focus on the active day, Alt+ArrowDown and Enter in a field, touched, the
 * shared inputs and outputs, and the host id and classes built from `classPrefix()`.
 *
 * A field adds its value semantics, its limits and its typed text, and follows the template
 * contract:
 * - the calendar button carries `#toggleButton` and calls `toggle()` on click; it binds
 *   `aria-expanded` to `isOpen()` and `aria-controls` to `panelId()` while open;
 * - the `uiDropdownPanel` takes `[open]="isOpen()"`, `[positions]="positions"`,
 *   `[returnFocusTo]="toggleElement()"`, `(attached)="onAttach()"` and `(closed)="close()"`;
 * - the dialog element carries `#panel` and `[id]="panelId()"`, and holds one `ui-calendar`;
 * - each text field calls `onInputKeydown($event)` from `(keydown)` and `onBlur()` from `(blur)`.
 *
 * The field lists its own `UI_FORM_FIELD_CONTROL` and `NG_VALUE_ACCESSOR` providers.
 *
 * Internal.
 */
@Directive({
  host: {
    '[class]': 'hostClasses()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export abstract class UiCalendarDialogField<V>
  extends UiFormControlBase<V>
  implements UiFormFieldControl
{
  protected readonly labels = inject(UI_LABELS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  /**
   * BEM block of the host classes and prefix of the generated id, e.g. `'ui-datepicker'`. A
   * method, not a field: the `id` default reads it while this class is built, before the field's
   * own initializers have run.
   */
  protected abstract classPrefix(): string;

  /**
   * The field's typed text module, committed when the dialog opens, on Enter and on blur. Typed by
   * what this class calls, so a field keeps the module of its own value and text.
   */
  protected abstract readonly typedText: Pick<ɵUiTypedText<unknown, unknown, unknown>, 'commit'>;

  abstract readonly labelStrategy: 'for' | 'labelledby';
  abstract readonly controlId: Signal<string>;
  abstract focus(options?: FocusOptions): void;

  /** Return `false` for days that cannot be picked or typed. */
  readonly dateFilter = input<UiDateFilter | null>(null);
  /** Month shown when the calendar opens without a value. Defaults to today. */
  readonly startAt = input<Date | null | undefined>(null);
  /** Defaults to the expected format, e.g. "DD.MM.YYYY". */
  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  /** Host id; the field derives the ids of its text fields from it. */
  readonly id = input(inject(_IdGenerator).getId(`${this.classPrefix()}-`));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly opened = output();
  readonly closed = output();

  protected readonly toggleElement = viewChild.required<string, ElementRef<HTMLButtonElement>>(
    'toggleButton',
    { read: ElementRef },
  );
  private readonly calendar = viewChild(UiCalendar);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly isOpen = signal(false);
  protected readonly positions = [...UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK];
  protected readonly calendarIcon = uiIconCalendar;

  /** The calendar dialog, named by `aria-controls` of the button while it is open. */
  protected readonly panelId = computed(() => `${this.id()}-panel`);

  protected readonly locale = computed(() => this.labels().locale);
  protected readonly hint = computed(() => formatHint(this.locale()));
  /** Numeric keypad with a dot on phones, when the locale separates the date with dots. */
  protected readonly inputMode = computed(() =>
    datePattern(this.locale()).separator === '.' ? 'decimal' : null,
  );

  /** The block, size, disabled, readonly and invalid classes; a field binds its own next to them. */
  protected readonly hostClasses = computed(() => {
    const prefix = this.classPrefix();
    return {
      [prefix]: true,
      [`${prefix}--${this.size()}`]: true,
      [`${prefix}--disabled`]: this.isDisabled(),
      [`${prefix}--readonly`]: this.readonly(),
      [`${prefix}--invalid`]: this.showError(),
    };
  });

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
    // The user has dealt with the field, even when nothing was picked.
    this.notifyTouched();
  }

  protected toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  /** Focuses the active day once the dialog has rendered. */
  protected onAttach(): void {
    afterNextRender(
      { write: () => this.calendar()?.focusActiveCell() },
      { injector: this.injector },
    );
  }

  /** Alt+ArrowDown opens the dialog; Enter commits the typed text. */
  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault();
      this.open();
    } else if (event.key === 'Enter') {
      this.typedText.commit();
    }
  }

  /** Shows valid typed text in the locale format; keeps invalid text for the user to fix. */
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

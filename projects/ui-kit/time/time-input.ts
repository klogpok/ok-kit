import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  UI_LABELS,
  type ɵUiTypedTextParse,
  ɵUiDropdownPanel,
  ɵinjectTypedText,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconClock } from '@vplans/ui-kit/icon';
import {
  ɵUiComboboxControl,
  ɵUiListbox,
  ɵUiPopupListboxField,
  ɵinjectListbox,
  ɵprovideUiPopupListboxField,
} from '@vplans/ui-kit/listbox';
import {
  formatTime,
  maskTime,
  parseTime,
  timeFormat,
  timeHint,
  timeSlots,
  toMinutes,
  uiTimeOf,
} from './time-utils';

/**
 * Time field (WAI-ARIA editable combobox): type a time or pick one from a list of times every
 * `interval` minutes.
 *
 * - The value is a 24-hour `"HH:mm"` string or `null`. It is shown in the format of the `locale`
 *   label: "14:30" in 24-hour locales such as `he-IL` (the default), "2:30 PM" in 12-hour ones.
 * - Typing keeps only the characters of a time and adds the ":" ("1430" → "14:30"). It also
 *   reads "930", "9", "2:30 pm". Text that is not a time, or a time outside
 *   `minTime`/`maxTime`, sets the value to `null`; once the user leaves the field it shows
 *   `labels().invalidTime`. The message is the field's own: it never becomes an error of a bound
 *   form control.
 * - Without a `placeholder` the field shows the expected format, e.g. "HH:MM".
 * - A click or ArrowDown/ArrowUp opens the list at the selected time, or the nearest one;
 *   Alt+ArrowDown opens it without moving. Enter picks the active time, Escape closes the list.
 *
 * Join the value with a date with `uiDateWithTime()`. Implements `ControlValueAccessor`, so it
 * binds with `[formControl]`, `formControlName` and `[(ngModel)]`.
 *
 * @example
 * <ui-form-field label="Meeting">
 *   <ui-time-input [formControl]="start" minTime="08:00" maxTime="18:00" interval="15" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-time-input',
  imports: [CdkOverlayOrigin, UiIcon, ɵUiComboboxControl, ɵUiDropdownPanel, ɵUiListbox],
  template: `
    <!-- A click anywhere in the field opens the list; the keyboard uses the arrows. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <div
      class="ui-time-input__field"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      (click)="onFieldClick()"
    >
      <!-- uiComboboxControl sets the id, label and dynamic combobox ARIA. -->
      <!-- Its bindings replace the static aria-expanded and aria-controls, which the lint wants. -->
      <input
        #control
        uiComboboxControl
        type="text"
        role="combobox"
        aria-expanded="false"
        aria-controls=""
        class="ui-time-input__input"
        autocomplete="off"
        aria-haspopup="listbox"
        dir="ltr"
        [attr.inputmode]="format().hour12 ? null : 'numeric'"
        [attr.maxlength]="format().hour12 ? null : 5"
        [value]="text()"
        [placeholder]="placeholder() || hint()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (blur)="onBlur()"
      />
      <ui-icon
        class="ui-time-input__icon"
        [icon]="clockIcon"
        [size]="size() === 'lg' ? 'md' : 'sm'"
      />
    </div>

    <!-- Focus stays in the field, so the panel returns it nowhere. -->
    <ng-template [uiDropdownPanel]="origin" [open]="listbox.shown()" (closed)="listbox.close()">
      <ui-listbox [size]="size()" />
    </ng-template>
  `,
  styleUrl: './time-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ɵprovideUiPopupListboxField(() => UiTimeInput),
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTimeInput), multi: true },
  ],
  host: { class: 'ui-time-input' },
})
export class UiTimeInput extends ɵUiPopupListboxField<string | null> {
  protected readonly labels = inject(UI_LABELS);

  readonly value = model<string | null>(null);
  /** Earliest time ("HH:mm") that can be picked or typed. */
  readonly minTime = input<string | null>(null);
  /** Latest time ("HH:mm") that can be picked or typed. */
  readonly maxTime = input<string | null>(null);
  /** Minutes between the times in the list, counted from midnight. */
  readonly interval = input(30, {
    transform: (value: unknown) => Math.max(1, numberAttribute(value, 30)),
  });

  protected readonly clockIcon = uiIconClock;

  /** The text field gets `${id}-input`. */
  protected override readonly controlIdSuffix = 'input';

  protected readonly format = computed(() => timeFormat(this.labels().locale));
  protected readonly hint = computed(() => timeHint(this.format()));

  private readonly limits = computed(() => ({
    min: toMinutes(this.minTime()),
    max: toMinutes(this.maxTime()),
  }));

  /** Times of the list and their text in the locale format. */
  private readonly slots = computed(() => {
    const { min, max } = this.limits();
    return timeSlots(this.interval(), min, max).map((value) => ({
      value,
      label: formatTime(value, this.format()),
    }));
  });

  /** The value when it is an "HH:mm" time; anything else is shown empty. */
  private readonly time = computed(() => readableTime(this.value()));

  /** The typed text and its commit; the rules below are read when it is used, not now. */
  private readonly typedText = ɵinjectTypedText<string, string, 'invalid'>({
    value: this.value,
    notify: (value) => this.notifyChange(value),
    parse: (text) => this.parse(text),
    format: (value) => this.display(value),
    valid: readableTime,
    equals: (a, b) => a === b,
  });

  /** The typed text while it belongs to the current value, otherwise the formatted value. */
  protected readonly text = computed(() => this.typedText.text());

  /** The list of times. Typed text is a value too: Enter without an active time commits it. */
  protected readonly listbox = ɵinjectListbox<string>({
    ...this.fieldListboxConfig(),
    mode: () => 'freeText',
    id: this.id,
    items: this.slots,
    // Every slot stays rendered (1440 at an interval of 1), so the list opens scrolled to the
    // nearest slot and keeps its layout.
    virtualThreshold: () => Infinity,
    // The selected time, or the time now; the nearest slot at or after it.
    openAt: () => this.nearestSlot(this.time() ?? uiTimeOf(new Date())),
    isSelected: (value) => value === this.time(),
    select: (value) => this.pick(value as string),
  });

  /**
   * The field shows the parse message itself, bound or not: a text the user still has to fix is
   * not a validation failure of the consumer's control, which only ever sees `null`.
   */
  protected override ownErrors(): readonly string[] {
    return this.typedText.error() === 'invalid' ? [this.labels().invalidTime] : [];
  }

  writeValue(value: string | null | undefined): void {
    this.typedText.write(value);
  }

  protected classPrefix(): string {
    return 'ui-time-input';
  }

  protected onFieldClick(): void {
    if (this.isDisabled()) return;
    this.focus();
    this.open();
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let text = input.value;
    // The mask only acts on text typed at the end, so it does not move the caret.
    if (
      // Plain `input` events (e.g. from tests) have no `inputType`.
      ((event as Partial<InputEvent>).inputType ?? '').startsWith('insert') &&
      input.selectionEnd === text.length
    ) {
      text = maskTime(text, this.format());
      if (text !== input.value) input.value = text;
    }
    this.typedText.input(text);
    this.open();
    // The typed time is now the value, so it is the time to activate (`null` for other text).
    const value = this.time();
    if (value !== null) this.listbox.activateValue(this.nearestSlot(value));
  }

  protected onKeydown(event: KeyboardEvent): void {
    // The listbox leaves Enter without an active time to the field: it commits the typed text.
    if (!this.listbox.handleKeydown(event) && event.key === 'Enter') this.typedText.commit();
  }

  /**
   * Commits the typed text between closing and the touched step, as before the base class: a
   * `touch` handler already sees the parse error. `super.onBlur()` closes and marks touched in one
   * step, so it cannot be used here.
   */
  protected override onBlur(): void {
    this.close();
    this.typedText.commit();
    this.notifyTouched();
  }

  /** The slot at `time`, or the first later one (the last one after all); `null` without slots. */
  private nearestSlot(time: string): string | null {
    const minutes = toMinutes(time) ?? 0;
    const slots = this.slots();
    const later = slots.find((slot) => (toMinutes(slot.value) ?? 0) >= minutes);
    return (later ?? slots.at(-1))?.value ?? null;
  }

  private pick(value: string): void {
    // The listbox does not select while the field is readonly or disabled.
    // Drops typed text and its message, also when the same time is picked again.
    this.typedText.set(value);
    this.close();
  }

  /** A typed time inside the limits; other non-blank text is the error `'invalid'`. */
  private parse(text: string): ɵUiTypedTextParse<string, 'invalid'> {
    if (!text.trim()) return { value: null, error: null };
    const time = parseTime(text, this.format());
    const minutes = toMinutes(time);
    const { min, max } = this.limits();
    const allowed =
      time !== null &&
      minutes !== null &&
      !(min !== null && minutes < min) &&
      !(max !== null && minutes > max);
    return allowed ? { value: time, error: null } : { value: null, error: 'invalid' };
  }

  private display(value: string | null): string {
    return value === null ? '' : formatTime(value, this.format());
  }
}

/** The time when it is an "HH:mm" string, otherwise `null`. */
function readableTime(value: unknown): string | null {
  return typeof value === 'string' && toMinutes(value) !== null ? value : null;
}

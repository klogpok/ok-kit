import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  ɵUiDropdownPanel,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconClock } from '@vplans/ui-kit/icon';
import {
  ɵUI_POPUP_LISTBOX_FIELD,
  ɵUiComboboxControl,
  ɵUiListbox,
  ɵfieldListboxConfig,
  ɵinjectListbox,
  ɵprovideUiListbox,
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

/** Text the user is typing and the value it produced. */
interface Draft {
  text: string;
  value: string | null;
  /** The user left the field or pressed Enter: an invalid text is now an error. */
  committed: boolean;
}

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
      <!-- eslint-disable @angular-eslint/template/role-has-required-aria -->
      <input
        #control
        uiComboboxControl
        type="text"
        role="combobox"
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
      <!-- eslint-enable @angular-eslint/template/role-has-required-aria -->
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
    { provide: ɵUI_POPUP_LISTBOX_FIELD, useExisting: forwardRef(() => UiTimeInput) },
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiTimeInput) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTimeInput), multi: true },
    ɵprovideUiListbox(),
  ],
  host: {
    class: 'ui-time-input',
    '[class]': '"ui-time-input--" + size()',
    '[class.ui-time-input--disabled]': 'isDisabled()',
    '[class.ui-time-input--readonly]': 'readonly()',
    '[class.ui-time-input--invalid]': 'showError()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiTimeInput extends UiFormControlBase<string | null> implements UiFormFieldControl {
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
  /** Defaults to the expected format, e.g. "HH:MM". */
  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /** Host id; the text field gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-time-input-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly opened = output();
  readonly closed = output();

  private readonly control = viewChild.required<ElementRef<HTMLInputElement>>('control');

  protected readonly clockIcon = uiIconClock;

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);

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
  private readonly time = computed(() => {
    const value = this.value();
    return toMinutes(value) === null ? null : value;
  });

  /** Dropped when the value changes elsewhere, so old text does not come back. */
  private readonly draft = linkedSignal<string | null, Draft | null>({
    source: () => this.time(),
    computation: (value, previous) => {
      const draft = previous?.value;
      return draft?.value === value ? draft : null;
    },
  });

  /** The typed text while it belongs to the current value, otherwise the formatted value. */
  protected readonly text = computed(() => this.draft()?.text ?? this.display(this.time()));

  /** Committed text that is not an allowed time. */
  private readonly parseError = computed(() => {
    const draft = this.draft();
    return !!draft?.committed && draft.text.trim() !== '' && draft.value === null;
  });

  /** The list of times. Typed text is a value too: Enter without an active time commits it. */
  protected readonly listbox = ɵinjectListbox<string>({
    ...ɵfieldListboxConfig(this),
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
    return this.parseError() ? [this.labels().invalidTime] : [];
  }

  writeValue(value: string | null | undefined): void {
    this.draft.set(null);
    this.value.set(toMinutes(value) === null ? null : value!);
  }

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  /** Opens the list at the selected time, or the one nearest to now. */
  open(): void {
    this.listbox.open();
  }

  close(): void {
    this.listbox.close();
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
    const before = this.value();
    const value = this.parse(text);
    // Against the shown time: a value that is not a time already shows empty, so it stays.
    if (value !== this.time()) this.value.set(value);
    this.draft.set({ text, value, committed: false });
    if (this.value() !== before) this.notifyChange(value);
    this.open();
    if (value !== null) this.listbox.activateValue(this.nearestSlot(value));
  }

  protected onKeydown(event: KeyboardEvent): void {
    // The listbox leaves Enter without an active time to the field: it commits the typed text.
    if (!this.listbox.handleKeydown(event) && event.key === 'Enter') this.commitDraft();
  }

  protected onBlur(): void {
    this.close();
    this.commitDraft();
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
    this.draft.set(null);
    if (value !== this.time()) {
      this.value.set(value);
      this.notifyChange(value);
    }
    this.close();
  }

  /** A typed time inside the limits, or `null`. */
  private parse(text: string): string | null {
    const time = text.trim() ? parseTime(text, this.format()) : null;
    const minutes = toMinutes(time);
    if (time === null || minutes === null) return null;
    const { min, max } = this.limits();
    return (min !== null && minutes < min) || (max !== null && minutes > max) ? null : time;
  }

  private display(value: string | null): string {
    return value === null || toMinutes(value) === null ? '' : formatTime(value, this.format());
  }

  /** Shows a valid typed time in the locale format; keeps invalid text for the user to fix. */
  private commitDraft(): void {
    const draft = this.draft();
    if (!draft) return;
    this.draft.set(draft.value ? null : { ...draft, committed: true });
  }
}

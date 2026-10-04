import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ActiveDescendantKeyManager, _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  resolveDirection,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconClock } from '@vplans/ui-kit/icon';
import { UiOption, ɵUiOptionParent } from '@vplans/ui-kit/select';
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

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

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
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, UiIcon, UiOption],
  template: `
    <!-- A click anywhere in the field opens the list; the keyboard uses the arrows. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <div
      class="ui-time-input__field"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      (click)="onFieldClick()"
    >
      <input
        #control
        type="text"
        role="combobox"
        class="ui-time-input__input"
        autocomplete="off"
        aria-haspopup="listbox"
        dir="ltr"
        [attr.inputmode]="format().hour12 ? null : 'numeric'"
        [attr.maxlength]="format().hour12 ? null : 5"
        [id]="controlId()"
        [value]="text()"
        [placeholder]="placeholder() || hint()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="isOpen() ? listId() : null"
        [attr.aria-activedescendant]="isOpen() ? activeId() : null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [attr.aria-invalid]="showError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
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

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayMinWidth]="panelWidth()"
      (attach)="onAttach()"
      (detach)="close()"
      (overlayOutsideClick)="onOutsideClick($event)"
    >
      <!-- Options keep focus in the field: mousedown must not move it. -->
      <div
        role="listbox"
        class="ui-select__panel ui-time-input__panel"
        [style.--_option-padding]="'var(--ui-control-padding-inline-' + size() + ')'"
        [style.--_option-font-size]="'var(--ui-control-font-size-' + size() + ')'"
        [id]="listId()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="listLabelledBy()"
        (mousedown)="$event.preventDefault()"
      >
        @for (slot of slots(); track slot.value) {
          <ui-option [value]="slot.value">{{ slot.label }}</ui-option>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './time-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiTimeInput) },
    ɵUiOptionParent,
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

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
  private readonly overlay = viewChild(CdkConnectedOverlay);
  private readonly options = viewChildren<UiOption<string>>(UiOption);

  protected readonly isOpen = signal(false);
  protected readonly activeId = signal<string | null>(null);
  protected readonly panelWidth = signal(0);
  protected readonly positions = POSITIONS;
  protected readonly clockIcon = uiIconClock;

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);
  protected readonly listId = computed(() => `${this.id()}-listbox`);
  protected readonly listLabelledBy = computed(() =>
    this.ariaLabel() ? null : (this.formField?.labelledBy() ?? null),
  );

  protected readonly format = computed(() => timeFormat(this.labels().locale));
  protected readonly hint = computed(() => timeHint(this.format()));

  private readonly limits = computed(() => ({
    min: toMinutes(this.minTime()),
    max: toMinutes(this.maxTime()),
  }));

  /** Times of the list and their text in the locale format. */
  protected readonly slots = computed(() => {
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

  private readonly keyManager = new ActiveDescendantKeyManager<UiOption<string>>(
    this.options,
    this.injector,
  )
    .withVerticalOrientation()
    .withPageUpDown();

  constructor() {
    super();
    inject(ɵUiOptionParent).connect({
      multiple: () => false,
      isSelected: (value) => value === this.time(),
      isIndeterminate: () => false,
      isFilteredOut: () => false,
      isBlocked: () => false,
      selectOption: (value) => this.pick(value as string),
    });
    this.keyManager.change.subscribe(() =>
      this.activeId.set(this.keyManager.activeItem?.id ?? null),
    );
    // A list opened before the field became readonly or disabled must not stay open.
    effect(() => {
      if (this.readonly() || this.isDisabled()) untracked(() => this.close());
    });
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
  }

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

  open(): void {
    if (this.isOpen() || this.isDisabled() || this.readonly()) return;
    this.panelWidth.set(this.host.getBoundingClientRect().width);
    this.isOpen.set(true);
    this.opened.emit();
    afterNextRender(
      () => {
        // Keys pressed before the list rendered have already moved the active time.
        if (!this.keyManager.activeItem) this.activateNear(this.time() ?? uiTimeOf(new Date()));
      },
      { injector: this.injector },
    );
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.keyManager.setActiveItem(-1);
    this.activeId.set(null);
    this.closed.emit();
  }

  protected onAttach(): void {
    // The CDK reads the direction once; follow runtime `dir` changes.
    this.overlay()?.overlayRef.setDirection(resolveDirection(this.host));
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.contains(event.target as Node)) this.close();
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
    if (value !== null) this.activateNear(value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const { key } = event;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.open();
        return;
      }
      if (key === 'ArrowUp' && event.altKey) this.close();
      else this.keyManager.onKeydown(event);
    } else if ((key === 'PageDown' || key === 'PageUp') && this.isOpen()) {
      this.keyManager.onKeydown(event);
    } else if (key === 'Enter') {
      const active = this.isOpen() ? this.keyManager.activeItem : null;
      if (active) {
        event.preventDefault();
        this.pick(active.value());
      } else {
        this.commitDraft();
      }
    } else if (key === 'Escape' && this.isOpen()) {
      // Close only the list, not a surrounding dialog.
      event.preventDefault();
      event.stopPropagation();
      this.close();
    } else if (key === 'Tab') {
      this.close();
    }
  }

  protected onBlur(): void {
    this.close();
    this.commitDraft();
    this.notifyTouched();
  }

  /** Moves the active option to `time`, or the first later time (the last one after all). */
  private activateNear(time: string): void {
    const minutes = toMinutes(time) ?? 0;
    const slots = this.slots();
    const index = slots.findIndex((slot) => (toMinutes(slot.value) ?? 0) >= minutes);
    const target = index >= 0 ? index : slots.length - 1;
    if (target >= 0) this.keyManager.setActiveItem(target);
  }

  private pick(value: string): void {
    if (this.readonly() || this.isDisabled()) return;
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

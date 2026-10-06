import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LiveAnnouncer, _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  resolveDirection,
} from '@vplans/ui-kit/core';
import { UiChip, UiChipSet, UiChipSetFallback } from './chip';

/**
 * Text field that turns what the user types into chips: a list of tags, e-mails or codes.
 *
 * - Enter or a separator (default ",") adds the text as a chip; pasted text is split at the
 *   separators and line breaks. Leaving the field adds the text too (`addOnBlur`).
 * - Backspace in the empty field removes the last chip. ArrowLeft in LTR (ArrowRight in RTL) at
 *   the start of the field moves to the chips; the arrow keys move between them, Delete removes
 *   one, and the other arrow key at the last chip returns to the field.
 * - The same text is not added twice (ignoring case) unless `allowDuplicates` is set.
 *
 * The value is a new `string[]` on every change. Implements `FormValueControl` (Signal Forms)
 * and `ControlValueAccessor`. For a required field with Signal Forms, add `minLength(path, 1)`:
 * `required()` does not treat an empty array as empty.
 *
 * @example
 * <ui-form-field label="Tags" hint="Press Enter after each tag">
 *   <ui-chip-input [formField]="form.tags" placeholder="Add a tag" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-chip-input',
  imports: [UiChip, UiChipSet],
  template: `
    <!-- A click on the field outside the chips focuses the text field, like a native input. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <div class="ui-chip-input__field" (click)="onFieldClick($event)">
      @if (value().length) {
        <ui-chip-set
          class="ui-chip-input__chips"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-labelledby]="ariaLabel() ? null : (formField?.labelledBy() ?? null)"
        >
          @for (chip of value(); track $index) {
            <ui-chip
              [removable]="editable()"
              [disabled]="isDisabled()"
              (removed)="removeAt($index)"
            >
              {{ chip }}
            </ui-chip>
          }
        </ui-chip-set>
      }
      <input
        #input
        type="text"
        class="ui-chip-input__input"
        autocomplete="off"
        [id]="controlId()"
        [value]="text()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [attr.aria-invalid]="showError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (input)="text.set($any($event.target).value)"
        (keydown)="onKeydown($event)"
        (paste)="onPaste($event)"
      />
    </div>
  `,
  styleUrl: './chip-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiChipInput) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiChipInput), multi: true },
    UiChipSetFallback,
  ],
  host: {
    class: 'ui-chip-input',
    '[class.ui-chip-input--disabled]': 'isDisabled()',
    '[class.ui-chip-input--readonly]': 'readonly()',
    '[class.ui-chip-input--invalid]': 'showError()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiChipInput
  extends UiFormControlBase<readonly string[]>
  implements UiFormFieldControl
{
  protected readonly labels = inject(UI_LABELS);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  readonly value = model<readonly string[]>([]);
  /** Keys besides Enter that add the typed text, and the separators of pasted text. */
  readonly separators = input<readonly string[]>([',']);
  /** Adds the typed text when focus leaves the field. */
  readonly addOnBlur = input(true, { transform: booleanAttribute });
  /** Allows the same text twice. */
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly name = input('');
  /** Host id; the text field gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-chip-input-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly chipSet = viewChild(UiChipSet);

  /** The text being typed, before it becomes a chip. */
  protected readonly text = signal('');
  protected readonly editable = computed(() => !this.isDisabled() && !this.readonly());

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);

  constructor() {
    super();
    inject(UiChipSetFallback).focus = () => this.focus();
  }

  writeValue(value: readonly string[] | null | undefined): void {
    this.value.set(value ?? []);
  }

  focus(options?: FocusOptions): void {
    this.input().nativeElement.focus(options);
  }

  /** Adds chips for the given texts (trimmed, skipping empty and duplicate ones). */
  add(...texts: string[]): void {
    const next = [...this.value()];
    for (const raw of texts) {
      const text = raw.trim();
      const known = next.some((chip) => chip.toLocaleLowerCase() === text.toLocaleLowerCase());
      if (text && (this.allowDuplicates() || !known)) next.push(text);
    }
    if (next.length !== this.value().length) this.setValue(next);
  }

  /** Removes the chip at `index`. */
  removeAt(index: number): void {
    const current = this.value();
    if (index < 0 || index >= current.length || !this.editable()) return;
    const chips = this.host.querySelector('.ui-chip-input__chips');
    const focusInChips = !!chips?.contains(this.host.ownerDocument.activeElement);
    this.setValue(current.filter((_, i) => i !== index));
    // The chip list goes away with its last chip; keep focus in the field.
    if (focusInChips && current.length === 1) {
      afterNextRender(() => this.focus(), { injector: this.injector });
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const field = event.target as HTMLInputElement;
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0;
    const startKey = resolveDirection(this.host) === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'Enter' || this.separators().includes(event.key)) {
      // Enter with empty text submits the form as usual.
      if (!this.text().trim() && event.key === 'Enter') return;
      event.preventDefault();
      this.commitText();
    } else if (event.key === 'Backspace' && !field.value && this.editable()) {
      const last = this.value().at(-1);
      if (last === undefined) return;
      event.preventDefault();
      this.removeAt(this.value().length - 1);
      void this.announcer.announce(this.labels().chipRemoved(last), 'polite');
    } else if (event.key === startKey && atStart && this.chipSet()?.focusLast()) {
      event.preventDefault();
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const parts = this.split(pasted);
    if (parts.length < 2 || this.readonly()) return;
    event.preventDefault();
    this.add(...parts);
  }

  protected onFieldClick(event: MouseEvent): void {
    if (!(event.target as Element).closest('.ui-chip')) this.focus();
  }

  /** Touched (and the typed text added) once focus leaves the chips and the field. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.host.contains(next)) return;
    if (this.addOnBlur() && !this.readonly()) this.commitText();
    this.notifyTouched();
  }

  private commitText(): void {
    const parts = this.split(this.text());
    this.text.set('');
    this.input().nativeElement.value = '';
    this.add(...parts);
  }

  private split(text: string): string[] {
    let parts = [text];
    for (const separator of [...this.separators(), '\n']) {
      parts = parts.flatMap((part) => part.split(separator));
    }
    return parts.map((part) => part.trim()).filter(Boolean);
  }

  private setValue(value: readonly string[]): void {
    this.value.set(value);
    this.notifyChange(value);
  }
}

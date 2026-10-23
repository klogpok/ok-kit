import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ɵUiDropdownPanel as UiDropdownPanel } from '@vplans/ui-kit/core';
import {
  UiOption,
  type ɵUiListboxController as UiListboxController,
  type UiOptionItem,
  ɵUiComboboxControl as UiComboboxControl,
  ɵUiListbox as UiListbox,
  ɵUiPopupListboxField as UiPopupListboxField,
  ɵinjectListbox as injectListbox,
  ɵprovideUiPopupListboxField as provideUiPopupListboxField,
} from '@vplans/ui-kit/listbox';
import { UiSpinner } from '@vplans/ui-kit/spinner';

/**
 * Text field with suggestions (WAI-ARIA combobox with list autocomplete). The suggestions are
 * `ui-option`s; focus stays in the field and the active option is exposed with
 * `aria-activedescendant`.
 *
 * - **Free text** (default): the value is the text in the field. Picking a suggestion sets the
 *   value to that option's value, a string.
 * - **Pick one** (`displayWith` set): the value is the picked option value, e.g. an object, or
 *   `null`. Typing only searches; text that was not turned into a pick is cleared when the
 *   field loses focus.
 *
 * Typing opens the list and filters the options by label; set `filterOptions="false"` and load
 * the options from `(searchChange)` for server-side search, with `loading` meanwhile.
 * ArrowDown/ArrowUp open the list and move (Alt+ArrowDown opens it without moving), Enter picks
 * the active option, Escape closes the list or clears the field, Tab closes the list.
 *
 * Implements `ControlValueAccessor`: bind it with `formControl`, `formControlName` or `ngModel`.
 *
 * @example
 * <ui-form-field label="City">
 *   <ui-autocomplete formControlName="city">
 *     @for (city of cities; track city) { <ui-option [value]="city">{{ city }}</ui-option> }
 *   </ui-autocomplete>
 * </ui-form-field>
 *
 * @example
 * <ui-autocomplete [(value)]="owner" [displayWith]="nameOf" [filterOptions]="false"
 *                  [loading]="searching()" (searchChange)="search($event)">
 *   @for (user of results(); track user.id) { <ui-option [value]="user">{{ user.name }}</ui-option> }
 * </ui-autocomplete>
 */
@Component({
  selector: 'ui-autocomplete',
  imports: [CdkOverlayOrigin, UiComboboxControl, UiDropdownPanel, UiListbox, UiSpinner],
  template: `
    <div class="ui-autocomplete__field" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <!-- uiComboboxControl sets the id, label and dynamic combobox ARIA. -->
      <!-- eslint-disable @angular-eslint/template/role-has-required-aria -->
      <input
        #control
        uiComboboxControl
        type="text"
        role="combobox"
        class="ui-autocomplete__input"
        autocomplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        [value]="text()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (click)="open()"
        (blur)="onBlur()"
      />
      <!-- eslint-enable @angular-eslint/template/role-has-required-aria -->
      @if (loading()) {
        <ui-spinner class="ui-autocomplete__spinner" size="sm" decorative />
      }
    </div>

    <ng-template [uiDropdownPanel]="origin" [open]="listbox.shown()" (closed)="close()">
      <ui-listbox [size]="size()">
        <ng-content />
      </ui-listbox>
    </ng-template>
  `,
  styleUrl: './autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideUiPopupListboxField(() => UiAutocomplete),
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiAutocomplete), multi: true },
  ],
  host: { class: 'ui-autocomplete' },
})
export class UiAutocomplete<T = string> extends UiPopupListboxField<T | string | null> {
  readonly value = model<T | string | null>(null);

  /**
   * Options are loading (e.g. server-side search): a spinner is shown and the list is marked
   * busy.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Hide options whose label does not contain the text. Turn off for server-side search. */
  readonly filterOptions = input(true, { transform: booleanAttribute });
  /**
   * Compares an option value with the value, e.g. by id for objects. Called as
   * `compareWith(option, selected)` and never with `null`.
   */
  readonly compareWith = input<(option: T, selected: T) => boolean>(Object.is);
  /**
   * Text of a picked value; setting it makes the field pick-only. Also the label of a value that
   * is not among the options.
   */
  readonly displayWith = input<((value: T) => string) | null>(null);
  /**
   * The options as data, instead of projected `ui-option`s. Projected options are ignored while
   * it is set (`[]` is an empty list).
   */
  readonly items = input<readonly UiOptionItem<T>[] | null>(null);
  /**
   * From this many `items` on, the list renders only the options in view (a virtual scroll
   * viewport). The options must then all have the same height.
   */
  readonly virtualThreshold = input(100, { transform: numberAttribute });

  /** Emits the text as the user types, e.g. to load options from a server. */
  readonly searchChange = output<string>();

  /** The projected options. */
  private readonly contentOptions = contentChildren<UiOption<T>>(UiOption, { descendants: true });

  /** Text typed since the last pick; it filters the options. */
  private readonly query = signal('');
  /** A value must be picked from the options: `displayWith` is set. */
  private readonly pickOnly = computed(() => this.displayWith() !== null);

  /**
   * The suggestions. The list shows while it has options, a message after a search in a
   * pick-only field, or a spinner; no option is active until the user moves to one.
   */
  protected readonly listbox: UiListboxController<T> = injectListbox<T>({
    ...this.fieldListboxConfig(),
    mode: () => 'freeText',
    id: this.id,
    contentOptions: this.contentOptions,
    items: this.items,
    filterText: this.query,
    filterOptions: this.filterOptions,
    compareWith: this.compareWith,
    displayWith: this.displayWith,
    virtualThreshold: this.virtualThreshold,
    loading: this.loading,
    showEmpty: () => this.pickOnly() && this.query().trim() !== '',
    activateOnOpen: () => false,
    isSelected: (value) => this.listbox.matches(value, this.value()),
    select: (value) => this.pick(value as T),
  });

  /** The text in the field. Follows the value, and holds the typed text in between. */
  protected readonly text = linkedSignal(() => this.displayText(this.value()));

  protected classPrefix(): string {
    return 'ui-autocomplete';
  }

  writeValue(value: T | string | null | undefined): void {
    this.query.set('');
    this.value.set(value ?? null);
  }

  private pick(value: T): void {
    this.query.set('');
    this.setValue(value);
    this.text.set(this.displayText(value));
    this.close();
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.searchChange.emit(text);
    if (!this.pickOnly()) this.setValue(text);
    else if (this.value() !== null) this.setValue(null);
    // After the value changed, so the typed text wins over the text of the value.
    this.text.set(text);
    this.listbox.open();
    this.listbox.clearActive();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.listbox.handleKeydown(event)) return;
    // Escape on a hidden list empties the field.
    if (event.key === 'Escape' && this.text() && !this.readonly()) {
      event.preventDefault();
      event.stopPropagation();
      this.clear();
    }
  }

  protected override onBlur(): void {
    // Closes the list and marks the control touched. The text and query below emit nothing, so
    // resetting them after the touched step keeps the order of `closed` and `touch` unchanged.
    super.onBlur();
    // A pick-only field keeps no text that did not become a value.
    if (this.pickOnly()) this.text.set(this.displayText(this.value()));
    this.query.set('');
  }

  /** Empties the field and the value. */
  private clear(): void {
    this.query.set('');
    this.searchChange.emit('');
    this.setValue(this.pickOnly() ? null : '');
    this.text.set('');
  }

  private displayText(value: T | string | null): string {
    if (value == null) return '';
    const displayWith = this.displayWith();
    if (displayWith) return displayWith(value as T);
    return typeof value === 'string' ? value : this.listbox.labelFor(value);
  }

  private setValue(value: T | string | null): void {
    if (value === this.value()) return;
    this.value.set(value);
    this.notifyChange(value);
  }
}

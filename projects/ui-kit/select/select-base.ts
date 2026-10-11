import {
  Directive,
  ElementRef,
  Signal,
  WritableSignal,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { UI_LABELS, UiFormControlBase, UiFormFieldControl, UiSize } from '@vplans/ui-kit/core';
import { UiChip } from '@vplans/ui-kit/chip';
import { uiIconChevronDown, uiIconX } from '@vplans/ui-kit/icon';
import {
  UiOption,
  type UiOptionItem,
  type ɵUiListbox as UiListbox,
  type ɵUiListboxConfig as UiListboxConfig,
} from '@vplans/ui-kit/listbox';

/**
 * Shared trigger of `ui-select` and `ui-multi-select`: the combobox button or search field,
 * the chips, the clear button and the inputs of the list. The popup listbox is a controller
 * that each subclass creates with `injectListbox({ ...this.listboxConfig(), ... })`, adding what
 * selecting an option does. Internal.
 */
@Directive({
  host: {
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
    '[class]': '"ui-select--" + size()',
    '[class.ui-select--open]': 'listbox.isOpen()',
    '[class.ui-select--disabled]': 'isDisabled()',
    '[class.ui-select--readonly]': 'readonly()',
    '[class.ui-select--invalid]': 'showError()',
    '[class.ui-select--clearable]': 'showClear()',
    '[class.ui-select--chips]': 'chipList().length > 0',
  },
})
export abstract class UiSelectBase<T, V>
  extends UiFormControlBase<V>
  implements UiFormFieldControl
{
  protected readonly labels = inject(UI_LABELS);

  abstract readonly value: WritableSignal<V>;
  /** The popup listbox; the subclass creates it with `injectListbox()`. */
  protected abstract readonly listbox: UiListbox<T>;

  readonly size = input<UiSize>('md');
  /** Host id; the control gets `${id}-control`. */
  readonly id = input(inject(_IdGenerator).getId('ui-select-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly placeholder = input('');
  /** `name` of the trigger button. The search field of a `searchable` select has none. */
  readonly name = input('');
  /** Type in the trigger to filter the options. */
  readonly searchable = input(false, { transform: booleanAttribute });
  /** Shows a button that clears the value while one is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /**
   * Options are loading (e.g. server-side search): a spinner is shown and the list is marked
   * busy.
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Hide options whose label does not contain the search text. Turn off for server-side search. */
  readonly filterOptions = input(true, { transform: booleanAttribute });
  /**
   * Compares an option value with a selected value, e.g. by id for objects. Called as
   * `compareWith(option, selected)` and never with `null`: a `null` value matches only `null`.
   */
  readonly compareWith = input<(option: T, selected: T) => boolean>(Object.is);
  /**
   * Label of a selected value that is not among the options and was never shown in the list,
   * e.g. an initial value before server-side search results arrive.
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

  readonly opened = output();
  readonly closed = output();
  /**
   * Emits the search text as the user types (`searchable` only), and `''` when the list closes
   * with a search, so server-side results can be reset.
   */
  readonly searchChange = output<string>();

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-control`);

  /** The projected options. */
  private readonly contentOptions = contentChildren<UiOption<T>>(UiOption, { descendants: true });
  /** "Select all" of `ui-multi-select`; the keyboard reaches it before the app's options. */
  private readonly leadingOptions = viewChildren<UiOption<T>>('selectAllOption');
  protected readonly selectAllOption = viewChild<UiOption>('selectAllOption');
  protected readonly control = viewChild.required<ElementRef<HTMLElement>>('control');
  private readonly chipViews = viewChildren(UiChip);

  protected readonly query = signal('');
  protected readonly chevron = uiIconChevronDown;
  protected readonly clearIcon = uiIconX;

  /** Text of the trigger. */
  protected abstract readonly displayLabel: Signal<string>;
  /** Whether a value is selected. */
  protected abstract readonly hasValue: Signal<boolean>;
  /** Selected values shown as chips in the trigger (`ui-multi-select` with `chips`). */
  protected readonly chipList: Signal<readonly { value: unknown; label: string }[]> = computed(
    () => [],
  );
  protected readonly removeChip: (value: unknown) => void = () => undefined;
  /** The "select all" option of `ui-multi-select`. */
  protected readonly showSelectAll: Signal<boolean> = computed(() => false);
  protected readonly selectAllValue: unknown = null;

  protected readonly showClear = computed(
    () => this.clearable() && this.hasValue() && !this.isDisabled() && !this.readonly(),
  );
  protected readonly listLabelledBy = computed(() =>
    this.ariaLabel() ? null : (this.formField?.labelledBy() ?? null),
  );

  /** Sets the empty value (`null` or `[]`) and reports it to the form. */
  protected abstract clearValue(): void;

  constructor() {
    super();
    // The chip buttons are for the mouse; the keyboard deselects in the list.
    effect(() => {
      for (const chip of this.chipViews()) chip.tabIndex.set(-1);
    });
  }

  /** What `ui-select` and `ui-multi-select` give their listbox alike. */
  protected listboxConfig(): Omit<UiListboxConfig<T>, 'isSelected' | 'select'> {
    return {
      mode: () => (this.searchable() ? 'searchable' : 'trigger'),
      id: this.id,
      contentOptions: this.contentOptions,
      leadingOptions: this.leadingOptions,
      items: this.items,
      filterText: () => (this.searchable() ? this.query() : ''),
      filterOptions: this.filterOptions,
      compareWith: this.compareWith,
      displayWith: this.displayWith,
      virtualThreshold: this.virtualThreshold,
      loading: this.loading,
      locked: () => this.readonly() || this.isDisabled(),
      opened: () => this.opened.emit(),
      closed: () => {
        // The search starts over next time; server-side results go back to the full list.
        if (this.query()) {
          this.query.set('');
          this.searchChange.emit('');
        }
        this.closed.emit();
      },
    };
  }

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  /** Opens the list at the selected option, else at the first one. */
  open(): void {
    this.listbox.open();
  }

  close(): void {
    this.listbox.close();
  }

  // --- Template handlers ----------------------------------------------------------------

  protected toggle(event: MouseEvent): void {
    // Clicks in the search text keep the list open; the chevron always toggles it.
    const onChevron = !!(event.target as Element).closest('.ui-select__chevron');
    if (this.listbox.isOpen() && (!this.searchable() || onChevron)) this.close();
    else this.listbox.open({ activate: false });
    this.focus();
  }

  /** The clear button: empties the value and keeps focus on the control. */
  protected onClear(event: MouseEvent): void {
    // The trigger would toggle the list.
    event.stopPropagation();
    if (!this.showClear()) return;
    this.clearValue();
    this.focus();
  }

  /** A click on a chip's x removes it without toggling the list. */
  protected onChipsClick(event: MouseEvent): void {
    if ((event.target as Element).closest('.ui-chip__remove')) event.stopPropagation();
  }

  /** Keeps focus on the control when the chevron or padding of the trigger is pressed. */
  protected onTriggerMousedown(event: MouseEvent): void {
    if (event.target !== this.control().nativeElement) event.preventDefault();
  }

  protected onBlur(): void {
    this.close();
    this.notifyTouched();
  }

  protected onSearch(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.searchChange.emit(text);
    this.listbox.open();
    this.listbox.activateFirst();
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.listbox.handleKeydown(event);
  }
}

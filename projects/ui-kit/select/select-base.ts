import {
  Directive,
  Signal,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { UiChip } from '@vplans/ui-kit/chip';
import { uiIconChevronDown, uiIconX } from '@vplans/ui-kit/icon';
import { UiOption } from './option';
import { UiOptionPanel } from './option-panel';

/** Keys that navigate the list; in `searchable` mode all other keys edit the search text. */
const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

/**
 * Shared behavior of `ui-select` and `ui-multi-select`: the combobox trigger, keyboard handling
 * and search on top of the option panel. Internal.
 *
 * Subclasses declare the `value` model and decide what selecting an option does.
 */
@Directive({
  host: {
    '[class]': '"ui-select--" + size()',
    '[class.ui-select--open]': 'isOpen()',
    '[class.ui-select--disabled]': 'isDisabled()',
    '[class.ui-select--readonly]': 'readonly()',
    '[class.ui-select--invalid]': 'showError()',
    '[class.ui-select--clearable]': 'showClear()',
    '[class.ui-select--chips]': 'chipList().length > 0',
  },
})
export abstract class UiSelectBase<T, V> extends UiOptionPanel<T, V> {
  readonly placeholder = input('');
  /** `name` of the trigger button. The search field of a `searchable` select has none. */
  readonly name = input('');
  /** Type in the trigger to filter the options. */
  readonly searchable = input(false, { transform: booleanAttribute });
  /** Shows a button that clears the value while one is selected. */
  readonly clearable = input(false, { transform: booleanAttribute });

  /**
   * Emits the search text as the user types (`searchable` only), and `''` when the list closes
   * with a search, so server-side results can be reset.
   */
  readonly searchChange = output<string>();

  protected readonly query = signal('');
  protected readonly filterText = computed(() => (this.searchable() ? this.query() : ''));
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
  private readonly chipViews = viewChildren(UiChip);
  protected readonly selectAllOption = viewChild<UiOption>('selectAllOption');

  protected readonly showClear = computed(
    () => this.clearable() && this.hasValue() && !this.isDisabled() && !this.readonly(),
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

  override close(): void {
    if (!this.isOpen()) return;
    if (this.query()) {
      this.query.set('');
      this.searchChange.emit('');
    }
    super.close();
  }

  // --- Template handlers ----------------------------------------------------------------

  protected toggle(event: MouseEvent): void {
    // Clicks in the search text keep the list open; the chevron always toggles it.
    const onChevron = !!(event.target as Element).closest('.ui-select__chevron');
    if (this.isOpen() && (!this.searchable() || onChevron)) this.close();
    else this.openList(false);
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
    this.open();
    this.keyManager.setFirstItemActive();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const { key } = event;
    const searchable = this.searchable();

    if (!this.isOpen()) {
      const opens =
        key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || (key === ' ' && !searchable);
      if (opens) {
        event.preventDefault();
        this.open();
      } else if (key === 'Home' || key === 'End') {
        // APG: open the list at the first or last option.
        event.preventDefault();
        this.open();
        if (key === 'Home') this.keyManager.setFirstItemActive();
        else this.keyManager.setLastItemActive();
      } else if (!searchable && key.length === 1 && !event.ctrlKey && !event.metaKey) {
        // Typeahead on a closed select opens it at the matching option.
        this.open();
        this.keyManager.onKeydown(event);
      }
      return;
    }

    if (key === 'Escape') {
      // Close only the list, not a surrounding dialog.
      event.preventDefault();
      event.stopPropagation();
      this.close();
    } else if (key === 'Enter' || (key === ' ' && !searchable)) {
      // Also stops the button from turning Space into a click.
      event.preventDefault();
      if (key === ' ' && this.keyManager.isTyping()) {
        this.keyManager.onKeydown(event);
        return;
      }
      this.selectActive();
    } else if (key === 'ArrowUp' && event.altKey) {
      event.preventDefault();
      this.close();
    } else if (key === 'Tab') {
      this.close();
    } else if (key === 'ArrowUp' && !this.keyManager.activeItem) {
      // A list opened with a click has no active option; the key manager would not move.
      event.preventDefault();
      this.keyManager.setLastItemActive();
    } else if (!searchable || NAVIGATION_KEYS.has(key)) {
      this.keyManager.onKeydown(event);
    }
  }
}

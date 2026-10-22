import { Directive, computed, inject, input, signal, type WritableSignal } from '@angular/core';
import { Highlightable } from '@angular/cdk/a11y';
import { UiOption, UiOptionHandle } from './option';

/**
 * An option given as data, through `items` of `ui-select`, `ui-multi-select` or
 * `ui-autocomplete`. Long lists of items are rendered in a virtual scroll viewport.
 */
export interface UiOptionItem<T = unknown> {
  readonly value: T;
  /** Shown in the option and the trigger, and used for typeahead and search. */
  readonly label: string;
  /** Second line of the option; not part of the label shown in the trigger. */
  readonly description?: string;
  readonly disabled?: boolean;
}

/** What an item entry needs from the list that owns it. Internal. */
export interface UiItemEntryOwner {
  isFilteredOut(label: string): boolean;
  isBlocked(option: UiOptionHandle): boolean;
  /** The key manager made the entry active: bring it into view. */
  reveal(entry: UiItemEntry): void;
}

/**
 * An item as the key manager sees it. It can be active, disabled or filtered out without being
 * rendered, so the keyboard reaches options outside the virtual scroll window. A new `items`
 * array reuses the entry of an item with the same value and hands it the new item, so the active
 * option and its rendered option stay. Internal.
 */
export class UiItemEntry<T = unknown> implements Highlightable {
  private readonly current: WritableSignal<UiOptionItem<T>>;

  constructor(
    item: UiOptionItem<T>,
    private readonly owner: UiItemEntryOwner,
  ) {
    this.current = signal(item);
  }

  /** The item the entry shows now. */
  get item(): UiOptionItem<T> {
    return this.current();
  }

  /** Internal: a new `items` array has an item with the entry's value. */
  ɵupdate(item: UiOptionItem<T>): void {
    this.current.set(item);
  }

  value(): T {
    return this.item.value;
  }

  getLabel(): string {
    return this.item.label;
  }

  isDisabled(): boolean {
    return this.item.disabled === true;
  }

  /** Internal: the search of the list hides the entry. */
  readonly ɵfilteredOut = computed(() => this.owner.isFilteredOut(this.item.label));

  /** For the CDK key manager: disabled, or blocked by the list (`maxSelections`). */
  get ɵdisabled(): boolean {
    return this.isDisabled() || this.owner.isBlocked(this);
  }

  setActiveStyles(): void {
    this.owner.reveal(this);
  }

  setInactiveStyles(): void {
    // The rendered option reads the active entry from the list.
  }
}

/**
 * Ties a rendered option to the entry of `items` it shows. Values may repeat, so the list finds
 * the option of the active entry through this, not through the value. Internal.
 */
@Directive({ selector: 'ui-option[uiItemEntry]' })
export class UiItemOption<T = unknown> {
  readonly entry = input.required<UiItemEntry<T>>({ alias: 'uiItemEntry' });
  readonly option = inject<UiOption<T>>(UiOption);
}

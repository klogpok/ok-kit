import { Highlightable } from '@angular/cdk/a11y';
import { UiOptionHandle } from './option';

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
  isFilteredOut(label: string, option: UiOptionHandle): boolean;
  isBlocked(option: UiOptionHandle): boolean;
  /** The key manager made the entry active: bring it into view. */
  reveal(entry: UiItemEntry): void;
}

/**
 * An item as the key manager sees it. It can be active, disabled or filtered out without being
 * rendered, so the keyboard reaches options outside the virtual scroll window. Internal.
 */
export class UiItemEntry<T = unknown> implements Highlightable {
  constructor(
    readonly item: UiOptionItem<T>,
    private readonly owner: UiItemEntryOwner,
  ) {}

  value(): T {
    return this.item.value;
  }

  getLabel(): string {
    return this.item.label;
  }

  isDisabled(): boolean {
    return this.item.disabled === true;
  }

  filteredOut(): boolean {
    return this.owner.isFilteredOut(this.item.label, this);
  }

  /** For the CDK key manager: disabled, or blocked by the list (`maxSelections`). */
  get disabled(): boolean {
    return this.isDisabled() || this.owner.isBlocked(this);
  }

  setActiveStyles(): void {
    this.owner.reveal(this);
  }

  setInactiveStyles(): void {
    // The rendered option reads the active entry from the list.
  }
}

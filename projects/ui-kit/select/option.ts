import { Injectable, type Provider } from '@angular/core';
import { ɵUiListboxHost, type ɵUiOptionHandle } from '@vplans/ui-kit/listbox';

/** What an option needs from the list that owns it. */
export interface UiOptionOwner {
  /** Multiple selection: options show a checkbox. */
  multiple(): boolean;
  isSelected(value: unknown): boolean;
  /** Mixed state of the "select all" option. */
  isIndeterminate(option: ɵUiOptionHandle): boolean;
  isFilteredOut(label: string, option: ɵUiOptionHandle): boolean;
  isBlocked(option: ɵUiOptionHandle): boolean;
  /** The option renders an item that the key manager made active (`items` of the list). */
  isActive?(option: ɵUiOptionHandle): boolean;
  selectOption(value: unknown): void;
}

/**
 * Connects options to the field that owns them, for the fields not yet on the listbox
 * controller of `@vplans/ui-kit/listbox`. Provided as `ɵUiListboxHost` with
 * `provideUiOptionParent()`. Internal; goes away once every field uses the controller.
 */
@Injectable()
export class UiOptionParent extends ɵUiListboxHost {
  private owner: UiOptionOwner | null = null;

  connect(owner: UiOptionOwner): void {
    this.owner = owner;
  }

  get multiple(): boolean {
    return this.owner?.multiple() ?? false;
  }

  isSelected(value: unknown): boolean {
    return this.owner?.isSelected(value) ?? false;
  }

  isIndeterminate(option: ɵUiOptionHandle): boolean {
    return this.owner?.isIndeterminate(option) ?? false;
  }

  isFilteredOut(label: string, option: ɵUiOptionHandle): boolean {
    return this.owner?.isFilteredOut(label, option) ?? false;
  }

  isBlocked(option: ɵUiOptionHandle): boolean {
    return this.owner?.isBlocked(option) ?? false;
  }

  isActive(option: ɵUiOptionHandle): boolean {
    return this.owner?.isActive?.(option) ?? false;
  }

  selectOption(value: unknown): void {
    this.owner?.selectOption(value);
  }
}

/** Provides `UiOptionParent`, and it as the token the options inject. */
export function provideUiOptionParent(): Provider[] {
  return [UiOptionParent, { provide: ɵUiListboxHost, useExisting: UiOptionParent }];
}

import { ChangeDetectionStrategy, Component, computed, forwardRef, model } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { UI_FORM_FIELD_CONTROL, ɵUiDropdownPanel as UiDropdownPanel } from '@vplans/ui-kit/core';
import { UiChip } from '@vplans/ui-kit/chip';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import {
  type ɵUiListboxController as UiListboxController,
  ɵUiListbox as UiListbox,
  ɵinjectListbox as injectListbox,
  ɵprovideUiListbox as provideUiListbox,
} from '@vplans/ui-kit/listbox';
import { UiSelectBase } from './select-base';

/**
 * Dropdown for picking one value from a list (WAI-ARIA combobox with a listbox popup).
 * Focus stays on the trigger; the active option is exposed with `aria-activedescendant`.
 *
 * - Closed: ArrowDown/ArrowUp/Enter/Space open the list; typing jumps to a matching option.
 * - Open: arrows, Home/End and PageUp/PageDown move, Enter (or Space) selects, Escape and Tab close.
 * - `searchable` turns the trigger into a text input that filters the options by label.
 *   Listen to `searchChange` and set `filterOptions="false"` to filter on the server instead.
 *   `maxLength` limits the search text.
 * - `creatable` (with `searchable`, string values) adds a first option "Add «text»" while the
 *   search text equals no option label and not the value's label. Picking it (or Enter while
 *   it is active) makes the text the value and closes the list. A string value outside the list
 *   is its own label.
 *
 * Implements `ControlValueAccessor`: bind it with `formControl`, `formControlName` or `ngModel`.
 *
 * @example
 * <ui-form-field label="Coordinator">
 *   <ui-select formControlName="coordinator" placeholder="Choose">
 *     @for (c of coordinators; track c.id) {
 *       <ui-option [value]="c.id">{{ c.name }}</ui-option>
 *     }
 *   </ui-select>
 * </ui-form-field>
 */
@Component({
  selector: 'ui-select',
  imports: [CdkOverlayOrigin, UiChip, UiDropdownPanel, UiIcon, UiListbox, UiSpinner],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiSelect) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSelect), multi: true },
    provideUiListbox(),
  ],
  host: { class: 'ui-select' },
})
export class UiSelect<T = unknown> extends UiSelectBase<T, T | null> {
  readonly value = model<T | null>(null);

  protected readonly listbox: UiListboxController<T> = injectListbox<T>({
    ...this.listboxConfig(),
    isSelected: (value) => this.listbox.matches(value, this.value()),
    select: (value) => this.setValue(value as T),
  });

  protected readonly displayLabel = computed(() => this.listbox.labelFor(this.value()));
  protected readonly hasValue = computed(() => this.value() !== null);

  protected selectedValues(): readonly T[] {
    const value = this.value();
    return value === null ? [] : [value];
  }

  /** The text becomes the value, and the list closes as after picking an option. */
  protected addCreated(text: string): void {
    this.setValue(text as T);
  }

  private setValue(value: T): void {
    this.value.set(value);
    this.notifyChange(value);
    this.close();
  }

  protected clearValue(): void {
    this.value.set(null);
    this.notifyChange(null);
  }

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? null);
  }
}

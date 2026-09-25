import { ChangeDetectionStrategy, Component, computed, forwardRef, model } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { UI_FORM_FIELD_CONTROL } from '@vplans/ui-kit/core';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiOptionParent } from './option';
import { UiSelectBase } from './select-base';

/**
 * Dropdown for picking one value from a list (WAI-ARIA combobox with a listbox popup).
 * Focus stays on the trigger; the active option is exposed with `aria-activedescendant`.
 *
 * - Closed: ArrowDown/ArrowUp/Enter/Space open the list; typing jumps to a matching option.
 * - Open: arrows, Home/End and PageUp/PageDown move, Enter (or Space) selects, Escape and Tab close.
 * - `searchable` turns the trigger into a text input that filters the options by label.
 *   Listen to `searchChange` and set `filterOptions="false"` to filter on the server instead.
 *
 * Implements `FormValueControl` (Signal Forms) and `ControlValueAccessor`.
 *
 * @example
 * <ui-form-field label="Coordinator">
 *   <ui-select [formField]="form.coordinator" placeholder="Choose">
 *     @for (c of coordinators; track c.id) {
 *       <ui-option [value]="c.id">{{ c.name }}</ui-option>
 *     }
 *   </ui-select>
 * </ui-form-field>
 */
@Component({
  selector: 'ui-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, UiIcon],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiSelect) },
    UiOptionParent,
  ],
  host: { class: 'ui-select' },
})
export class UiSelect<T = unknown> extends UiSelectBase<T, T | null> {
  readonly value = model<T | null>(null);
  readonly multiple = false;

  protected readonly displayLabel = computed(() => this.selectedOptions()[0]?.getLabel() ?? '');

  protected isSelected(value: unknown): boolean {
    return this.compareWith()(value, this.value());
  }

  protected selectOption(value: unknown): void {
    this.value.set(value as T);
    this.notifyChange(value as T);
    this.close();
  }

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? null);
  }
}

import { ChangeDetectionStrategy, Component, computed, forwardRef, model } from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { UI_FORM_FIELD_CONTROL } from '@vplans/ui-kit/core';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiOptionParent } from './option';
import { UiSelectBase } from './select-base';

/**
 * Dropdown for picking several values from a list. Same keyboard and search behavior as
 * `ui-select`, but Enter, Space and clicks toggle the active option and the list stays open;
 * Escape or Tab closes it. The listbox has `aria-multiselectable` and each option shows a
 * checkbox. The trigger lists the selected labels in option order.
 *
 * The value is a new array on every change. Implements `FormValueControl` (Signal Forms) and
 * `ControlValueAccessor`.
 *
 * @example
 * <ui-form-field label="Coordinators">
 *   <ui-multi-select [formField]="form.coordinators" placeholder="Choose">
 *     @for (c of coordinators; track c.id) {
 *       <ui-option [value]="c.id">{{ c.name }}</ui-option>
 *     }
 *   </ui-multi-select>
 * </ui-form-field>
 */
@Component({
  selector: 'ui-multi-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, UiIcon],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiMultiSelect) },
    UiOptionParent,
  ],
  host: { class: 'ui-select ui-multi-select' },
})
export class UiMultiSelect<T = unknown> extends UiSelectBase<T, readonly T[]> {
  readonly value = model<readonly T[]>([]);
  readonly multiple = true;

  /** Labels in list order, then the selected values that are not in the list. */
  protected readonly displayLabel = computed(() => {
    const listed = this.selectedOptions();
    const missing = this.value().filter(
      (value) => !listed.some((option) => this.matches(option.value(), value)),
    );
    return [...listed.map((option) => option.getLabel()), ...missing.map((v) => this.labelFor(v))]
      .filter(Boolean)
      .join(', ');
  });

  protected isSelected(value: unknown): boolean {
    return this.value().some((selected) => this.matches(value, selected));
  }

  /** Adds the value, or removes it when it is already selected. */
  protected selectOption(value: unknown): void {
    const current = this.value();
    const next = this.isSelected(value)
      ? current.filter((selected) => !this.matches(value, selected))
      : [...current, value as T];
    this.value.set(next);
    this.notifyChange(next);
  }

  writeValue(value: readonly T[] | null | undefined): void {
    this.value.set(value ?? []);
  }
}

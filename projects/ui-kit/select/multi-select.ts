import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { UI_FORM_FIELD_CONTROL } from '@vplans/ui-kit/core';
import { UiChip } from '@vplans/ui-kit/chip';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import { UiOption, UiOptionHandle, UiOptionParent } from './option';
import { UiSelectBase } from './select-base';

/** Value of the "select all" option; never part of the value. */
const SELECT_ALL = Symbol('ui-select-all');

/**
 * Dropdown for picking several values from a list. Same keyboard and search behavior as
 * `ui-select`, but Enter, Space and clicks toggle the active option and the list stays open;
 * Escape or Tab closes it. The listbox has `aria-multiselectable` and each option shows a
 * checkbox. The trigger lists the selected labels in option order.
 *
 * - `selectAll` adds a first option that selects or deselects every enabled option the search
 *   shows; it is mixed while some of them are selected.
 * - `maxSelections` disables the other options once that many are selected (and hides
 *   "select all").
 * - `chips` shows the selected values as chips in the trigger; their x removes a value with the
 *   mouse, the keyboard deselects in the list.
 *
 * The value is a new array on every change. Implements `ControlValueAccessor`: bind it with
 * `formControl`, `formControlName` or `ngModel`.
 *
 * @example
 * <ui-form-field label="Coordinators">
 *   <ui-multi-select formControlName="coordinators" placeholder="Choose">
 *     @for (c of coordinators; track c.id) {
 *       <ui-option [value]="c.id">{{ c.name }}</ui-option>
 *     }
 *   </ui-multi-select>
 * </ui-form-field>
 */
@Component({
  selector: 'ui-multi-select',
  imports: [
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
    NgTemplateOutlet,
    UiChip,
    UiIcon,
    UiOption,
    UiSpinner,
  ],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiMultiSelect) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiMultiSelect), multi: true },
    UiOptionParent,
  ],
  host: { class: 'ui-select ui-multi-select' },
})
export class UiMultiSelect<T = unknown> extends UiSelectBase<T, readonly T[]> {
  readonly value = model<readonly T[]>([]);
  readonly multiple = true;

  /** Adds a "select all" option at the top of the list. */
  readonly selectAll = input(false, { transform: booleanAttribute });
  /** Most values the user can select; the other options are disabled once reached. */
  readonly maxSelections = input<number | null, unknown>(null, {
    transform: (value: unknown) => (value == null || value === '' ? null : numberAttribute(value)),
  });
  /** Shows the selected values as chips in the trigger. */
  readonly chips = input(false, { transform: booleanAttribute });

  protected override readonly selectAllValue = SELECT_ALL;
  /** Options "select all" acts on: enabled and shown by the search. */
  private readonly selectable = computed(() =>
    this.options().filter((option) => !option.isDisabled() && !option.filteredOut()),
  );
  private readonly allSelected = computed(() => {
    const options = this.selectable();
    return options.length > 0 && options.every((option) => this.isSelected(option.value()));
  });
  private readonly limitReached = computed(() => {
    const max = this.maxSelections();
    return max !== null && this.value().length >= max;
  });

  protected override readonly showSelectAll = computed(
    () => this.selectAll() && this.maxSelections() === null && this.selectable().length > 0,
  );
  protected override readonly chipList = computed(() =>
    this.chips() ? this.value().map((value) => ({ value, label: this.labelFor(value) })) : [],
  );
  protected override readonly isIndeterminate = (option: UiOptionHandle): boolean =>
    option === this.selectAllOption() &&
    !this.allSelected() &&
    this.selectable().some((item) => this.isSelected(item.value()));
  protected override readonly isBlocked = (option: UiOptionHandle): boolean =>
    this.limitReached() && option !== this.selectAllOption() && !this.isSelected(option.value());
  protected override readonly alwaysShown = (option: UiOptionHandle): boolean =>
    option === this.selectAllOption();
  protected override readonly removeChip = (value: unknown): void => {
    if (this.readonly() || this.isDisabled() || !this.isSelected(value)) return;
    this.setValue(this.value().filter((selected) => !this.matches(value, selected)));
  };

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

  protected readonly hasValue = computed(() => this.value().length > 0);

  protected isSelected(value: unknown): boolean {
    if (value === SELECT_ALL) return this.allSelected();
    return this.value().some((selected) => this.matches(value, selected));
  }

  /** Adds the value, or removes it when it is already selected. */
  protected selectOption(value: unknown): void {
    if (value === SELECT_ALL) {
      this.toggleAll();
      return;
    }
    const current = this.value();
    if (this.isSelected(value)) {
      this.setValue(current.filter((selected) => !this.matches(value, selected)));
    } else if (!this.limitReached()) {
      this.setValue([...current, value as T]);
    }
  }

  /** Selects the options the search shows, or deselects them when they are all selected. */
  private toggleAll(): void {
    const values = this.selectable().map((option) => option.value());
    const current = this.value();
    if (this.allSelected()) {
      this.setValue(current.filter((selected) => !values.some((v) => this.matches(v, selected))));
    } else {
      this.setValue([...current, ...values.filter((v) => !this.isSelected(v))]);
    }
  }

  private setValue(next: readonly T[]): void {
    this.value.set(next);
    this.notifyChange(next);
  }

  protected clearValue(): void {
    this.value.set([]);
    this.notifyChange([]);
  }

  writeValue(value: readonly T[] | null | undefined): void {
    this.value.set(value ?? []);
  }
}

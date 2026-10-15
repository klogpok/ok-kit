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
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { UI_FORM_FIELD_CONTROL, ɵUiDropdownPanel as UiDropdownPanel } from '@vplans/ui-kit/core';
import { UiChip } from '@vplans/ui-kit/chip';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import {
  UiOption,
  type ɵUiListboxController as UiListboxController,
  type ɵUiOptionHandle as UiOptionHandle,
  ɵUiListbox as UiListbox,
  ɵinjectListbox as injectListbox,
  ɵprovideUiListbox as provideUiListbox,
} from '@vplans/ui-kit/listbox';
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
 * - `creatable` (with `searchable`, string values) adds a first option "Add «text»" while the
 *   search text equals no option label and no selected value, and `maxSelections` is not
 *   reached. A matching option stays active, so Enter adds the text only when the search shows
 *   no other option. Adding clears the search and keeps the list open. A string value outside
 *   the list is its own label.
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
  imports: [CdkOverlayOrigin, UiChip, UiDropdownPanel, UiIcon, UiListbox, UiOption, UiSpinner],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiMultiSelect) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiMultiSelect), multi: true },
    provideUiListbox(),
  ],
  host: { class: 'ui-select ui-multi-select' },
})
export class UiMultiSelect<T = unknown> extends UiSelectBase<T, readonly T[]> {
  readonly value = model<readonly T[]>([]);

  /** Adds a "select all" option at the top of the list. */
  readonly selectAll = input(false, { transform: booleanAttribute });
  /** Most values the user can select; the other options are disabled once reached. */
  readonly maxSelections = input<number | null, unknown>(null, {
    transform: (value: unknown) => (value == null || value === '' ? null : numberAttribute(value)),
  });
  /** Shows the selected values as chips in the trigger. */
  readonly chips = input(false, { transform: booleanAttribute });

  protected readonly listbox: UiListboxController<T> = injectListbox<T>({
    ...this.listboxConfig(),
    multiple: true,
    isSelected: (value) => this.isSelected(value),
    select: (value) => this.toggleValue(value),
    isIndeterminate: (option) =>
      option === this.selectAllOption() &&
      !this.allSelected() &&
      this.selectable().some((item) => this.isSelected(item.value())),
    isBlocked: (option: UiOptionHandle) =>
      this.limitReached() && !this.isLeading(option) && !this.isSelected(option.value()),
  });

  protected override readonly selectAllValue = SELECT_ALL;
  /** Options "select all" acts on: enabled and shown by the search. */
  private readonly selectable = computed(() =>
    this.listbox
      .options()
      .filter((option) => !option.isDisabled() && !this.listbox.isHidden(option)),
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
    this.chips()
      ? this.value().map((value) => ({ value, label: this.listbox.labelFor(value) }))
      : [],
  );
  protected override readonly removeChip = (value: unknown): void => {
    if (this.readonly() || this.isDisabled() || !this.isSelected(value)) return;
    this.setValue(this.value().filter((selected) => !this.listbox.matches(value, selected)));
  };

  /** Labels in list order, then the selected values that are not in the list. */
  protected readonly displayLabel = computed(() => {
    const listed = this.listbox.selectedOptions();
    const missing = this.value().filter(
      (value) => !listed.some((option) => this.listbox.matches(option.value(), value)),
    );
    return [
      ...listed.map((option) => option.getLabel()),
      ...missing.map((v) => this.listbox.labelFor(v)),
    ]
      .filter(Boolean)
      .join(', ');
  });

  protected readonly hasValue = computed(() => this.value().length > 0);

  private isSelected(value: unknown): boolean {
    if (value === SELECT_ALL) return this.allSelected();
    if (this.isCreate(value)) return false;
    return this.value().some((selected) => this.listbox.matches(value, selected));
  }

  protected selectedValues(): readonly T[] {
    return this.value();
  }

  protected override createBlocked(): boolean {
    return this.limitReached();
  }

  /** Adds the text to the value and clears the search; the list stays open. */
  protected addCreated(text: string): void {
    this.setValue([...this.value(), text as T]);
    // Enter before the next render: the `[value]` binding may still hold the empty text it had
    // when the list opened, and would not write `''` again.
    (this.control().nativeElement as HTMLInputElement).value = '';
    this.query.set('');
    this.searchChange.emit('');
  }

  /** Adds the value, or removes it when it is already selected. */
  private toggleValue(value: unknown): void {
    if (value === SELECT_ALL) {
      this.toggleAll();
      return;
    }
    if (this.isCreate(value)) {
      this.create();
      return;
    }
    const current = this.value();
    if (this.isSelected(value)) {
      this.setValue(current.filter((selected) => !this.listbox.matches(value, selected)));
    } else if (!this.limitReached()) {
      this.setValue([...current, value as T]);
    }
  }

  /** Selects the options the search shows, or deselects them when they are all selected. */
  private toggleAll(): void {
    const values = this.selectable().map((option) => option.value());
    const current = this.value();
    if (this.allSelected()) {
      this.setValue(
        current.filter((selected) => !values.some((v) => this.listbox.matches(v, selected))),
      );
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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  UI_FORM_FIELD_CONTROL,
  UiCheckableBase,
  provideUiCheckedValidator,
} from '@vplans/ui-kit/core';

/**
 * Checkbox built on a native `<input type="checkbox">`. The projected content is its label.
 * Implements `ControlValueAccessor`: bind it with `formControl`, `formControlName` or `ngModel`.
 *
 * @example <ui-checkbox formControlName="terms">I accept the terms</ui-checkbox>
 * @example <ui-checkbox [(checked)]="all" [indeterminate]="some()">Select all</ui-checkbox>
 */
@Component({
  selector: 'ui-checkbox',
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiCheckbox) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiCheckbox), multi: true },
    provideUiCheckedValidator(),
  ],
  host: {
    class: 'ui-checkbox',
    '[class]': '"ui-checkbox--" + size()',
    '[class.ui-checkbox--checked]': 'isChecked()',
    '[class.ui-checkbox--indeterminate]': 'isIndeterminate()',
    '[class.ui-checkbox--disabled]': 'isDisabled()',
    '[class.ui-checkbox--readonly]': 'readonly()',
    '[class.ui-checkbox--invalid]': 'showError()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiCheckbox extends UiCheckableBase {
  /** Mixed state; cleared when the user toggles the checkbox. */
  readonly indeterminate = model(false);
  readonly id = input(inject(_IdGenerator).getId('ui-checkbox-'));

  protected readonly isIndeterminate = computed(() => coerceBooleanProperty(this.indeterminate()));

  protected override onInputChange(event: Event): void {
    this.indeterminate.set(false);
    super.onInputChange(event);
  }
}

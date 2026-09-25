import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UiCheckableBase,
  provideUiCheckedValidator,
} from '@vplans/ui-kit/core';

/**
 * On/off toggle for settings that apply immediately. Native checkbox with `role="switch"`.
 * Implements `FormCheckboxControl` (Signal Forms) and `ControlValueAccessor`.
 *
 * @example <ui-switch [(checked)]="notifications">Email notifications</ui-switch>
 */
@Component({
  selector: 'ui-switch',
  template: `
    <label class="ui-switch__label">
      <span class="ui-switch__text"><ng-content /></span>
      <span class="ui-switch__track">
        <input
          #input
          type="checkbox"
          role="switch"
          class="ui-switch__input"
          [id]="controlId()"
          [checked]="isChecked()"
          [disabled]="isDisabled()"
          [required]="isRequired()"
          [attr.name]="name() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-readonly]="readonly() ? 'true' : null"
          [attr.aria-invalid]="showError() ? 'true' : null"
          [attr.aria-describedby]="describedBy()"
          (click)="onInputClick($event)"
          (change)="onInputChange($event)"
          (blur)="onBlur()"
        />
        <span class="ui-switch__thumb" aria-hidden="true"></span>
      </span>
    </label>
  `,
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiSwitch) },
    provideUiCheckedValidator(),
  ],
  host: {
    class: 'ui-switch',
    '[class]': '"ui-switch--" + size()',
    '[class.ui-switch--checked]': 'isChecked()',
    '[class.ui-switch--disabled]': 'isDisabled()',
    '[class.ui-switch--readonly]': 'readonly()',
    '[class.ui-switch--invalid]': 'showError()',
    '[class.ui-switch--label-start]': 'labelPosition() === "start"',
    '[class.ui-switch--full-width]': 'fullWidth()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiSwitch extends UiCheckableBase {
  readonly id = input(inject(_IdGenerator).getId('ui-switch-'));
  /** Place the label before (`start`) or after (`end`) the switch. */
  readonly labelPosition = input<'start' | 'end'>('end');
  /** Stretch the row and push the switch to the opposite edge (settings lists). */
  readonly fullWidth = input(false, { transform: booleanAttribute });
}

import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { UI_FORM_FIELD_CONTROL } from '@vplans/ui-kit/core';
import { UiTextControlBase } from './text-control-base';

/**
 * Styled native text input. Works with Reactive Forms and `ngModel` through Angular's own
 * `DefaultValueAccessor`, because the value stays on the native element.
 *
 * @example
 * <ui-form-field label="Email">
 *   <input ui-input type="email" formControlName="email" />
 * </ui-form-field>
 */
@Component({
  selector: 'input[ui-input]',
  template: '',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiInput) }],
  host: { class: 'ui-input' },
})
export class UiInput extends UiTextControlBase {}

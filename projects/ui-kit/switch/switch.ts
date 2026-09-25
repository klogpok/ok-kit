import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  UI_FORM_FIELD_CONTROL,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
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
          [attr.aria-checked]="isChecked()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-readonly]="readonly() ? 'true' : null"
          [attr.aria-invalid]="showError() ? 'true' : null"
          [attr.aria-describedby]="formField?.describedBy() ?? null"
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
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiSwitch) }],
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
    // The native control carries the label; a static attribute would also stay on the host.
    '[attr.aria-label]': 'null',
  },
})
export class UiSwitch extends UiFormControlBase<boolean> implements UiFormFieldControl {
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  readonly checked = model(false);
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /** Host id; the native input gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-switch-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });
  /** Place the label before (`start`) or after (`end`) the switch. */
  readonly labelPosition = input<'start' | 'end'>('end');
  /** Stretch the row and push the switch to the opposite edge (settings lists). */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);
  // model() has no transform, so a static `checked` attribute arrives as '': coerce on read.
  protected readonly isChecked = computed(() => coerceBooleanProperty(this.checked()));

  writeValue(value: boolean | null | undefined): void {
    this.checked.set(!!value);
  }

  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  /** A readonly checkbox cannot be toggled; a native checkbox ignores the `readonly` attribute. */
  protected onInputClick(event: MouseEvent): void {
    if (this.readonly()) event.preventDefault();
  }

  protected onInputChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.checked.set(checked);
    this.notifyChange(checked);
  }

  protected onBlur(): void {
    this.notifyTouched();
  }
}

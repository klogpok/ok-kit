import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
 * Checkbox built on a native `<input type="checkbox">`. The projected content is its label.
 * Implements `FormCheckboxControl` (Signal Forms) and `ControlValueAccessor`.
 *
 * @example <ui-checkbox [formField]="form.terms">I accept the terms</ui-checkbox>
 * @example <ui-checkbox [(checked)]="all" [indeterminate]="some()">Select all</ui-checkbox>
 */
@Component({
  selector: 'ui-checkbox',
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiCheckbox) }],
  host: {
    class: 'ui-checkbox',
    '[class]': '"ui-checkbox--" + size()',
    '[class.ui-checkbox--checked]': 'isChecked()',
    '[class.ui-checkbox--indeterminate]': 'isIndeterminate()',
    '[class.ui-checkbox--disabled]': 'isDisabled()',
    '[class.ui-checkbox--invalid]': 'showError()',
    '[attr.id]': 'id()',
  },
})
export class UiCheckbox extends UiFormControlBase<boolean> implements UiFormFieldControl {
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  readonly checked = model(false);
  /** Mixed state; cleared when the user toggles the checkbox. */
  readonly indeterminate = model(false);
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /** Host id; the native input gets `${id}-input`. */
  readonly id = input(inject(_IdGenerator).getId('ui-checkbox-'));
  /** Accessible name when there is no visible label content. */
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);
  // model() has no transform, so a static `checked` attribute arrives as '': coerce on read.
  protected readonly isChecked = computed(() => coerceBooleanProperty(this.checked()));
  protected readonly isIndeterminate = computed(() => coerceBooleanProperty(this.indeterminate()));

  writeValue(value: boolean | null | undefined): void {
    this.checked.set(!!value);
  }

  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  protected onInputChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.indeterminate.set(false);
    this.checked.set(checked);
    this.notifyChange(checked);
  }

  protected onBlur(): void {
    this.notifyTouched();
  }
}

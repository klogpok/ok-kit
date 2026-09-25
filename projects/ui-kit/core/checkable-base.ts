import {
  Directive,
  ElementRef,
  Signal,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { UiCheckedValidator } from './checked-validator';
import { UiFormControlBase } from './form-control-base';
import { UiFormFieldControl } from './form-field-control';
import { UiSize } from './types';

/**
 * Shared behavior of checkbox-like controls (`ui-checkbox`, `ui-switch`) built on a native
 * `<input type="checkbox" #input>`: the `checked` model, forms integration, readonly and focus.
 *
 * Subclasses declare `id` (with their own prefix) and provide `provideUiCheckedValidator()`.
 */
@Directive()
export abstract class UiCheckableBase
  extends UiFormControlBase<boolean>
  implements UiFormFieldControl
{
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  readonly checked = model(false);
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /** Host id; the native input gets `${id}-input`. */
  abstract readonly id: Signal<string>;
  /** Accessible name when there is no visible label content. */
  readonly ariaLabel = input('', { alias: 'aria-label' });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-input`);
  // model() has no transform, so a static `checked` attribute arrives as '': coerce on read.
  protected readonly isChecked = computed(() => coerceBooleanProperty(this.checked()));

  constructor() {
    super();
    // Reactive / template forms: a required control must be checked.
    const validator = inject(UiCheckedValidator);
    validator.required = this.isRequired;
    effect(() => {
      this.isRequired();
      untracked(() => validator.requiredChanged());
    });
  }

  writeValue(value: boolean | null | undefined): void {
    this.checked.set(!!value);
  }

  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  /** A readonly control cannot be toggled; a native checkbox ignores the `readonly` attribute. */
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

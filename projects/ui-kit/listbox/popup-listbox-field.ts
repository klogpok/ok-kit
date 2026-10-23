import {
  Directive,
  ElementRef,
  Provider,
  Signal,
  Type,
  computed,
  forwardRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
} from '@vplans/ui-kit/core';
import { UI_POPUP_LISTBOX_FIELD, UiComboboxField } from './combobox-control';
import { UiListboxConfig, UiListboxController, provideUiListbox } from './listbox-controller';

/**
 * The shell of a popup listbox field (`ui-select`, `ui-multi-select`, `ui-autocomplete`,
 * `ui-time-input`): the shared inputs and outputs, the host id and classes, the blur step and the
 * listbox config every field gives its listbox alike.
 *
 * A field adds its value semantics and:
 * - creates its listbox with `injectListbox({ ...this.fieldListboxConfig(), ... })`;
 * - puts `uiComboboxControl` and `#control` on its inner `<input>` or `<button>`, and calls
 *   `onBlur()` from its `(blur)`;
 * - lists `provideUiPopupListboxField(() => Field)` next to its own `NG_VALUE_ACCESSOR`.
 *
 * Internal.
 */
@Directive({
  host: {
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
    '[class]': 'hostClasses()',
  },
})
export abstract class UiPopupListboxField<V>
  extends UiFormControlBase<V>
  implements UiFormFieldControl, UiComboboxField
{
  /**
   * The popup listbox; the field creates it with `injectListbox()`. Typed by what this class
   * calls, so a field keeps the controller of its own option type.
   */
  protected abstract readonly listbox: Pick<UiListboxController, 'open' | 'close'>;

  /**
   * BEM block of the host classes and prefix of the generated id, e.g. `'ui-select'`. A method,
   * not a field: the `id` default reads it while this class is built, before the field's own
   * initializers have run.
   */
  protected abstract classPrefix(): string;

  readonly size = input<UiSize>('md');
  /** Host id; the inner control gets `${id}-control` (`controlIdSuffix`). */
  readonly id = input(inject(_IdGenerator).getId(`${this.classPrefix()}-`));
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly placeholder = input('');
  /** `name` of the inner control. */
  readonly name = input('');

  readonly opened = output();
  readonly closed = output();

  readonly labelStrategy = 'for' as const;
  readonly controlId: Signal<string> = computed(() => `${this.id()}-${this.controlIdSuffix}`);
  /** End of `controlId`; `ui-time-input` keeps its `-input`. */
  protected readonly controlIdSuffix: string = 'control';
  /**
   * The protected `describedBy` of `UiFormControlBase`, for `uiComboboxControl` only. It is set
   * after the base class has built `describedBy`, also under `useDefineForClassFields: false`.
   * Internal.
   */
  readonly ɵdescribedBy: Signal<string | null> = this.describedBy;

  /** The inner `<input>` or `<button>` that carries `uiComboboxControl`. */
  protected readonly control = viewChild.required<ElementRef<HTMLElement>>('control');

  /** The size, disabled, readonly and invalid classes; a field binds its own next to them. */
  protected readonly hostClasses = computed(() => {
    const prefix = this.classPrefix();
    return {
      [`${prefix}--${this.size()}`]: true,
      [`${prefix}--disabled`]: this.isDisabled(),
      [`${prefix}--readonly`]: this.readonly(),
      [`${prefix}--invalid`]: this.showError(),
    };
  });

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  open(): void {
    this.listbox.open();
  }

  close(): void {
    this.listbox.close();
  }

  /** The inner control lost focus: closes the list, then marks the control touched. */
  protected onBlur(): void {
    this.close();
    this.notifyTouched();
  }

  /**
   * What every field gives its listbox alike: its `aria-label`, locked while readonly or
   * disabled, and its `opened` / `closed` outputs. Spread it into `injectListbox()`.
   */
  protected fieldListboxConfig(): Pick<
    UiListboxConfig<unknown>,
    'ariaLabel' | 'locked' | 'opened' | 'closed'
  > {
    return {
      ariaLabel: () => this.ariaLabel(),
      locked: () => this.readonly() || this.isDisabled(),
      opened: () => this.opened.emit(),
      closed: () => this.closed.emit(),
    };
  }
}

/**
 * The providers of a popup listbox field, except its `NG_VALUE_ACCESSOR`, which every concrete
 * control lists itself: the field token of `uiComboboxControl`, `UI_FORM_FIELD_CONTROL` and the
 * listbox. Internal.
 */
export function provideUiPopupListboxField(field: () => Type<unknown>): Provider[] {
  return [
    { provide: UI_POPUP_LISTBOX_FIELD, useExisting: forwardRef(field) },
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(field) },
    provideUiListbox(),
  ];
}

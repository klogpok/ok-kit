import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
} from '@vplans/ui-kit/core';

/** What a radio may do with its group, kept out of the public `UiRadioGroup` API. Internal. */
@Injectable()
class UiRadioGroupControl {
  select: (value: unknown) => void = () => undefined;
  markTouched: () => void = () => undefined;
}

/**
 * Group of mutually exclusive options. Uses native radios sharing a `name`, so arrow-key
 * navigation and the single tab stop come from the browser.
 * Implements `FormValueControl` (Signal Forms) and `ControlValueAccessor`.
 *
 * @example
 * <ui-form-field label="Delivery">
 *   <ui-radio-group [formField]="form.delivery">
 *     <ui-radio value="pickup">Pickup</ui-radio>
 *     <ui-radio value="courier">Courier</ui-radio>
 *   </ui-radio-group>
 * </ui-form-field>
 */
@Component({
  selector: 'ui-radio-group',
  template: '<ng-content />',
  styleUrl: './radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiRadioGroup) },
    UiRadioGroupControl,
  ],
  host: {
    class: 'ui-radio-group',
    role: 'radiogroup',
    '[class]': '"ui-radio-group--" + orientation()',
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'ariaLabelledby() || formField?.labelledBy() || null',
    '[attr.aria-describedby]': 'formField?.describedBy() ?? null',
    '[attr.aria-invalid]': 'showError() ? "true" : null',
    '[attr.aria-required]': 'isRequired() ? "true" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.aria-readonly]': 'readonly() ? "true" : null',
  },
})
export class UiRadioGroup<T = unknown>
  extends UiFormControlBase<T | null>
  implements UiFormFieldControl
{
  private readonly radios = contentChildren(
    forwardRef(() => UiRadio),
    { descendants: true },
  );
  private readonly ids = inject(_IdGenerator);

  readonly value = model<T | null>(null);
  readonly id = input(this.ids.getId('ui-radio-group-'));
  /** Shared native `name`; generated when omitted. */
  readonly name = input(this.ids.getId('ui-radio-group-name-'));
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly size = input<UiSize>('md');
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaLabelledby = input('', { alias: 'aria-labelledby' });
  /** Compares option values with the selected value, e.g. by id for objects. */
  readonly compareWith = input<(a: T | null, b: T) => boolean>(Object.is);

  readonly labelStrategy = 'labelledby' as const;
  readonly controlId = computed(() => this.id());

  constructor() {
    super();
    const control = inject(UiRadioGroupControl);
    control.select = (value) => {
      this.value.set(value as T);
      this.notifyChange(value as T);
    };
    control.markTouched = () => this.notifyTouched();
  }

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? null);
  }

  /** Focuses the selected radio, or the first enabled one. */
  focus(options?: FocusOptions): void {
    const radios = this.radios().filter((radio) => !radio.isDisabled());
    (radios.find((radio) => radio.isChecked()) ?? radios[0])?.focus(options);
  }
}

/** A single option inside `ui-radio-group`. The projected content is its label. */
@Component({
  selector: 'ui-radio',
  template: `
    <label class="ui-radio__label">
      <span class="ui-radio__control">
        <input
          #input
          type="radio"
          class="ui-radio__input"
          [id]="inputId()"
          [name]="group.name()"
          [checked]="isChecked()"
          [disabled]="isDisabled()"
          [required]="group.isRequired()"
          [attr.aria-label]="ariaLabel() || null"
          (click)="onClick($event)"
          (change)="control.select(value())"
          (blur)="control.markTouched()"
        />
      </span>
      <span class="ui-radio__text"><ng-content /></span>
    </label>
  `,
  styleUrl: './radio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-radio',
    '[class]': '"ui-radio--" + group.size()',
    '[class.ui-radio--checked]': 'isChecked()',
    '[class.ui-radio--disabled]': 'isDisabled()',
    '[class.ui-radio--readonly]': 'group.readonly()',
    '[class.ui-radio--invalid]': 'group.showError()',
    '[attr.id]': 'id()',
    // The native control carries the label; a static attribute would also stay on the host.
    '[attr.aria-label]': 'null',
  },
})
export class UiRadio<T = unknown> {
  protected readonly group = inject<UiRadioGroup<T>>(UiRadioGroup);
  protected readonly control = inject(UiRadioGroupControl);
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  readonly value = input.required<T>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly id = input(inject(_IdGenerator).getId('ui-radio-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  protected readonly inputId = computed(() => `${this.id()}-input`);
  readonly isChecked = computed(() => this.group.compareWith()(this.group.value(), this.value()));
  readonly isDisabled = computed(() => this.disabled() || this.group.isDisabled());

  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  /** In a readonly group, clicks and arrow keys (which click the next radio) keep the selection. */
  protected onClick(event: MouseEvent): void {
    if (this.group.readonly()) event.preventDefault();
  }
}

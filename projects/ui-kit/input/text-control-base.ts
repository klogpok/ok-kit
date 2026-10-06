import {
  AfterViewInit,
  Directive,
  DoCheck,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { UI_FORM_FIELD, UiFormFieldControl, UiSize, injectControlState } from '@vplans/ui-kit/core';

/**
 * Shared behavior for native text controls (`input[ui-input]`, `textarea[ui-textarea]`).
 * The value is handled by the forms layer directly on the native element (Angular's
 * `DefaultValueAccessor`); this directive only adds styling, ids and ARIA wiring.
 */
@Directive({
  host: {
    '[class]': '"ui-input--" + size()',
    '[class.ui-input--invalid]': 'showError()',
    '[class.ui-input--affixed]': 'formField?.hasAffixes() ?? false',
    '[id]': 'id()',
    '[attr.aria-invalid]': 'showError() ? "true" : null',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-required]': 'isRequired() ? "true" : null',
  },
})
export abstract class UiTextControlBase implements UiFormFieldControl, AfterViewInit, DoCheck {
  protected readonly element =
    inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef).nativeElement;
  protected readonly formField = inject(UI_FORM_FIELD, { optional: true });
  private readonly state = injectControlState();
  private readonly nativeDisabled = signal(false);
  private readonly nativeRequired = signal(false);

  readonly id = input(inject(_IdGenerator).getId('ui-input-'));
  readonly size = input<UiSize>('md');
  /**
   * Shows the error state when no forms directive is bound. With forms bound, the error state
   * is derived from the control (invalid and touched).
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Ids of the app's own descriptions, kept before the hint / error of `ui-form-field`. */
  readonly ariaDescribedBy = input<string | null>(null, { alias: 'aria-describedby' });

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => this.id());
  readonly isDisabled = computed(() => this.state.disabled() || this.nativeDisabled());
  readonly isRequired = computed(() => this.state.required() || this.nativeRequired());
  readonly showError = computed(() =>
    this.state.bound() ? this.state.invalid() && this.state.touched() : this.invalid(),
  );
  readonly errorMessages = this.state.errorMessages;
  protected readonly describedBy = computed(
    () => [this.ariaDescribedBy(), this.formField?.describedBy()].filter(Boolean).join(' ') || null,
  );

  /**
   * A native input provides no value accessor of its own, so nothing calls `sync()` while the
   * forms directive attaches its control. The first `ngDoCheck` can run before that happens, so
   * read the state again once the view around the input is initialised.
   */
  ngAfterViewInit(): void {
    this.state.sync();
  }

  ngDoCheck(): void {
    this.state.sync();
    this.nativeDisabled.set(this.element.disabled);
    this.nativeRequired.set(this.element.required);
  }

  focus(options?: FocusOptions): void {
    this.element.focus(options);
  }
}

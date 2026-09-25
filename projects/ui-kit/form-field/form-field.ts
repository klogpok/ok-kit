import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  booleanAttribute,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD,
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormFieldContext,
} from '@vplans/ui-kit/core';

/** Helper text shown below the control while there is no visible error. */
@Component({
  selector: 'ui-hint',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-hint' },
})
export class UiHint {}

/** Error message, shown only while the control is in an error state (invalid and touched). */
@Component({
  selector: 'ui-error',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-error' },
})
export class UiError {}

/**
 * Content shown before a text control inside the field border: an icon, a currency sign, a unit.
 *
 * @example <ui-icon uiPrefix icon="search" />
 */
@Directive({ selector: '[uiPrefix]' })
export class UiPrefix {}

/**
 * Content shown after a text control inside the field border: a unit or an icon button.
 *
 * @example
 * <button uiSuffix ui-icon-button label="Show password" (click)="show.set(!show())">
 *   <ui-icon icon="eye" />
 * </button>
 */
@Directive({ selector: '[uiSuffix]' })
export class UiSuffix {}

/**
 * Wraps a control with a label, hint and error messages, and links them via
 * `for` / `aria-labelledby` and `aria-describedby`.
 *
 * Errors come from projected `<ui-error>` elements; if none are projected, messages supplied by
 * the forms layer are shown (Signal Forms `message`, or string-valued Reactive Forms errors).
 *
 * @example
 * <ui-form-field label="Email" hint="We never share it">
 *   <input ui-input type="email" formControlName="email" />
 *   @if (email.hasError('required')) { <ui-error>Email is required</ui-error> }
 * </ui-form-field>
 */
@Component({
  selector: 'ui-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD, useExisting: forwardRef(() => UiFormField) }],
  host: {
    class: 'ui-form-field',
    '[class.ui-form-field--disabled]': 'control()?.isDisabled()',
    '[class.ui-form-field--invalid]': 'showError()',
    '[class.ui-form-field--affixed]': 'hasAffixes()',
  },
})
export class UiFormField implements UiFormFieldContext {
  private readonly ids = inject(_IdGenerator);
  protected readonly labels = inject(UI_LABELS);

  readonly label = input('');
  readonly hint = input('');
  /** Show the required marker. Defaults to the control's required state. */
  readonly required = input<boolean | undefined, unknown>(undefined, {
    transform: (value: unknown) => (value === undefined ? undefined : booleanAttribute(value)),
  });

  protected readonly control = contentChild(UI_FORM_FIELD_CONTROL, { descendants: true });
  private readonly projectedHints = contentChildren(UiHint, { descendants: true });
  private readonly projectedErrors = contentChildren(UiError, { descendants: true });
  private readonly prefixes = contentChildren(UiPrefix);
  private readonly suffixes = contentChildren(UiSuffix);

  protected readonly hasPrefix = computed(() => this.prefixes().length > 0);
  protected readonly hasSuffix = computed(() => this.suffixes().length > 0);
  readonly hasAffixes = computed(() => this.hasPrefix() || this.hasSuffix());

  protected readonly labelId = this.ids.getId('ui-form-field-label-');
  readonly labelledBy = computed(() => (this.label() ? this.labelId : null));
  protected readonly hintId = this.ids.getId('ui-form-field-hint-');
  protected readonly errorId = this.ids.getId('ui-form-field-error-');

  protected readonly labelFor = computed(() => {
    const control = this.control();
    return control?.labelStrategy === 'for' ? control.controlId() : null;
  });
  protected readonly isRequired = computed(
    () => this.required() ?? this.control()?.isRequired() ?? false,
  );
  /** Marked required here only: the control has no `aria-required`, so say it in the label. */
  protected readonly requiredOnlyHere = computed(
    () => this.required() === true && !this.control()?.isRequired(),
  );
  protected readonly showError = computed(() => this.control()?.showError() ?? false);
  protected readonly hasProjectedErrors = computed(() => this.projectedErrors().length > 0);
  protected readonly autoErrors = computed(() =>
    this.hasProjectedErrors() ? [] : (this.control()?.errorMessages() ?? []),
  );
  protected readonly hasError = computed(
    () => this.showError() && (this.hasProjectedErrors() || this.autoErrors().length > 0),
  );
  protected readonly hasHint = computed(() => !!this.hint() || this.projectedHints().length > 0);

  readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    return this.hasHint() ? this.hintId : null;
  });

  /** Clicking decorative affix content focuses the control, like clicking inside a native input. */
  // Returns void on purpose: a `false` result from a template listener calls preventDefault(),
  // which would cancel checkbox/radio toggles inside the field.
  protected onBoxClick(event: MouseEvent): void {
    if (!this.hasAffixes()) return;
    const target = event.target as Element;
    if (target.closest('button, a, input, textarea, select, [tabindex]')) return;
    this.control()?.focus();
  }
}

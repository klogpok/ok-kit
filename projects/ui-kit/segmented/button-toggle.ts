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
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconCheck } from '@vplans/ui-kit/icon';
import { UiSegmentedOrientation } from './segmented';

/** What a toggle may do with its group, kept out of the public `UiButtonToggleGroup` API. Internal. */
@Injectable()
class UiButtonToggleGroupControl {
  toggle: (value: unknown) => void = () => undefined;
}

/**
 * A toggle button of `ui-button-toggle-group`: a native button with `aria-pressed`. The projected
 * content is its label; a pressed toggle also shows a check mark, so the state does not rely on
 * color alone.
 */
@Component({
  selector: 'button[ui-button-toggle]',
  imports: [UiIcon],
  template: `
    @if (isPressed()) {
      <ui-icon class="ui-button-toggle__check" [icon]="checkIcon" />
    }
    <span class="ui-button-toggle__content"><ng-content /></span>
  `,
  styleUrl: './button-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-button-toggle',
    type: 'button',
    '[class.ui-button-toggle--pressed]': 'isPressed()',
    '[class.ui-button-toggle--readonly]': 'group.readonly()',
    '[disabled]': 'isDisabled()',
    '[attr.aria-pressed]': 'isPressed()',
    // A readonly toggle stays focusable, and says it cannot be changed.
    '[attr.aria-disabled]': 'group.readonly() && !isDisabled() ? "true" : null',
    '(click)': 'control.toggle(value())',
  },
})
export class UiButtonToggle<T = unknown> {
  // Declared above UiButtonToggleGroup, which queries it (see Storybook JIT in the component rules).
  protected readonly group = inject<UiButtonToggleGroup<T>>(UiButtonToggleGroup);
  protected readonly control = inject(UiButtonToggleGroupControl);
  private readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  protected readonly checkIcon = uiIconCheck;

  readonly value = input.required<T>();
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly isPressed = computed(() => this.group.isSelected(this.value()));
  readonly isDisabled = computed(() => this.disabled() || this.group.isDisabled());

  focus(options?: FocusOptions): void {
    this.element.focus(options);
  }
}

/**
 * A group of toggle buttons for several choices at once, e.g. weekdays or filters shown side by
 * side. Each button is a tab stop with `aria-pressed`; Space and Enter toggle it. The value is
 * the list of pressed values, in the order they were pressed. For one choice use `ui-segmented`.
 * Implements `ControlValueAccessor`: bind it with `formControl`, `formControlName` or `ngModel`.
 *
 * `Validators.required` does not treat an empty list as missing: a required group needs an
 * "at least one" validator of its own.
 *
 * @example
 * <ui-button-toggle-group [(value)]="days" aria-label="Working days">
 *   <button ui-button-toggle value="sun">Sun</button>
 *   <button ui-button-toggle value="mon">Mon</button>
 * </ui-button-toggle-group>
 */
@Component({
  selector: 'ui-button-toggle-group',
  template: '<ng-content />',
  styleUrl: './button-toggle-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiButtonToggleGroup) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiButtonToggleGroup), multi: true },
    UiButtonToggleGroupControl,
  ],
  host: {
    class: 'ui-button-toggle-group',
    role: 'group',
    '[class]': '"ui-button-toggle-group--" + size()',
    '[class.ui-button-toggle-group--vertical]': 'orientation() === "vertical"',
    '[class.ui-button-toggle-group--full-width]': 'fullWidth()',
    '[class.ui-button-toggle-group--disabled]': 'isDisabled()',
    '[class.ui-button-toggle-group--invalid]': 'showError()',
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]':
      'ariaLabelledby() || (ariaLabel() ? null : formField?.labelledBy()) || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'showError() ? "true" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiButtonToggleGroup<T = unknown>
  extends UiFormControlBase<readonly T[]>
  implements UiFormFieldControl
{
  private readonly toggles = contentChildren<UiButtonToggle<T>>(UiButtonToggle, {
    descendants: true,
  });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly value = model<readonly T[]>([]);
  readonly id = input(inject(_IdGenerator).getId('ui-button-toggle-group-'));
  readonly size = input<UiSize>('md');
  /** `vertical` stacks the buttons; they then share the width of the widest one. */
  readonly orientation = input<UiSegmentedOrientation>('horizontal');
  /** Stretches the group to its container; the buttons share the width equally. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaLabelledby = input('', { alias: 'aria-labelledby' });
  /**
   * Compares a button value with a selected value, e.g. by id for objects. Called as
   * `compareWith(option, selected)` and never with `null`: a `null` value matches only `null`.
   */
  readonly compareWith = input<(option: T, selected: T) => boolean>(Object.is);

  readonly labelStrategy = 'labelledby' as const;
  readonly controlId = computed(() => this.id());

  constructor() {
    super();
    inject(UiButtonToggleGroupControl).toggle = (value) => {
      if (this.readonly() || this.isDisabled()) return;
      const current = this.value();
      const next = this.isSelected(value)
        ? current.filter((selected) => !this.matches(value, selected))
        : [...current, value as T];
      this.value.set(next);
      this.notifyChange(next);
    };
  }

  writeValue(value: readonly T[] | null | undefined): void {
    this.value.set(value ?? []);
  }

  /** Whether a value is pressed. */
  isSelected(value: unknown): boolean {
    return this.value().some((selected) => this.matches(value, selected));
  }

  /** Focuses the first pressed button, or the first enabled one. */
  focus(options?: FocusOptions): void {
    const toggles = this.toggles().filter((toggle) => !toggle.isDisabled());
    (toggles.find((toggle) => toggle.isPressed()) ?? toggles.at(0))?.focus(options);
  }

  /** Touched once focus leaves the group. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) this.notifyTouched();
  }

  private matches(option: unknown, selected: T): boolean {
    return option == null || selected == null
      ? option === selected
      : this.compareWith()(option as T, selected);
  }
}

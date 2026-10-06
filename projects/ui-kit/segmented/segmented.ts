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
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  UI_FORM_FIELD_CONTROL,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  resolveDirection,
} from '@vplans/ui-kit/core';

/** What a segment may do with its control, kept out of the public `UiSegmented` API. Internal. */
@Injectable()
class UiSegmentedControl {
  select: (value: unknown) => void = () => undefined;
  /** `segment` is the `UiSegment` whose radio got the key. */
  keydown: (event: KeyboardEvent, segment: object) => void = () => undefined;
}

export type UiSegmentedOrientation = 'horizontal' | 'vertical';

/** Keys that move between segments; the number is the step in DOM order for LTR. */
const ARROW_STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowDown: 1,
};

/** An option of `ui-segmented`. The projected content is its label. */
@Component({
  selector: 'ui-segment',
  template: `
    <label class="ui-segment__label">
      <input
        #input
        type="radio"
        class="ui-segment__input"
        [id]="inputId()"
        [name]="group.name()"
        [checked]="isChecked()"
        [disabled]="isDisabled()"
        [required]="group.isRequired()"
        [attr.aria-label]="ariaLabel() || null"
        (click)="onClick($event)"
        (change)="control.select(value())"
        (keydown)="control.keydown($event, this)"
      />
      <span class="ui-segment__icon"><ng-content select="[uiSegmentIcon]" /></span>
      <span class="ui-segment__text"><ng-content /></span>
    </label>
  `,
  styleUrl: './segment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-segment',
    '[class.ui-segment--checked]': 'isChecked()',
    '[class.ui-segment--disabled]': 'isDisabled()',
    '[class.ui-segment--readonly]': 'group.readonly()',
    '[attr.id]': 'id()',
    // The native radio carries the label; a static attribute would also stay on the host.
    '[attr.aria-label]': 'null',
  },
})
export class UiSegment<T = unknown> {
  // Declared above UiSegmented, which queries it (see Storybook JIT in the component rules).
  protected readonly group = inject<UiSegmented<T>>(UiSegmented);
  protected readonly control = inject(UiSegmentedControl);
  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  readonly value = input.required<T>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly id = input(inject(_IdGenerator).getId('ui-segment-'));
  /** Name of an icon-only segment. */
  readonly ariaLabel = input('', { alias: 'aria-label' });

  protected readonly inputId = computed(() => `${this.id()}-input`);
  readonly isChecked = computed(() => {
    const option = this.value();
    const selected = this.group.value();
    return option == null || selected == null
      ? option === selected
      : this.group.compareWith()(option, selected);
  });
  readonly isDisabled = computed(() => this.disabled() || this.group.isDisabled());

  focus(options?: FocusOptions): void {
    this.inputRef().nativeElement.focus(options);
  }

  /** In a readonly control, clicks keep the selection. */
  protected onClick(event: MouseEvent): void {
    if (this.group.readonly()) event.preventDefault();
  }
}

/**
 * A segmented control: a row of mutually exclusive options that switch a view or a mode, e.g.
 * list / board. It is a `radiogroup` of native radios, so the single tab stop, Space and the
 * accessible name of each segment come from the browser. The arrow keys move and select, and
 * ←/→ follow the visual direction (in RTL ← moves to the next segment); Home and End go to the
 * first and the last segment. `orientation="vertical"` stacks the segments.
 * Implements `FormValueControl` (Signal Forms) and `ControlValueAccessor`.
 *
 * Mark an icon with `uiSegmentIcon`; give an icon-only segment an `aria-label`.
 *
 * @example
 * <ui-segmented [(value)]="view" aria-label="View">
 *   <ui-segment value="list">List</ui-segment>
 *   <ui-segment value="board">Board</ui-segment>
 * </ui-segmented>
 */
@Component({
  selector: 'ui-segmented',
  template: '<ng-content />',
  styleUrl: './segmented.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiSegmented) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSegmented), multi: true },
    UiSegmentedControl,
  ],
  host: {
    class: 'ui-segmented',
    role: 'radiogroup',
    '[class]': '"ui-segmented--" + size()',
    '[class.ui-segmented--vertical]': 'orientation() === "vertical"',
    '[class.ui-segmented--full-width]': 'fullWidth()',
    '[class.ui-segmented--disabled]': 'isDisabled()',
    '[class.ui-segmented--invalid]': 'showError()',
    '[attr.id]': 'id()',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]':
      'ariaLabelledby() || (ariaLabel() ? null : formField?.labelledBy()) || null',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': 'showError() ? "true" : null',
    '[attr.aria-required]': 'isRequired() ? "true" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.aria-readonly]': 'readonly() ? "true" : null',
    '[attr.aria-orientation]': 'orientation()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class UiSegmented<T = unknown>
  extends UiFormControlBase<T | null>
  implements UiFormFieldControl
{
  private readonly segments = contentChildren<UiSegment<T>>(UiSegment, { descendants: true });
  private readonly ids = inject(_IdGenerator);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly control = inject(UiSegmentedControl);

  readonly value = model<T | null>(null);
  readonly id = input(this.ids.getId('ui-segmented-'));
  /** Shared native `name`; generated when omitted. */
  readonly name = input(this.ids.getId('ui-segmented-name-'));
  readonly size = input<UiSize>('md');
  /** `vertical` stacks the segments; they then share the width of the widest one. */
  readonly orientation = input<UiSegmentedOrientation>('horizontal');
  /** Stretches the control to its container; the segments share the width equally. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaLabelledby = input('', { alias: 'aria-labelledby' });
  /**
   * Compares a segment value with the selected value, e.g. by id for objects. Called as
   * `compareWith(option, selected)` and never with `null`: a `null` value matches only `null`.
   */
  readonly compareWith = input<(option: T, selected: T) => boolean>(Object.is);

  readonly labelStrategy = 'labelledby' as const;
  readonly controlId = computed(() => this.id());

  constructor() {
    super();
    this.control.select = (value) => {
      if (this.readonly() || this.isDisabled()) return;
      this.value.set(value as T);
      this.notifyChange(value as T);
    };
    this.control.keydown = (event, segment) => {
      this.onKeydown(event, segment as UiSegment<T>);
    };
  }

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? null);
  }

  /** Focuses the selected segment, or the first enabled one. */
  focus(options?: FocusOptions): void {
    const segments = this.segments().filter((segment) => !segment.isDisabled());
    (segments.find((segment) => segment.isChecked()) ?? segments.at(0))?.focus(options);
  }

  /**
   * Arrow keys move to the next enabled segment (wrapping) and select it, Home and End to the
   * first and the last one; a readonly control only moves focus. Handled here rather than by the
   * browser, which does not mirror ←/→ in RTL everywhere.
   */
  private onKeydown(event: KeyboardEvent, segment: UiSegment<T>): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const segments = this.segments().filter((item) => !item.isDisabled());
    const current = segments.indexOf(segment);
    const step = ARROW_STEPS[event.key] as number | undefined;
    if (current < 0 || (step === undefined && event.key !== 'Home' && event.key !== 'End')) return;
    event.preventDefault();
    let next: UiSegment<T>;
    if (step === undefined) {
      next = event.key === 'Home' ? segments[0] : segments[segments.length - 1];
    } else {
      const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
      const rtl = horizontal && resolveDirection(this.host) === 'rtl';
      next = segments[(current + (rtl ? -step : step) + segments.length) % segments.length];
    }
    next.focus();
    if (!next.isChecked()) this.control.select(next.value());
  }

  /** Touched once focus leaves the control; the arrow keys move focus between its segments. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.host.contains(next)) this.notifyTouched();
  }
}

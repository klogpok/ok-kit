import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  signal,
} from '@angular/core';
import { Highlightable, _IdGenerator } from '@angular/cdk/a11y';
import { UiIcon, uiIconCheck, uiIconMinus } from '@vplans/ui-kit/icon';

/** An option as the list sees it; its required `value` may not be set yet. Internal. */
export interface UiOptionHandle {
  value(): unknown;
}

/**
 * What an option asks of the listbox it is in, and the one DI token through which options reach
 * it. The field provides the listbox controller as this token (`provideUiListbox()`). Internal.
 */
export abstract class UiListboxHost {
  /** Multiple selection: options show a checkbox. Read once, when an option is created. */
  abstract readonly multiple: boolean;
  abstract isSelected(value: unknown): boolean;
  /** Mixed state of the "select all" option. */
  abstract isIndeterminate(option: UiOptionHandle): boolean;
  abstract isFilteredOut(label: string, option: UiOptionHandle): boolean;
  /**
   * The option cannot be selected now, e.g. `maxSelections` is reached. Options are passed
   * whole: their required `value` may not be set yet when this runs.
   */
  abstract isBlocked(option: UiOptionHandle): boolean;
  /** The option renders an item that the key manager made active (`items` of the list). */
  abstract isActive(option: UiOptionHandle): boolean;
  /** The user clicked the option. */
  abstract selectOption(value: unknown): void;
}

/**
 * Option of a `ui-select`, `ui-multi-select` or `ui-autocomplete`. The projected text is the label; pass `label` when the content is
 * richer than the text that should appear in the trigger.
 *
 * Mark an icon or avatar with `uiOptionIcon` to show it before the label, and a second line with
 * `uiOptionDescription`. The description is not part of the label shown in the trigger.
 *
 * @example <ui-option [value]="plan.id">{{ plan.name }}</ui-option>
 * @example
 * <ui-option [value]="user.id">
 *   <ui-avatar uiOptionIcon size="sm" [name]="user.name" decorative />
 *   {{ user.name }}
 *   <span uiOptionDescription>{{ user.role }}</span>
 * </ui-option>
 */
@Component({
  selector: 'ui-option',
  imports: [UiIcon],
  template: `
    @if (multiple) {
      <span class="ui-option__checkbox" aria-hidden="true">
        @if (indeterminate()) {
          <ui-icon [icon]="mixedIcon" />
        } @else if (selected()) {
          <ui-icon [icon]="checkIcon" />
        }
      </span>
    }
    <span class="ui-option__icon"><ng-content select="[uiOptionIcon]" /></span>
    <span class="ui-option__text">
      <span class="ui-option__label"><ng-content /></span>
      <span class="ui-option__description"><ng-content select="[uiOptionDescription]" /></span>
    </span>
    @if (selected() && !multiple) {
      <ui-icon class="ui-option__check" [icon]="checkIcon" />
    }
  `,
  styleUrl: './option.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'option',
    class: 'ui-option',
    '[id]': 'optionId',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'unavailable() ? "true" : null',
    '[class.ui-option--active]': 'active()',
    '[class.ui-option--selected]': 'selected() || indeterminate()',
    '[class.ui-option--multiple]': 'multiple',
    '[class.ui-option--disabled]': 'unavailable()',
    '[hidden]': 'filteredOut()',
    '(click)': 'onClick()',
    // Keep focus on the trigger while clicking an option.
    '(mousedown)': '$event.preventDefault()',
  },
})
export class UiOption<T = unknown> implements Highlightable {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly parent = inject(UiListboxHost);

  readonly value = input.required<T>();
  readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
  /**
   * Text shown in the trigger and used for typeahead and search. Defaults to the content text,
   * which is tracked when it changes.
   */
  readonly label = input('');

  protected readonly optionId = inject(_IdGenerator).getId('ui-option-');
  protected readonly multiple = this.parent.multiple;
  /** Set by the key manager when the option itself is in it. */
  private readonly highlighted = signal(false);
  /** The option the keyboard is on (`aria-activedescendant` of the control). */
  protected readonly active = computed(() => this.highlighted() || this.parent.isActive(this));
  protected readonly selected = computed(() => this.parent.isSelected(this.value()));
  protected readonly indeterminate = computed(() => this.parent.isIndeterminate(this));
  protected readonly filteredOut = computed(() => this.parent.isFilteredOut(this.getLabel(), this));
  /** Disabled, or blocked by the list (e.g. `maxSelections` is reached). */
  protected readonly unavailable = computed(() => this.isDisabled() || this.parent.isBlocked(this));
  protected readonly checkIcon = uiIconCheck;
  protected readonly mixedIcon = uiIconMinus;
  /** Content text after the first DOM change; `null` until then (read live). */
  private readonly observedText = signal<string | null>(null);

  constructor() {
    // The content text is not a signal. Watch it so the trigger, search and typeahead follow
    // text changes such as a runtime language switch.
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => this.observedText.set(this.readText()));
      observer.observe(this.element, { childList: true, characterData: true, subtree: true });
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  /** Internal: the search of the list hides the option (memoized: the label may read the DOM). */
  ɵfilteredOut(): boolean {
    return this.filteredOut();
  }

  /** Internal: the list points `aria-activedescendant` at it. */
  get ɵid(): string {
    return this.optionId;
  }

  /** Internal: for the key manager of the list. Disabled, or blocked by the list. */
  get ɵdisabled(): boolean {
    return this.unavailable();
  }

  /**
   * The label. Public only because the typeahead of the CDK key manager calls it by this name
   * (`ListKeyManagerOption.getLabel`).
   */
  getLabel(): string {
    return this.label() || (this.observedText() ?? this.readText());
  }

  /** Text of the label slot, without the icon and the description. */
  private readText(): string {
    const label = this.element.querySelector('.ui-option__label') ?? this.element;
    return (label.textContent ?? '').trim();
  }

  setActiveStyles(): void {
    this.highlighted.set(true);
    // jsdom has no scrollIntoView.
    if ('scrollIntoView' in this.element) this.element.scrollIntoView({ block: 'nearest' });
  }

  setInactiveStyles(): void {
    this.highlighted.set(false);
  }

  protected onClick(): void {
    if (!this.unavailable()) this.parent.selectOption(this.value());
  }
}

/**
 * Labelled group of options.
 *
 * @example
 * <ui-option-group label="Tower A">
 *   <ui-option value="a1">Floor 1</ui-option>
 * </ui-option-group>
 */
@Component({
  selector: 'ui-option-group',
  template: `
    <div class="ui-option-group__label" role="presentation" [id]="labelId">{{ label() }}</div>
    <ng-content />
  `,
  styleUrl: './option.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    class: 'ui-option-group',
    '[attr.aria-labelledby]': 'labelId',
    '[hidden]': 'allFilteredOut()',
  },
})
export class UiOptionGroup {
  readonly label = input.required<string>();
  protected readonly labelId = inject(_IdGenerator).getId('ui-option-group-');
  private readonly options = contentChildren(UiOption);
  protected readonly allFilteredOut = computed(() => {
    const options = this.options();
    return options.length > 0 && options.every((option) => option.ɵfilteredOut());
  });
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  signal,
} from '@angular/core';
import { Highlightable, _IdGenerator } from '@angular/cdk/a11y';
import { UiIcon, uiIconCheck } from '@vplans/ui-kit/icon';

/** What an option needs from the list that owns it. Internal. */
export interface UiOptionParent {
  isSelected(value: unknown): boolean;
  isFilteredOut(label: string): boolean;
  selectOption(value: unknown): void;
}

export const UI_OPTION_PARENT = new InjectionToken<UiOptionParent>('UiOptionParent');

/**
 * Option of a `ui-select`. The projected text is the label; pass `label` when the content is
 * richer than the text that should appear in the trigger.
 *
 * @example <ui-option [value]="plan.id">{{ plan.name }}</ui-option>
 */
@Component({
  selector: 'ui-option',
  imports: [UiIcon],
  template: `
    <span class="ui-option__label"><ng-content /></span>
    @if (selected()) {
      <ui-icon class="ui-option__check" [icon]="checkIcon" />
    }
  `,
  styleUrl: './option.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'option',
    class: 'ui-option',
    '[id]': 'id',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[class.ui-option--active]': 'active()',
    '[class.ui-option--selected]': 'selected()',
    '[class.ui-option--disabled]': 'isDisabled()',
    '[hidden]': 'filteredOut()',
    '(click)': 'onClick()',
    // Keep focus on the trigger while clicking an option.
    '(mousedown)': '$event.preventDefault()',
  },
})
export class UiOption<T = unknown> implements Highlightable {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly parent = inject(UI_OPTION_PARENT);

  readonly value = input.required<T>();
  readonly isDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
  /** Text shown in the trigger and used for typeahead and search. Defaults to the content text. */
  readonly label = input('');

  readonly id = inject(_IdGenerator).getId('ui-option-');
  readonly active = signal(false);
  readonly selected = computed(() => this.parent.isSelected(this.value()));
  readonly filteredOut = computed(() => this.parent.isFilteredOut(this.getLabel()));
  protected readonly checkIcon = uiIconCheck;

  /** For the CDK key manager. */
  get disabled(): boolean {
    return this.isDisabled();
  }

  getLabel(): string {
    return this.label() || (this.element.textContent ?? '').trim();
  }

  setActiveStyles(): void {
    this.active.set(true);
    this.element.scrollIntoView?.({ block: 'nearest' });
  }

  setInactiveStyles(): void {
    this.active.set(false);
  }

  protected onClick(): void {
    if (!this.isDisabled()) this.parent.selectOption(this.value());
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
    return options.length > 0 && options.every((option) => option.filteredOut());
  });
}

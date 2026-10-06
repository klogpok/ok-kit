import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { UI_FORM_FIELD_CONTROL } from '@vplans/ui-kit/core';
import { ɵUiOptionPanel, ɵUiOptionParent } from '@vplans/ui-kit/select';
import { UiSpinner } from '@vplans/ui-kit/spinner';

/**
 * Text field with suggestions (WAI-ARIA combobox with list autocomplete). The suggestions are
 * `ui-option`s; focus stays in the field and the active option is exposed with
 * `aria-activedescendant`.
 *
 * - **Free text** (default): the value is the text in the field. Picking a suggestion sets the
 *   value to that option's value, a string.
 * - **Pick one** (`displayWith` set): the value is the picked option value, e.g. an object, or
 *   `null`. Typing only searches; text that was not turned into a pick is cleared when the
 *   field loses focus.
 *
 * Typing opens the list and filters the options by label; set `filterOptions="false"` and load
 * the options from `(searchChange)` for server-side search, with `loading` meanwhile.
 * ArrowDown/ArrowUp open the list and move (Alt+ArrowDown opens it without moving), Enter picks
 * the active option, Escape closes the list or clears the field, Tab closes the list.
 *
 * Implements `ControlValueAccessor`: bind it with `formControl`, `formControlName` or `ngModel`.
 *
 * @example
 * <ui-form-field label="City">
 *   <ui-autocomplete formControlName="city">
 *     @for (city of cities; track city) { <ui-option [value]="city">{{ city }}</ui-option> }
 *   </ui-autocomplete>
 * </ui-form-field>
 *
 * @example
 * <ui-autocomplete [(value)]="owner" [displayWith]="nameOf" [filterOptions]="false"
 *                  [loading]="searching()" (searchChange)="search($event)">
 *   @for (user of results(); track user.id) { <ui-option [value]="user">{{ user.name }}</ui-option> }
 * </ui-autocomplete>
 */
@Component({
  selector: 'ui-autocomplete',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, UiSpinner],
  template: `
    <div class="ui-autocomplete__field" cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <input
        #control
        type="text"
        role="combobox"
        class="ui-autocomplete__input"
        autocomplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        [id]="controlId()"
        [value]="text()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.name]="name() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-readonly]="readonly() ? 'true' : null"
        [attr.aria-expanded]="panelShown()"
        [attr.aria-controls]="panelShown() ? panelId() : null"
        [attr.aria-activedescendant]="panelShown() ? activeId() : null"
        [attr.aria-required]="isRequired() ? 'true' : null"
        [attr.aria-invalid]="showError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (click)="open()"
        (blur)="onBlur()"
      />
      @if (loading()) {
        <ui-spinner class="ui-autocomplete__spinner" size="sm" decorative />
      }
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="panelShown()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayMinWidth]="panelWidth()"
      (attach)="onAttach()"
      (detach)="close()"
      (overlayOutsideClick)="onOutsideClick($event)"
    >
      <!-- Options keep focus in the field: mousedown must not move it. -->
      <div
        role="listbox"
        class="ui-select__panel"
        [style.--_option-padding]="'var(--ui-control-padding-inline-' + size() + ')'"
        [style.--_option-font-size]="'var(--ui-control-font-size-' + size() + ')'"
        [id]="panelId()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="listLabelledBy()"
        [attr.aria-busy]="loading() ? 'true' : null"
        (mousedown)="$event.preventDefault()"
      >
        <ng-content />
        @if (loading()) {
          <div class="ui-select__empty ui-select__loading">
            <ui-spinner size="sm" decorative />
            {{ labels().loading }}
          </div>
        } @else if (noResults()) {
          <div class="ui-select__empty">{{ labels().noOptions }}</div>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiAutocomplete) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiAutocomplete), multi: true },
    ɵUiOptionParent,
  ],
  host: {
    class: 'ui-autocomplete',
    '[class]': '"ui-autocomplete--" + size()',
    '[class.ui-autocomplete--disabled]': 'isDisabled()',
    '[class.ui-autocomplete--readonly]': 'readonly()',
    '[class.ui-autocomplete--invalid]': 'showError()',
  },
})
export class UiAutocomplete<T = string> extends ɵUiOptionPanel<T, T | string | null> {
  readonly value = model<T | string | null>(null);
  readonly multiple = false;

  override readonly id = input(inject(_IdGenerator).getId('ui-autocomplete-'));
  readonly placeholder = input('');
  readonly name = input('');

  /** Emits the text as the user types, e.g. to load options from a server. */
  readonly searchChange = output<string>();

  /** Text typed since the last pick; it filters the options. */
  private readonly query = signal('');
  protected readonly filterText = this.query.asReadonly();
  /** A value must be picked from the options: `displayWith` is set. */
  private readonly pickOnly = computed(() => this.displayWith() !== null);

  /** The text in the field. Follows the value, and holds the typed text in between. */
  protected readonly text = linkedSignal(() => this.displayText(this.value()));

  /** The list is shown while it has options, a message after a search, or a spinner. */
  protected readonly panelShown = computed(
    () =>
      this.isOpen() &&
      (this.loading() || !this.noResults() || (this.pickOnly() && this.query().trim() !== '')),
  );

  protected override activateOnOpen(): boolean {
    return false;
  }

  protected isSelected(value: unknown): boolean {
    return this.matches(value, this.value());
  }

  protected selectOption(value: unknown): void {
    this.query.set('');
    this.setValue(value as T);
    this.text.set(this.displayText(value as T));
    this.close();
  }

  writeValue(value: T | string | null | undefined): void {
    this.query.set('');
    this.value.set(value ?? null);
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.searchChange.emit(text);
    if (!this.pickOnly()) this.setValue(text);
    else if (this.value() !== null) this.setValue(null);
    // After the value changed, so the typed text wins over the text of the value.
    this.text.set(text);
    this.open();
    this.keyManager.setActiveItem(-1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const { key } = event;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.open();
        if (event.altKey) return;
        if (key === 'ArrowDown') this.keyManager.setFirstItemActive();
        else this.keyManager.setLastItemActive();
        return;
      }
      if (key === 'ArrowUp' && event.altKey) {
        this.close();
        return;
      }
      this.keyManager.onKeydown(event);
    } else if ((key === 'PageDown' || key === 'PageUp') && this.isOpen()) {
      this.keyManager.onKeydown(event);
    } else if (key === 'Enter') {
      // Without an active option, Enter submits the form as usual.
      if (this.panelShown() && this.selectActive()) event.preventDefault();
    } else if (key === 'Escape') {
      if (this.panelShown()) {
        // Close only the list, not a surrounding dialog.
        event.preventDefault();
        event.stopPropagation();
        this.close();
      } else if (this.text() && !this.readonly()) {
        event.preventDefault();
        event.stopPropagation();
        this.clear();
      }
    } else if (key === 'Tab') {
      this.close();
    }
  }

  protected onBlur(): void {
    this.close();
    // A pick-only field keeps no text that did not become a value.
    if (this.pickOnly()) this.text.set(this.displayText(this.value()));
    this.query.set('');
    this.notifyTouched();
  }

  /** Empties the field and the value. */
  private clear(): void {
    this.query.set('');
    this.searchChange.emit('');
    this.setValue(this.pickOnly() ? null : '');
    this.text.set('');
  }

  private displayText(value: T | string | null): string {
    if (value == null) return '';
    const displayWith = this.displayWith();
    if (displayWith) return displayWith(value as T);
    return typeof value === 'string' ? value : this.labelFor(value);
  }

  private setValue(value: T | string | null): void {
    if (value === this.value()) return;
    this.value.set(value);
    this.notifyChange(value);
  }
}

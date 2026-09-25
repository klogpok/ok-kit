import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ActiveDescendantKeyManager, _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  resolveDirection,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconChevronDown } from '@vplans/ui-kit/icon';
import { UI_OPTION_PARENT, UiOption, UiOptionParent } from './option';

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/** Keys that navigate the list; in `searchable` mode all other keys edit the search text. */
const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

/**
 * Dropdown for picking one value from a list (WAI-ARIA combobox with a listbox popup).
 * Focus stays on the trigger; the active option is exposed with `aria-activedescendant`.
 *
 * - Closed: ArrowDown/ArrowUp/Enter/Space open the list; typing jumps to a matching option.
 * - Open: arrows, Home/End and PageUp/PageDown move, Enter (or Space) selects, Escape and Tab close.
 * - `searchable` turns the trigger into a text input that filters the options by label.
 *   Listen to `searchChange` and set `filterOptions="false"` to filter on the server instead.
 *
 * Implements `FormValueControl` (Signal Forms) and `ControlValueAccessor`.
 *
 * @example
 * <ui-form-field label="Coordinator">
 *   <ui-select [formField]="form.coordinator" placeholder="Choose">
 *     @for (c of coordinators; track c.id) {
 *       <ui-option [value]="c.id">{{ c.name }}</ui-option>
 *     }
 *   </ui-select>
 * </ui-form-field>
 */
@Component({
  selector: 'ui-select',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, UiIcon],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiSelect) },
    { provide: UI_OPTION_PARENT, useExisting: forwardRef(() => UiSelect) },
  ],
  host: {
    class: 'ui-select',
    '[class]': '"ui-select--" + size()',
    '[class.ui-select--open]': 'isOpen()',
    '[class.ui-select--disabled]': 'isDisabled()',
    '[class.ui-select--invalid]': 'showError()',
    '[attr.id]': 'id()',
  },
})
export class UiSelect<T = unknown>
  extends UiFormControlBase<T | null>
  implements UiFormFieldControl, UiOptionParent
{
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  protected readonly labels = inject(UI_LABELS);

  readonly value = model<T | null>(null);
  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  readonly name = input('');
  /** Host id; the trigger gets `${id}-control`. */
  readonly id = input(inject(_IdGenerator).getId('ui-select-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });
  /** Type in the trigger to filter the options. */
  readonly searchable = input(false, { transform: booleanAttribute });
  /** Hide options whose label does not contain the search text. Turn off for server-side search. */
  readonly filterOptions = input(true, { transform: booleanAttribute });
  /** Compares option values with the selected value, e.g. by id for objects. */
  readonly compareWith = input<(a: unknown, b: unknown) => boolean>(Object.is);

  readonly opened = output<void>();
  readonly closed = output<void>();
  /** Emits the search text as the user types (`searchable` only). */
  readonly searchChange = output<string>();

  protected readonly options = contentChildren<UiOption<T>>(UiOption, { descendants: true });
  private readonly control = viewChild.required<ElementRef<HTMLElement>>('control');
  private readonly overlay = viewChild(CdkConnectedOverlay);

  protected readonly isOpen = signal(false);
  protected readonly query = signal('');
  protected readonly activeId = signal<string | null>(null);
  protected readonly panelWidth = signal(0);
  protected readonly positions = POSITIONS;
  protected readonly chevron = uiIconChevronDown;

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-control`);
  protected readonly panelId = computed(() => `${this.id()}-listbox`);

  protected readonly selectedOption = computed(() =>
    this.options().find((option) => this.isSelected(option.value())),
  );
  protected readonly displayLabel = computed(() => this.selectedOption()?.getLabel() ?? '');
  protected readonly listLabelledBy = computed(() =>
    this.ariaLabel() ? null : (this.formField?.labelledBy() ?? null),
  );
  protected readonly noResults = computed(() =>
    this.options().every((option) => option.filteredOut()),
  );

  private readonly keyManager = new ActiveDescendantKeyManager<UiOption<T>>(
    this.options,
    this.injector,
  )
    .withVerticalOrientation()
    .withHomeAndEnd()
    .withPageUpDown()
    .withTypeAhead()
    .skipPredicate((option) => option.disabled || option.filteredOut());

  constructor() {
    super();
    this.keyManager.change.subscribe(() =>
      this.activeId.set(this.keyManager.activeItem?.id ?? null),
    );
  }

  // --- UiOptionParent -------------------------------------------------------------------

  isSelected(value: unknown): boolean {
    return this.compareWith()(value, this.value());
  }

  isFilteredOut(label: string): boolean {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query || !this.searchable() || !this.filterOptions()) return false;
    return !label.toLocaleLowerCase().includes(query);
  }

  selectOption(value: unknown): void {
    this.value.set(value as T);
    this.notifyChange(value as T);
    this.close();
  }

  // --- Public API -----------------------------------------------------------------------

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? null);
  }

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  open(): void {
    if (this.isOpen() || this.isDisabled()) return;
    this.panelWidth.set(this.host.getBoundingClientRect().width);
    this.isOpen.set(true);
    this.opened.emit();
    // Activate the selected option (or the first one) once the list is rendered.
    afterNextRender(() => this.activateSelected(), { injector: this.injector });
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.query.set('');
    this.keyManager.setActiveItem(-1);
    this.closed.emit();
  }

  // --- Template handlers ----------------------------------------------------------------

  protected toggle(): void {
    if (this.isOpen() && !this.searchable()) this.close();
    else this.open();
    this.focus();
  }

  protected onAttach(): void {
    // The CDK reads the direction once; follow runtime `dir` changes.
    this.overlay()?.overlayRef?.setDirection(resolveDirection(this.host));
  }

  /** Keeps focus on the control when the chevron or padding of the trigger is pressed. */
  protected onTriggerMousedown(event: MouseEvent): void {
    if (event.target !== this.control().nativeElement) event.preventDefault();
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.contains(event.target as Node)) this.close();
  }

  protected onBlur(): void {
    this.close();
    this.notifyTouched();
  }

  protected onSearch(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.searchChange.emit(text);
    this.open();
    this.keyManager.setFirstItemActive();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const { key } = event;
    const searchable = this.searchable();

    if (!this.isOpen()) {
      const opens =
        key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || (key === ' ' && !searchable);
      if (opens) {
        event.preventDefault();
        this.open();
      } else if (!searchable && key.length === 1 && !event.ctrlKey && !event.metaKey) {
        // Typeahead on a closed select opens it at the matching option.
        this.open();
        this.keyManager.onKeydown(event);
      }
      return;
    }

    if (key === 'Escape') {
      // Close only the list, not a surrounding dialog.
      event.preventDefault();
      event.stopPropagation();
      this.close();
    } else if (key === 'Enter' || (key === ' ' && !searchable)) {
      // Also stops the button from turning Space into a click.
      event.preventDefault();
      if (key === ' ' && this.keyManager.isTyping()) {
        this.keyManager.onKeydown(event);
        return;
      }
      const active = this.keyManager.activeItem;
      if (active && !active.disabled) this.selectOption(active.value());
    } else if (key === 'ArrowUp' && event.altKey) {
      event.preventDefault();
      this.close();
    } else if (key === 'Tab') {
      this.close();
    } else if (!searchable || NAVIGATION_KEYS.has(key)) {
      this.keyManager.onKeydown(event);
    }
  }

  private activateSelected(): void {
    // Keys pressed before the list rendered have already moved the active option.
    if (this.keyManager.activeItem) return;
    const selected = this.options().findIndex(
      (option) => option === this.selectedOption() && !option.disabled,
    );
    if (selected >= 0) this.keyManager.setActiveItem(selected);
    else this.keyManager.setFirstItemActive();
  }
}

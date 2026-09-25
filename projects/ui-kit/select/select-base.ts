import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  Signal,
  WritableSignal,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  linkedSignal,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActiveDescendantKeyManager, _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';
import {
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  resolveDirection,
} from '@vplans/ui-kit/core';
import { uiIconChevronDown } from '@vplans/ui-kit/icon';
import { UiOption, UiOptionParent } from './option';

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/** Keys that navigate the list; in `searchable` mode all other keys edit the search text. */
const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

/**
 * Shared behavior of `ui-select` and `ui-multi-select`: the combobox trigger, the listbox
 * overlay, keyboard handling, search and forms integration. Internal.
 *
 * Subclasses declare the `value` model and decide what selecting an option does.
 */
@Directive({
  host: {
    '[class]': '"ui-select--" + size()',
    '[class.ui-select--open]': 'isOpen()',
    '[class.ui-select--disabled]': 'isDisabled()',
    '[class.ui-select--readonly]': 'readonly()',
    '[class.ui-select--invalid]': 'showError()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export abstract class UiSelectBase<T, V>
  extends UiFormControlBase<V>
  implements UiFormFieldControl
{
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly injector = inject(Injector);
  protected readonly labels = inject(UI_LABELS);

  abstract readonly value: WritableSignal<V>;
  abstract readonly multiple: boolean;

  readonly placeholder = input('');
  readonly size = input<UiSize>('md');
  /** `name` of the trigger button. The search field of a `searchable` select has none. */
  readonly name = input('');
  /** Host id; the trigger gets `${id}-control`. */
  readonly id = input(inject(_IdGenerator).getId('ui-select-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });
  /** Type in the trigger to filter the options. */
  readonly searchable = input(false, { transform: booleanAttribute });
  /** Hide options whose label does not contain the search text. Turn off for server-side search. */
  readonly filterOptions = input(true, { transform: booleanAttribute });
  /**
   * Compares an option value with a selected value, e.g. by id for objects. Called as
   * `compareWith(option, selected)` and never with `null`: a `null` value matches only `null`.
   */
  readonly compareWith = input<(option: T, selected: T) => boolean>(Object.is);

  /**
   * Label of a selected value that is not among the options and was never shown in the list,
   * e.g. an initial value before server-side search results arrive.
   */
  readonly displayWith = input<((value: T) => string) | null>(null);

  readonly opened = output();
  readonly closed = output();
  /**
   * Emits the search text as the user types (`searchable` only), and `''` when the list closes
   * with a search, so server-side results can be reset.
   */
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

  /** The selected options in list order. */
  protected readonly selectedOptions = computed(() =>
    this.options().filter((option) => this.isSelected(option.value())),
  );
  /** Text of the trigger. */
  protected abstract readonly displayLabel: Signal<string>;
  protected readonly listLabelledBy = computed(() =>
    this.ariaLabel() ? null : (this.formField?.labelledBy() ?? null),
  );
  /** Labels of selected values seen in the list, kept while the options change. */
  private readonly knownLabels = linkedSignal<
    readonly (readonly [unknown, string])[],
    readonly (readonly [unknown, string])[]
  >({
    source: () =>
      this.selectedOptions().map((option) => [option.value(), option.getLabel()] as const),
    computation: (seen, previous) => {
      const kept = (previous?.value ?? []).filter(
        ([value]) => this.isSelected(value) && !seen.some(([shown]) => this.matches(shown, value)),
      );
      return [...kept, ...seen];
    },
  });
  protected readonly noResults = computed(() =>
    this.options().every((option) => option.filteredOut()),
  );

  protected readonly keyManager = new ActiveDescendantKeyManager<UiOption<T>>(
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
    inject(UiOptionParent).connect({
      multiple: () => this.multiple,
      isSelected: (value) => this.isSelected(value),
      isFilteredOut: (label) => this.isFilteredOut(label),
      selectOption: (value) => this.pick(value),
    });
    this.keyManager.change.subscribe(() =>
      this.activeId.set(this.keyManager.activeItem?.id ?? null),
    );
    // A list opened before the control became readonly or disabled must not stay open.
    effect(() => {
      if (this.readonly() || this.isDisabled()) untracked(() => this.close());
    });
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
    // The key manager keeps an active option that was removed (e.g. new server-side results).
    effect(() => {
      const options = this.options();
      untracked(() => {
        const active = this.keyManager.activeItem;
        if (!active || options.includes(active)) return;
        this.keyManager.setActiveItem(-1);
        this.activeId.set(null);
        if (this.isOpen()) this.keyManager.setFirstItemActive();
      });
    });
  }

  // --- Options --------------------------------------------------------------------------

  protected abstract isSelected(value: unknown): boolean;
  protected abstract selectOption(value: unknown): void;

  /** Whether an option value equals a selected value, through `compareWith`. */
  protected matches(option: unknown, selected: unknown): boolean {
    return option == null || selected == null
      ? option === selected
      : this.compareWith()(option as T, selected as T);
  }

  /** Label of a selected value: from its option, from the list before it changed, or `displayWith`. */
  protected labelFor(value: unknown): string {
    // Read every time, so the labels are recorded before their options go away.
    const known = this.knownLabels();
    const option = this.options().find((item) => this.matches(item.value(), value));
    if (option) return option.getLabel();
    const label = known.find(([shown]) => this.matches(shown, value));
    if (label) return label[1];
    const displayWith = this.displayWith();
    return value != null && displayWith ? displayWith(value as T) : '';
  }

  protected isFilteredOut(label: string): boolean {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query || !this.searchable() || !this.filterOptions()) return false;
    return !label.toLocaleLowerCase().includes(query);
  }

  // --- Public API -----------------------------------------------------------------------

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  open(): void {
    if (this.isOpen() || this.isDisabled() || this.readonly()) return;
    this.panelWidth.set(this.host.getBoundingClientRect().width);
    this.isOpen.set(true);
    this.opened.emit();
    // Activate the selected option (or the first one) once the list is rendered.
    afterNextRender(() => this.activateSelected(), { injector: this.injector });
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    if (this.query()) {
      this.query.set('');
      this.searchChange.emit('');
    }
    this.keyManager.setActiveItem(-1);
    this.closed.emit();
  }

  // --- Template handlers ----------------------------------------------------------------

  protected toggle(event: MouseEvent): void {
    // Clicks in the search text keep the list open; the chevron always toggles it.
    const onChevron = !!(event.target as Element).closest('.ui-select__chevron');
    if (this.isOpen() && (!this.searchable() || onChevron)) this.close();
    else this.open();
    this.focus();
  }

  protected onAttach(): void {
    // The CDK reads the direction once; follow runtime `dir` changes.
    this.overlay()?.overlayRef.setDirection(resolveDirection(this.host));
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
      } else if (key === 'Home' || key === 'End') {
        // APG: open the list at the first or last option.
        event.preventDefault();
        this.open();
        if (key === 'Home') this.keyManager.setFirstItemActive();
        else this.keyManager.setLastItemActive();
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
      if (active && !active.disabled) this.pick(active.value());
    } else if (key === 'ArrowUp' && event.altKey) {
      event.preventDefault();
      this.close();
    } else if (key === 'Tab') {
      this.close();
    } else if (!searchable || NAVIGATION_KEYS.has(key)) {
      this.keyManager.onKeydown(event);
    }
  }

  /** Selects an option the user chose, unless the value cannot change. */
  private pick(value: unknown): void {
    if (this.readonly() || this.isDisabled()) return;
    // Server-side search may replace the options in the same tick (closing resets the search).
    const option = this.options().find((item) => this.matches(item.value(), value));
    if (option) this.knownLabels.update((known) => [...known, [value, option.getLabel()]]);
    this.selectOption(value);
  }

  private activateSelected(): void {
    // Keys pressed before the list rendered have already moved the active option.
    if (this.keyManager.activeItem) return;
    const first = this.selectedOptions().find((option) => !option.disabled);
    const index = first ? this.options().indexOf(first) : -1;
    if (index >= 0) this.keyManager.setActiveItem(index);
    else this.keyManager.setFirstItemActive();
  }
}

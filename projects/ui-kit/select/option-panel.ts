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
  input,
  linkedSignal,
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
import { UiOption, UiOptionParent } from './option';

const POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/**
 * Shared behavior of the controls with a list of `ui-option`s in an overlay (`ui-select`,
 * `ui-multi-select`, `ui-autocomplete`): the listbox overlay, the active option
 * (`aria-activedescendant`), filtering, labels of selected values and forms integration.
 * Internal: exported for the kit's own entry points only.
 *
 * Subclasses declare the `value` model, render the control (`#control`) and the overlay, and
 * decide what selecting an option does.
 */
@Directive({
  host: {
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export abstract class UiOptionPanel<T, V>
  extends UiFormControlBase<V>
  implements UiFormFieldControl
{
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly injector = inject(Injector);
  protected readonly labels = inject(UI_LABELS);

  abstract readonly value: WritableSignal<V>;
  abstract readonly multiple: boolean;

  readonly size = input<UiSize>('md');
  /** Host id; the control gets `${id}-control`. */
  readonly id = input(inject(_IdGenerator).getId('ui-select-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });
  /**
   * Options are loading (e.g. server-side search): a spinner is shown and the list is marked
   * busy.
   */
  readonly loading = input(false, { transform: booleanAttribute });
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

  protected readonly options = contentChildren<UiOption<T>>(UiOption, { descendants: true });
  protected readonly control = viewChild.required<ElementRef<HTMLElement>>('control');
  private readonly overlay = viewChild(CdkConnectedOverlay);

  protected readonly isOpen = signal(false);
  protected readonly activeId = signal<string | null>(null);
  protected readonly panelWidth = signal(0);
  protected readonly positions = POSITIONS;

  readonly labelStrategy = 'for' as const;
  readonly controlId = computed(() => `${this.id()}-control`);
  protected readonly panelId = computed(() => `${this.id()}-listbox`);

  /** Text that filters the options (with `filterOptions`); `''` shows them all. */
  protected abstract readonly filterText: Signal<string>;

  /** The selected options in list order. */
  protected readonly selectedOptions = computed(() =>
    this.options().filter((option) => this.isSelected(option.value())),
  );
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
  protected readonly noResults = computed(
    () => !this.loading() && this.options().every((option) => option.filteredOut()),
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
        if (this.isOpen() && this.activateOnOpen()) this.keyManager.setFirstItemActive();
      });
    });
  }

  // --- Options --------------------------------------------------------------------------

  protected abstract isSelected(value: unknown): boolean;
  protected abstract selectOption(value: unknown): void;

  /**
   * Whether opening the list activates an option (the selected one or the first one). An
   * autocomplete leaves the list without an active option until the user moves to one.
   */
  protected activateOnOpen(): boolean {
    return true;
  }

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
    const query = this.filterText().trim().toLocaleLowerCase();
    if (!query || !this.filterOptions()) return false;
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
    if (this.activateOnOpen()) {
      afterNextRender(() => this.activateSelected(), { injector: this.injector });
    }
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.keyManager.setActiveItem(-1);
    this.activeId.set(null);
    this.closed.emit();
  }

  // --- Template handlers ----------------------------------------------------------------

  protected onAttach(): void {
    // The CDK reads the direction once; follow runtime `dir` changes.
    this.overlay()?.overlayRef.setDirection(resolveDirection(this.host));
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.contains(event.target as Node)) this.close();
  }

  /** Selects the active option, if there is one that can be selected. Returns whether it did. */
  protected selectActive(): boolean {
    const active = this.keyManager.activeItem;
    if (!active || active.disabled) return false;
    this.pick(active.value());
    return true;
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

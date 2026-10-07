import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  Signal,
  WritableSignal,
  afterEveryRender,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ActiveDescendantKeyManager, Highlightable, _IdGenerator } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, ConnectedPosition } from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
  UiSize,
  overlayOffsetX,
  resolveDirection,
} from '@vplans/ui-kit/core';
import { UiOption, UiOptionHandle, UiOptionOwner, UiOptionParent } from './option';
import { UiItemEntry, UiItemEntryOwner, UiItemOption, UiOptionItem } from './option-items';

/** An option of the list: a projected `ui-option` or an entry of `items`. Internal. */
export interface UiListEntry<T> extends Highlightable, UiOptionHandle {
  value(): T;
  getLabel(): string;
  /** Disabled by the app, not blocked by the list. */
  isDisabled(): boolean;
  filteredOut(): boolean;
  /** For the key manager: disabled or blocked. */
  readonly disabled: boolean;
}

/** Height of an item option until a rendered one is measured. */
const DEFAULT_ITEM_SIZE = 32;

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
 * The options are projected `ui-option`s or, with `items`, data that the control renders itself:
 * in a virtual scroll viewport once there are `virtualThreshold` items. The key manager then
 * moves through entries of the data, so the keyboard reaches options that are not rendered, and
 * `aria-activedescendant` names the active option once it is rendered.
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

  /**
   * The options as data, instead of projected `ui-option`s. Projected options are ignored while
   * it is set (`[]` is an empty list).
   */
  readonly items = input<readonly UiOptionItem<T>[] | null>(null);
  /**
   * From this many `items` on, the list renders only the options in view (a virtual scroll
   * viewport). The options must then all have the same height.
   */
  readonly virtualThreshold = input(100, { transform: numberAttribute });

  readonly opened = output();
  readonly closed = output();

  /** The projected options. */
  private readonly contentOptions = contentChildren<UiOption<T>>(UiOption, { descendants: true });
  /**
   * Options of the control's own template that the keyboard reaches ("select all"); listed
   * before the app's options. The options that render `items` are not among them.
   */
  private readonly ownOptions = viewChildren<UiOption<T>>('selectAllOption');
  /** The rendered options of `items`. */
  private readonly itemOptions = viewChildren<UiItemOption<T>>(UiItemOption);
  /** What the options and the entries of `items` ask of the list. */
  private readonly owner: UiOptionOwner & UiItemEntryOwner = {
    multiple: () => this.multiple,
    isSelected: (value) => this.isSelected(value),
    isIndeterminate: (option) => this.isIndeterminate(option),
    isFilteredOut: (label, option) => this.isFilteredOut(label, option),
    isBlocked: (option) => this.isBlocked(option),
    isActive: (option) => this.isActiveItem(option),
    selectOption: (value) => this.pick(value),
    reveal: (entry) => this.reveal(entry as UiItemEntry<T>),
  };
  private readonly itemEntries = computed(() =>
    (this.items() ?? []).map((item) => new UiItemEntry<T>(item, this.owner)),
  );
  /** Every option of the list, shown or filtered out. */
  protected readonly options: Signal<readonly UiListEntry<T>[]> = computed(() =>
    this.items() ? this.itemEntries() : this.contentOptions(),
  );
  /** The `items` the search shows; the control renders these. */
  protected readonly visibleItems = computed(() =>
    this.itemEntries().filter((entry) => !entry.filteredOut()),
  );
  /** Every option the keyboard moves through. */
  private readonly listOptions = computed((): readonly UiListEntry<T>[] => [
    ...this.ownOptions(),
    ...(this.items() ? this.visibleItems() : this.contentOptions()),
  ]);
  /** Render the `items` in a virtual scroll viewport. */
  protected readonly virtual = computed(
    () => (this.items()?.length ?? 0) >= this.virtualThreshold(),
  );
  /** Height of one item option in the viewport, in pixels. */
  protected readonly itemSize = signal(DEFAULT_ITEM_SIZE);
  private readonly viewport = viewChild(CdkVirtualScrollViewport);
  /** An item to scroll to once the viewport has sized its content. */
  private pendingReveal: UiItemEntry<T> | null = null;
  protected readonly control = viewChild.required<ElementRef<HTMLElement>>('control');
  private readonly overlay = viewChild(CdkConnectedOverlay);

  protected readonly isOpen = signal(false);
  private readonly activeEntry = signal<UiListEntry<T> | null>(null);
  /** Id of the active option; `null` while an active item is not rendered. */
  protected readonly activeId = computed(() => {
    const entry = this.activeEntry();
    if (entry instanceof UiOption) return entry.id;
    if (!entry) return null;
    return this.itemOptions().find((rendered) => rendered.entry() === entry)?.option.id ?? null;
  });
  protected readonly panelWidth = signal(0);
  protected readonly panelOffsetX = signal(0);
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

  protected readonly keyManager = new ActiveDescendantKeyManager<UiListEntry<T>>(
    this.listOptions,
    this.injector,
  )
    .withVerticalOrientation()
    .withHomeAndEnd()
    .withPageUpDown()
    .withTypeAhead()
    .skipPredicate((option) => option.disabled || option.filteredOut());

  constructor() {
    super();
    inject(UiOptionParent).connect(this.owner);
    this.keyManager.change.subscribe(() => this.activeEntry.set(this.keyManager.activeItem));
    // A list opened before the control became readonly or disabled must not stay open.
    effect(() => {
      if (this.readonly() || this.isDisabled()) untracked(() => this.close());
    });
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
    // The key manager keeps an active option that was removed (e.g. new server-side results).
    effect(() => {
      const options = this.listOptions();
      untracked(() => {
        const active = this.keyManager.activeItem;
        if (!active || options.includes(active)) return;
        this.keyManager.setActiveItem(-1);
        this.activeEntry.set(null);
        if (this.isOpen() && this.activateOnOpen()) this.keyManager.setFirstItemActive();
      });
    });
    // The viewport needs the height of an option in pixels; it depends on the font size and on a
    // description line, so measure a rendered one.
    afterRenderEffect({
      read: () => {
        const rendered = this.itemOptions().length > 0;
        const option = rendered
          ? this.viewport()?.elementRef.nativeElement.querySelector('.ui-option')
          : null;
        const height = option?.getBoundingClientRect().height ?? 0;
        if (height > 0 && height !== untracked(this.itemSize)) {
          this.itemSize.set(height);
          // An item made active before the measure was scrolled to with the old size.
          const active = untracked(this.activeEntry);
          if (active instanceof UiItemEntry) this.pendingReveal = active;
        }
      },
    });
    afterEveryRender(() => {
      if (this.pendingReveal) this.reveal(this.pendingReveal);
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

  /** Mixed state of an option (only "select all" of `ui-multi-select`). */
  protected readonly isIndeterminate: (option: UiOptionHandle) => boolean = () => false;
  /** Whether an option cannot be selected now (`maxSelections` of `ui-multi-select`). */
  protected readonly isBlocked: (option: UiOptionHandle) => boolean = () => false;
  /** An option the search never hides ("select all"). */
  protected readonly alwaysShown: (option: UiOptionHandle) => boolean = () => false;

  protected isFilteredOut(label: string, option: UiOptionHandle): boolean {
    const query = this.filterText().trim().toLocaleLowerCase();
    if (!query || !this.filterOptions() || this.alwaysShown(option)) return false;
    return !label.toLocaleLowerCase().includes(query);
  }

  /** Whether a rendered option shows the active entry of `items`. */
  private isActiveItem(option: UiOptionHandle): boolean {
    const entry = this.activeEntry();
    return (
      entry instanceof UiItemEntry &&
      this.itemOptions().some(
        (rendered) => rendered.option === option && rendered.entry() === entry,
      )
    );
  }

  // --- Public API -----------------------------------------------------------------------

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  open(): void {
    this.openList(true);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.keyManager.setActiveItem(-1);
    this.activeEntry.set(null);
    this.pendingReveal = null;
    this.closed.emit();
  }

  /**
   * Opens the list and activates the selected option once it is rendered. Without a selected
   * one, `activateFirst` activates the first option; a click leaves the list without an active
   * option so the first one does not look selected.
   */
  protected openList(activateFirst: boolean): void {
    if (this.isOpen() || this.isDisabled() || this.readonly()) return;
    this.panelWidth.set(this.host.getBoundingClientRect().width);
    this.panelOffsetX.set(overlayOffsetX(this.host.ownerDocument));
    this.isOpen.set(true);
    this.opened.emit();
    if (this.activateOnOpen()) {
      afterNextRender(() => this.activateSelected(activateFirst), { injector: this.injector });
    }
  }

  // --- Template handlers ----------------------------------------------------------------

  protected onAttach(): void {
    // The CDK reads the direction once; follow runtime `dir` changes.
    this.overlay()?.overlayRef.setDirection(resolveDirection(this.host));
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!this.host.contains(event.target as Node)) this.close();
  }

  /** Keeps the rendered options of `items` when the viewport recycles their views. */
  protected readonly trackEntry = (_index: number, entry: UiItemEntry<T>): UiItemEntry<T> => entry;

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

  private activateSelected(activateFirst: boolean): void {
    // Keys pressed before the list rendered have already moved the active option.
    if (this.keyManager.activeItem) return;
    const first = this.selectedOptions().find((option) => !option.disabled);
    const index = first ? this.listOptions().indexOf(first) : -1;
    if (index >= 0) this.keyManager.setActiveItem(index);
    else if (activateFirst) this.keyManager.setFirstItemActive();
  }

  /** Scrolls an active item into view; in the viewport it may not be rendered yet. */
  private reveal(entry: UiItemEntry<T>): void {
    const viewport = this.viewport();
    // A key that opens the list (End) activates an item before the viewport is rendered.
    if (!viewport && this.virtual()) {
      this.pendingReveal = entry;
      return;
    }
    if (!viewport) {
      afterNextRender(
        () => {
          const id = this.activeId();
          const element = id ? document.getElementById(id) : null;
          // jsdom has no scrollIntoView.
          if (element && 'scrollIntoView' in element) element.scrollIntoView({ block: 'nearest' });
        },
        { injector: this.injector },
      );
      return;
    }
    this.pendingReveal = null;
    const index = this.visibleItems().indexOf(entry);
    if (index < 0) return;
    const size = this.itemSize();
    // The listbox scrolls (`cdkVirtualScrollingElement`). Offsets are in its coordinates: the
    // viewport starts `top` below its start, under "select all", which sticks over the rows.
    const scroller = viewport.scrollable.getElementRef().nativeElement;
    const top = viewport.measureViewportOffset('top');
    const start = top + index * size;
    const end = start + size;
    const offset = scroller.scrollTop;
    const height = scroller.clientHeight;
    // Right after the list opens the listbox has no size yet, or the viewport has not sized its
    // content, and the browser would cut the scroll short. Try again after a render; without a
    // size, scroll now too (jsdom never lays out).
    if (height === 0 || scroller.scrollHeight < end) {
      this.pendingReveal = entry;
      if (height > 0) return;
    }
    if (start < offset + top || height === 0) {
      if (start - top !== offset) viewport.scrollToOffset(start - top);
    } else if (end > offset + height) {
      viewport.scrollToOffset(end - height);
    }
  }
}

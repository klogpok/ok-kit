import {
  DestroyRef,
  Injectable,
  Injector,
  type Provider,
  Signal,
  afterEveryRender,
  afterNextRender,
  afterRenderEffect,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { UiListboxHost, UiOption, UiOptionHandle } from './option';
import { UiItemEntry, UiItemEntryOwner, UiItemOption, UiOptionItem } from './option-items';

/**
 * How the field takes keys:
 * - `trigger`: a button. Space and Enter open and select, letters jump to an option (typeahead),
 *   Home/End move in the open list.
 * - `searchable`: a text field that filters the list (`ui-select` with `searchable`). Space,
 *   letters and Home/End edit the text.
 * - `freeText`: a text field whose text is a value too (`ui-autocomplete`, `ui-time-input`).
 *   Enter without an active option and Escape on a hidden list are left to the field.
 */
export type UiListboxMode = 'trigger' | 'searchable' | 'freeText';

/** An option of the list: a projected `ui-option` or an entry of `items`. Internal. */
export interface UiListEntry<T = unknown> extends Highlightable, UiOptionHandle {
  value(): T;
  getLabel(): string;
  /** Disabled by the app, not blocked by the list. */
  isDisabled(): boolean;
  /** For the key manager: disabled or blocked. */
  readonly ɵdisabled: boolean;
  /** The search hides it. */
  ɵfilteredOut(): boolean;
}

/**
 * What the field gives its listbox. Values that change are functions (signals or inputs fit);
 * the rest are callbacks into the field.
 */
export interface UiListboxConfig<T> {
  readonly mode: () => UiListboxMode;
  /** Id of the field; the listbox gets `${id}-listbox`. */
  readonly id: () => string;
  /** Multiple selection: options show a checkbox and Enter keeps the list open. */
  readonly multiple?: boolean;
  /**
   * The field's projected options, from `contentChildren(UiOption, { descendants: true })`. A
   * query is the field's own: signal queries exist only as fields of a directive class.
   */
  readonly contentOptions?: Signal<readonly UiOption<T>[]>;
  /**
   * Options of the field's own template that the keyboard reaches first ("select all"), from
   * `viewChildren`. Render them in `ui-listbox` with the `uiListboxLeading` attribute.
   */
  readonly leadingOptions?: Signal<readonly UiOption<T>[]>;
  /** The options as data; while set, projected options are ignored (`[]` is an empty list). */
  readonly items?: () => readonly UiOptionItem<T>[] | null | undefined;
  /** Text that filters the options; `''` shows them all. */
  readonly filterText?: () => string;
  /** Off for server-side search. Default on. */
  readonly filterOptions?: () => boolean;
  /** `compareWith(option, selected)`, never called with `null`. Default `Object.is`. */
  readonly compareWith?: () => (option: T, selected: T) => boolean;
  /** Label of a selected value that never was in the list. */
  readonly displayWith?: () => ((value: T) => string) | null;
  /** From this many `items` on, they render in a virtual scroll viewport. Default 100. */
  readonly virtualThreshold?: () => number;
  readonly loading?: () => boolean;
  /** The value cannot change (disabled or readonly): the list closes and picks nothing. */
  readonly locked?: () => boolean;
  /**
   * An open list with no options still shows (its "no options" row). Default true. While it
   * does not, `shown()` is false and the keys act as on a closed list.
   */
  readonly showEmpty?: () => boolean;

  /** Whether an option value is selected. */
  isSelected(value: unknown): boolean;
  /** The user picked an option (click, Enter, Space). The field decides whether to close. */
  select(value: unknown): void;
  /**
   * Whether opening the list makes an option active. Default true. Without it (autocomplete)
   * ArrowDown/ArrowUp on a closed list start at the first or last option.
   */
  readonly activateOnOpen?: () => boolean;
  /**
   * Value of the option that opening the list makes active (time: the nearest slot). Without
   * one (`null`): the first selected option that can be picked, else the first option.
   */
  readonly openAt?: () => unknown;
  /** The option cannot be picked now (`maxSelections`). */
  readonly isBlocked?: (option: UiOptionHandle) => boolean;
  /** The search never hides the option ("select all"). */
  readonly alwaysShown?: (option: UiOptionHandle) => boolean;
  /** Mixed state of an option ("select all"). */
  readonly isIndeterminate?: (option: UiOptionHandle) => boolean;
  /** Called after the list opened or closed, e.g. to emit the field's outputs. */
  readonly opened?: () => void;
  readonly closed?: () => void;
}

/** What `ui-listbox` gives the controller while it is rendered. Internal. */
export interface UiListboxView<T> {
  readonly itemOptions: Signal<readonly UiItemOption<T>[]>;
  readonly viewport: Signal<CdkVirtualScrollViewport | undefined>;
}

/** Height of an item option until a rendered one is measured. */
const DEFAULT_ITEM_SIZE = 32;

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp']);

/**
 * The popup listbox of a field: its options (projected `ui-option`s or `items`), the search
 * filter, the virtual scroll of long `items`, the active option (`aria-activedescendant`) and
 * the keyboard. The field keeps the focus, the value and the dropdown panel; it renders
 * `ui-listbox` inside `uiDropdownPanel` and calls `handleKeydown()` from its control.
 *
 * Create it with `injectListbox()` in the field and provide it with `provideUiListbox()`.
 * Internal.
 */
@Injectable()
export class UiListbox<T = unknown> extends UiListboxHost {
  private readonly injector = inject(Injector);
  /** A signal: computeds read before the field configures the listbox must update. */
  private readonly config = signal<UiListboxConfig<T> | null>(null);

  private get cfg(): UiListboxConfig<T> {
    const config = this.config();
    if (!config) throw new Error('UiListbox: call injectListbox() in the field.');
    return config;
  }

  get multiple(): boolean {
    return this.config()?.multiple ?? false;
  }

  private readonly view = signal<UiListboxView<T> | null>(null);
  private readonly itemOptions = computed(() => this.view()?.itemOptions() ?? []);
  private readonly viewport = computed(() => this.view()?.viewport());

  readonly items = computed(() => this.config()?.items?.() ?? null);
  readonly loading = computed(() => this.config()?.loading?.() ?? false);
  readonly panelId = computed(() => `${this.cfg.id()}-listbox`);
  /** Options of the field's own template listed first ("select all"). */
  readonly leadingOptions = computed(() => this.config()?.leadingOptions?.() ?? []);
  private readonly contentOptions = computed(() => this.config()?.contentOptions?.() ?? []);

  private readonly entryOwner: UiItemEntryOwner = {
    isFilteredOut: (label, option) => this.isFilteredOut(label, option),
    isBlocked: (option) => this.isBlocked(option),
    reveal: (entry) => this.reveal(entry as UiItemEntry<T>),
  };
  /**
   * An entry per item. A new array (recomputed by the app) keeps the entries of the values it
   * still has, so the active option and the rendered options stay.
   */
  private readonly itemEntries = linkedSignal<
    readonly UiOptionItem<T>[] | null,
    readonly UiItemEntry<T>[]
  >({
    source: () => this.items(),
    // Untracked: `compareWith` is read here, and the reused entries take their new items.
    computation: (items, previous) =>
      untracked(() => this.reuseEntries(items ?? [], previous?.value ?? [])),
  });
  /** Every option of the list, shown or filtered out ("select all" is not one). */
  readonly options: Signal<readonly UiListEntry<T>[]> = computed(() =>
    this.items() ? this.itemEntries() : this.contentOptions(),
  );
  /** The `items` the search shows; `ui-listbox` renders these. */
  readonly visibleItems = computed(() =>
    this.itemEntries().filter((entry) => !entry.ɵfilteredOut()),
  );
  /** Every option the keyboard moves through. */
  private readonly listOptions = computed((): readonly UiListEntry<T>[] => [
    ...this.leadingOptions(),
    ...(this.items() ? this.visibleItems() : this.contentOptions()),
  ]);
  /** Render the `items` in a virtual scroll viewport. */
  readonly virtual = computed(
    () => (this.items()?.length ?? 0) >= (this.config()?.virtualThreshold?.() ?? 100),
  );
  /** Height of one item option in the viewport, in pixels. */
  readonly itemSize = signal(DEFAULT_ITEM_SIZE);
  /** An item to scroll to once the viewport has sized its content. */
  private pendingReveal: UiItemEntry<T> | null = null;
  /**
   * The selected option a list opened with a click scrolls to without making it active; the
   * first arrow key activates it.
   */
  private restingEntry: UiListEntry<T> | null = null;

  readonly isOpen = signal(false);
  private readonly activeEntry = signal<UiListEntry<T> | null>(null);
  /** The option the keyboard is on. */
  readonly active = this.activeEntry.asReadonly();
  /** Id of the active option; `null` while an active item is not rendered. */
  readonly activeId = computed(() => this.idOf(this.activeEntry()));

  /** The selected options in list order. */
  readonly selectedOptions = computed(() =>
    this.options().filter((option) => this.cfg.isSelected(option.value())),
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
        ([value]) =>
          this.cfg.isSelected(value) && !seen.some(([shown]) => this.matches(shown, value)),
      );
      return [...kept, ...seen];
    },
  });
  /** Nothing to show: no option passes the search, and nothing is loading. */
  readonly noResults = computed(
    () => !this.loading() && this.options().every((option) => this.isHidden(option)),
  );
  /** The list is open and has something to show; bind the dropdown panel and ARIA to it. */
  readonly shown = computed(
    () =>
      this.isOpen() &&
      ((this.config()?.showEmpty?.() ?? true) || this.loading() || !this.noResults()),
  );

  private readonly keyManager = new ActiveDescendantKeyManager<UiListEntry<T>>(
    this.listOptions,
    this.injector,
  )
    .withVerticalOrientation()
    .withHomeAndEnd()
    .withPageUpDown()
    .withTypeAhead()
    .skipPredicate((option) => option.ɵdisabled || this.isHidden(option));

  constructor() {
    super();
    this.keyManager.change.subscribe(() => this.activeEntry.set(this.keyManager.activeItem));
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
    // A list opened before the field became readonly or disabled must not stay open.
    effect(() => {
      if (this.locked()) untracked(() => this.close());
    });
    // The key manager keeps an active option that was removed (e.g. new server-side results).
    effect(() => {
      const options = this.listOptions();
      untracked(() => {
        const active = this.keyManager.activeItem;
        if (!active || options.includes(active)) return;
        this.keyManager.setActiveItem(-1);
        this.activeEntry.set(null);
        if (this.isOpen() && this.activatesOnOpen()) this.keyManager.setFirstItemActive();
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
          const shown = untracked(this.activeEntry) ?? this.restingEntry;
          if (shown instanceof UiItemEntry) this.pendingReveal = shown;
        }
      },
    });
    afterEveryRender(() => {
      if (this.pendingReveal) this.reveal(this.pendingReveal);
    });
  }

  /** Internal: `injectListbox()` passes the field's configuration. */
  ɵconfigure(config: UiListboxConfig<T>): void {
    this.config.set(config);
  }

  /** Internal: `ui-listbox` connects while it is rendered. */
  ɵconnectView(view: UiListboxView<T> | null): void {
    this.view.set(view);
  }

  // --- Options (what `ui-option` asks) ------------------------------------------------------

  isSelected(value: unknown): boolean {
    return this.cfg.isSelected(value);
  }

  isIndeterminate(option: UiOptionHandle): boolean {
    return this.config()?.isIndeterminate?.(option) ?? false;
  }

  isFilteredOut(label: string, option: UiOptionHandle): boolean {
    const query = (this.config()?.filterText?.() ?? '').trim().toLocaleLowerCase();
    if (!query || !(this.config()?.filterOptions?.() ?? true)) return false;
    if (this.config()?.alwaysShown?.(option)) return false;
    return !label.toLocaleLowerCase().includes(query);
  }

  isBlocked(option: UiOptionHandle): boolean {
    return this.config()?.isBlocked?.(option) ?? false;
  }

  /** Whether a rendered option shows the active entry of `items`. */
  isActive(option: UiOptionHandle): boolean {
    const entry = this.activeEntry();
    return (
      entry instanceof UiItemEntry &&
      this.itemOptions().some(
        (rendered) => rendered.option === option && rendered.entry() === entry,
      )
    );
  }

  /** Selects an option the user chose, unless the value cannot change. */
  selectOption(value: unknown): void {
    if (this.locked()) return;
    // Server-side search may replace the options in the same tick (closing resets the search).
    const option = this.options().find((item) => this.matches(item.value(), value));
    if (option) this.knownLabels.update((known) => [...known, [value, option.getLabel()]]);
    this.cfg.select(value);
  }

  /** Whether the search hides an option. */
  isHidden(option: UiListEntry<T>): boolean {
    return option.ɵfilteredOut();
  }

  /** Whether an option value equals a selected value, through `compareWith`. */
  matches(option: unknown, selected: unknown): boolean {
    if (option == null || selected == null) return option === selected;
    const compare: (option: T, selected: T) => boolean =
      this.config()?.compareWith?.() ?? Object.is;
    return compare(option as T, selected as T);
  }

  /** Label of a selected value: from its option, from the list before it changed, or `displayWith`. */
  labelFor(value: unknown): string {
    // Read every time, so the labels are recorded before their options go away.
    const known = this.knownLabels();
    const option = this.options().find((item) => this.matches(item.value(), value));
    if (option) return option.getLabel();
    const label = known.find(([shown]) => this.matches(shown, value));
    if (label) return label[1];
    const displayWith = this.config()?.displayWith?.();
    return value != null && displayWith ? displayWith(value as T) : '';
  }

  /** Keeps the rendered options of `items` when the viewport recycles their views. */
  readonly trackEntry = (_index: number, entry: UiItemEntry<T>): UiItemEntry<T> => entry;

  // --- Open and close -----------------------------------------------------------------------

  /**
   * Opens the list. Unless `activateOnOpen` is off, the option of `openAt` (by default the
   * selected one, else the first) becomes active once the list is rendered. With `activate`
   * false (a click) the list opens without an active option and only scrolls to the selected
   * one, which the first arrow key then activates.
   */
  open(options: { activate?: boolean } = {}): void {
    if (this.isOpen() || this.locked()) return;
    this.isOpen.set(true);
    this.config()?.opened?.();
    if (this.activatesOnOpen()) {
      const activate = options.activate ?? true;
      afterNextRender(() => this.activateOnOpen(activate), { injector: this.injector });
    }
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.clearActive();
    this.pendingReveal = null;
    this.restingEntry = null;
    this.config()?.closed?.();
  }

  // --- Active option ------------------------------------------------------------------------

  activateFirst(): void {
    this.keyManager.setFirstItemActive();
  }

  activateLast(): void {
    this.keyManager.setLastItemActive();
  }

  /** Makes the first option with this value active, if it can be. Returns whether it did. */
  activateValue(value: unknown): boolean {
    const list = this.listOptions();
    const index = list.findIndex(
      (option) =>
        !option.ɵdisabled && !this.isHidden(option) && this.matches(option.value(), value),
    );
    if (index < 0) return false;
    this.keyManager.setActiveItem(index);
    return true;
  }

  /** Leaves the list without an active option. */
  clearActive(): void {
    this.keyManager.setActiveItem(-1);
    this.activeEntry.set(null);
  }

  /** Selects the active option, if there is one that can be selected. Returns whether it did. */
  selectActive(): boolean {
    const active = this.keyManager.activeItem;
    if (!active || active.ɵdisabled) return false;
    this.selectOption(active.value());
    return true;
  }

  // --- Keyboard -----------------------------------------------------------------------------

  /**
   * The keyboard of the field's control. Returns whether the key was the listbox's: when it
   * returns false, the field may act on it (Enter commits typed text, Escape clears it).
   */
  handleKeydown(event: KeyboardEvent): boolean {
    const { key } = event;
    const mode = this.cfg.mode();
    const shown = this.shown();

    if (key === 'Tab') {
      // Focus moves on; the list goes with it.
      this.close();
      return false;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!shown) {
        this.open();
        // A locked field stays closed and gets no active option.
        if (!this.isOpen()) return true;
        // Alt+ArrowDown only opens. Without activation on open, start at the end the key points to.
        if (!event.altKey && !this.activatesOnOpen()) this.activateEnd(key);
      } else if (key === 'ArrowUp' && event.altKey) {
        this.close();
      } else if (!this.keyManager.activeItem) {
        // A list opened with a click (or without activation) has no active option: start at the
        // selected one, else at the end the key points to (the key manager would not move up
        // from no option).
        if (!this.activateResting()) this.activateEnd(key);
      } else {
        this.keyManager.onKeydown(event);
      }
      return true;
    }

    if (!shown) return this.handleClosedKey(event, mode);

    if (key === 'Escape') {
      // Close only the list, not a surrounding dialog.
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return true;
    }
    if (key === 'Enter') {
      if (mode === 'freeText') {
        // Without an active option the field acts on Enter (submit, commit the text).
        if (!this.selectActive()) return false;
        event.preventDefault();
        return true;
      }
      event.preventDefault();
      this.selectActive();
      return true;
    }
    if (mode === 'trigger' && key === ' ') {
      // Also stops the button from turning Space into a click.
      event.preventDefault();
      if (this.keyManager.isTyping()) this.keyManager.onKeydown(event);
      else this.selectActive();
      return true;
    }
    // PageUp/PageDown everywhere; Home/End and typeahead only in a button: a text field keeps
    // them for its text.
    if (!NAVIGATION_KEYS.has(key) && mode !== 'trigger') return false;
    this.keyManager.onKeydown(event);
    return true;
  }

  private handleClosedKey(event: KeyboardEvent, mode: UiListboxMode): boolean {
    const { key } = event;
    if (mode === 'freeText') return false;
    if (key === 'Enter' || (key === ' ' && mode === 'trigger')) {
      event.preventDefault();
      this.open();
      return true;
    }
    if (key === 'Home' || key === 'End') {
      // APG: open the list at the first or last option.
      event.preventDefault();
      this.open();
      if (key === 'Home') this.activateFirst();
      else this.activateLast();
      return true;
    }
    if (mode === 'trigger' && key.length === 1 && !event.ctrlKey && !event.metaKey) {
      // Typeahead on a closed list opens it at the matching option.
      this.open();
      this.keyManager.onKeydown(event);
      return true;
    }
    return false;
  }

  // --- Internals ----------------------------------------------------------------------------

  /**
   * Entries for new items: an item takes the first unused entry with the same value (through
   * `compareWith`), so the n-th of repeated values keeps the n-th entry. Items of new values get
   * new entries.
   */
  private reuseEntries(
    items: readonly UiOptionItem<T>[],
    entries: readonly UiItemEntry<T>[],
  ): UiItemEntry<T>[] {
    const used = new Array<boolean>(entries.length).fill(false);
    // Entries before it are used: in an unchanged order each item finds its entry at once.
    let firstUnused = 0;
    return items.map((item) => {
      while (firstUnused < entries.length && used[firstUnused]) firstUnused++;
      for (let i = firstUnused; i < entries.length; i++) {
        if (used[i] || !this.matches(entries[i].value(), item.value)) continue;
        used[i] = true;
        entries[i].ɵupdate(item);
        return entries[i];
      }
      return new UiItemEntry<T>(item, this.entryOwner);
    });
  }

  private locked(): boolean {
    return this.config()?.locked?.() ?? false;
  }

  private activatesOnOpen(): boolean {
    return this.config()?.activateOnOpen?.() ?? true;
  }

  private activateEnd(key: string): void {
    if (key === 'ArrowDown') this.activateFirst();
    else this.activateLast();
  }

  /**
   * Activates the selected option a click scrolled to, if it is still in the list. Returns
   * whether it did.
   */
  private activateResting(): boolean {
    const resting = this.restingEntry;
    this.restingEntry = null;
    const index = resting && !resting.ɵdisabled ? this.listOptions().indexOf(resting) : -1;
    if (index < 0) return false;
    this.keyManager.setActiveItem(index);
    return true;
  }

  private activateOnOpen(activate: boolean): void {
    // Keys pressed before the list rendered have already moved the active option.
    if (this.keyManager.activeItem) return;
    const list = this.listOptions();
    const openAt = this.config()?.openAt?.();
    const target =
      openAt != null
        ? list.find((option) => !option.ɵdisabled && this.matches(option.value(), openAt))
        : this.selectedOptions().find((option) => !option.ɵdisabled);
    const index = target ? list.indexOf(target) : -1;
    if (!activate) {
      if (index < 0) return;
      this.restingEntry = list[index];
      this.reveal(this.restingEntry);
    } else if (index >= 0) this.keyManager.setActiveItem(index);
    else this.keyManager.setFirstItemActive();
  }

  /** Id of a rendered option; `null` while an item is not rendered. */
  private idOf(entry: UiListEntry<T> | null): string | null {
    if (entry instanceof UiOption) return entry.ɵid;
    if (!entry) return null;
    return this.itemOptions().find((rendered) => rendered.entry() === entry)?.option.ɵid ?? null;
  }

  /** Scrolls an option into view; in the viewport it may not be rendered yet. */
  private reveal(entry: UiListEntry<T>): void {
    const viewport = this.viewport();
    // A key that opens the list (End) activates an item before the viewport is rendered.
    if (!viewport && this.virtual()) {
      this.pendingReveal = entry as UiItemEntry<T>;
      return;
    }
    if (!viewport) {
      afterNextRender(
        () => {
          const id = this.idOf(entry);
          const element = id ? document.getElementById(id) : null;
          // jsdom has no scrollIntoView.
          if (element && 'scrollIntoView' in element) element.scrollIntoView({ block: 'nearest' });
        },
        { injector: this.injector },
      );
      return;
    }
    this.pendingReveal = null;
    const index = this.visibleItems().indexOf(entry as UiItemEntry<T>);
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
      this.pendingReveal = entry as UiItemEntry<T>;
      if (height > 0) return;
    }
    if (start < offset + top || height === 0) {
      if (start - top !== offset) viewport.scrollToOffset(start - top);
    } else if (end > offset + height) {
      viewport.scrollToOffset(end - height);
    }
  }
}

/** Provides the listbox controller of a field, also as the token its options inject. */
export function provideUiListbox(): Provider[] {
  return [UiListbox, { provide: UiListboxHost, useExisting: UiListbox }];
}

/**
 * Creates the listbox controller of a field. Call it in a field initializer of a field that
 * lists `provideUiListbox()` in its `providers`, before any option is created.
 */
export function injectListbox<T>(config: UiListboxConfig<T>): UiListbox<T> {
  const listbox = inject<UiListbox<T>>(UiListbox, { self: true });
  listbox.ɵconfigure(config);
  return listbox;
}

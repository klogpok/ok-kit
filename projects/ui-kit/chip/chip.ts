import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  InjectionToken,
  Injector,
  Signal,
  WritableSignal,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FocusKeyManager, FocusableOption, LiveAnnouncer } from '@angular/cdk/a11y';
import { UI_LABELS, resolveDirection } from '@vplans/ui-kit/core';
import { UiIcon, uiIconCheck, uiIconX } from '@vplans/ui-kit/icon';

/** What `ui-chip-set` needs from a chip. Internal. */
interface UiChipItem {
  /** A display chip without a remove button takes no focus. */
  readonly focusable: Signal<boolean>;
  /** Roving tabindex, set by the chip set. */
  readonly tabIndex: WritableSignal<number>;
  /** A `ui-chip` (list item) rather than a filter chip (button). */
  readonly listItem: boolean;
  readonly element: HTMLElement;
  /** The chip as the CDK key manager sees it. */
  readonly option: UiChipOption;
  focus(): void;
}

/** A chip for `FocusKeyManager`, whose `disabled` must be a plain boolean. */
interface UiChipOption extends FocusableOption {
  readonly item: UiChipItem;
}

function chipOption(item: UiChipItem): UiChipOption {
  return {
    item,
    focus: () => item.focus(),
    get disabled() {
      return !item.focusable();
    },
  };
}

const UI_CHIP_ITEM = new InjectionToken<UiChipItem>('UiChipItem');

/**
 * Where focus goes when the last chip of a set is removed, or on ArrowEnd from the last chip.
 * Provided by `ui-chip-input` (its text field). Internal.
 */
@Injectable()
export class UiChipSetFallback {
  focus: () => void = () => undefined;
}

/** Calls from a chip to the set around it. Provided by `ui-chip-set`. Internal. */
@Injectable()
class UiChipSetParent {
  private set: { itemRemoving(item: UiChipItem): void } | null = null;

  connect(set: { itemRemoving(item: UiChipItem): void }): void {
    this.set = set;
  }

  itemRemoving(item: UiChipItem): void {
    this.set?.itemRemoving(item);
  }
}

/** Text of a chip label, tracked when it changes. */
function injectLabelText(label: Signal<ElementRef<HTMLElement>>): Signal<string> {
  const text = signal<string | null>(null);
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => text.set(label().nativeElement.textContent.trim()));
    observer.observe(element, { childList: true, characterData: true, subtree: true });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
  return computed(() => text() ?? label().nativeElement.textContent.trim());
}

/**
 * A compact element for a value, a tag or a person. With `removable` it has a remove button
 * (Delete and Backspace work too) and emits `removed`; the app takes the chip out of its list.
 * The removal is announced (`chipRemoved` label).
 *
 * Put chips in a `ui-chip-set`: it makes them a list and moves focus between the remove buttons
 * with the arrow keys. Mark an icon or avatar with `uiChipIcon`.
 *
 * @example
 * <ui-chip-set aria-label="Recipients">
 *   @for (user of recipients(); track user.id) {
 *     <ui-chip removable (removed)="remove(user)">{{ user.name }}</ui-chip>
 *   }
 * </ui-chip-set>
 */
@Component({
  selector: 'ui-chip',
  imports: [UiIcon],
  template: `
    <span class="ui-chip__icon"><ng-content select="[uiChipIcon]" /></span>
    <span #labelText class="ui-chip__label"><ng-content /></span>
    @if (removable()) {
      <button
        #removeButton
        type="button"
        class="ui-chip__remove"
        [tabIndex]="tabIndex()"
        [disabled]="disabled()"
        [attr.aria-label]="labels().removeChip(label() || text())"
        (click)="remove()"
        (keydown)="onKeydown($event)"
      >
        <ui-icon [icon]="removeIcon" />
      </button>
    }
  `,
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CHIP_ITEM, useExisting: forwardRef(() => UiChip) }],
  host: {
    class: 'ui-chip',
    '[attr.role]': 'inSet ? "listitem" : null',
    '[class.ui-chip--removable]': 'removable()',
    '[class.ui-chip--disabled]': 'disabled()',
  },
})
export class UiChip implements UiChipItem {
  protected readonly labels = inject(UI_LABELS);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly parent = inject(UiChipSetParent, { optional: true });
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly inSet = this.parent !== null;
  protected readonly removeIcon = uiIconX;

  readonly removable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Text for the remove button and the announcement. Defaults to the content text. */
  readonly label = input('');
  /** The user asked to remove the chip. */
  readonly removed = output();

  private readonly labelRef = viewChild.required<ElementRef<HTMLElement>>('labelText');
  private readonly removeButton = viewChild<ElementRef<HTMLButtonElement>>('removeButton');
  protected readonly text = injectLabelText(this.labelRef);

  readonly listItem = true;
  readonly tabIndex = signal(0);
  readonly focusable = computed(() => this.removable() && !this.disabled());
  readonly option = chipOption(this);

  focus(): void {
    this.removeButton()?.nativeElement.focus();
  }

  /** Removes the chip like its button: emits `removed` and announces it. */
  remove(): void {
    if (!this.focusable()) return;
    this.parent?.itemRemoving(this);
    void this.announcer.announce(this.labels().chipRemoved(this.label() || this.text()), 'polite');
    this.removed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.remove();
    }
  }
}

/**
 * A chip that turns a filter on and off (a toggle button with `aria-pressed`). `selected`
 * supports two-way binding. Several filter chips go into a `ui-chip-set`, which is then a group
 * with one tab stop and arrow keys.
 *
 * @example
 * <ui-chip-set aria-label="Status">
 *   <button ui-filter-chip [(selected)]="onlyOpen">Open</button>
 *   <button ui-filter-chip [(selected)]="onlySigned">Signed</button>
 * </ui-chip-set>
 */
@Component({
  selector: 'button[ui-filter-chip]',
  imports: [UiIcon],
  template: `
    @if (isSelected()) {
      <ui-icon class="ui-chip__check" [icon]="checkIcon" />
    }
    <span class="ui-chip__icon"><ng-content select="[uiChipIcon]" /></span>
    <span class="ui-chip__label"><ng-content /></span>
  `,
  styleUrl: './chip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CHIP_ITEM, useExisting: forwardRef(() => UiFilterChip) }],
  host: {
    class: 'ui-chip ui-filter-chip',
    type: 'button',
    '[tabIndex]': 'tabIndex()',
    '[disabled]': 'disabled()',
    '[attr.aria-pressed]': 'isSelected()',
    '[class.ui-filter-chip--selected]': 'isSelected()',
    '[class.ui-chip--disabled]': 'disabled()',
    '(click)': 'toggle()',
  },
})
export class UiFilterChip implements UiChipItem {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly checkIcon = uiIconCheck;

  readonly selected = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly listItem = false;
  readonly tabIndex = signal(0);
  // model() has no transform, so a static `selected` attribute arrives as '': coerce on read.
  protected readonly isSelected = computed(() => booleanAttribute(this.selected()));
  readonly focusable = computed(() => !this.disabled());
  readonly option = chipOption(this);

  focus(): void {
    this.element.focus();
  }

  protected toggle(): void {
    if (!this.disabled()) this.selected.set(!this.isSelected());
  }
}

/**
 * Lays out chips and makes them one tab stop: the arrow keys move between them (mirrored in
 * RTL), Home and End go to the first and last one. It is a `list` of `ui-chip`s, or a `group`
 * of filter chips; name it with `aria-label`. When a focused chip is removed, focus moves to
 * the next one.
 *
 * @example <ui-chip-set aria-label="Tags">...</ui-chip-set>
 */
@Component({
  selector: 'ui-chip-set',
  template: '<ng-content />',
  styleUrl: './chip-set.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UiChipSetParent],
  host: {
    class: 'ui-chip-set',
    '[attr.role]': 'role()',
    '(keydown)': 'onKeydown($event)',
    '(focusin)': 'onFocusin($event)',
  },
})
export class UiChipSet {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly fallback = inject(UiChipSetFallback, { optional: true });

  private readonly items = contentChildren(UI_CHIP_ITEM, { descendants: true });
  private readonly options = computed(() => this.items().map((item) => item.option));
  private readonly active = signal<UiChipItem | null>(null);

  protected readonly role = computed(() =>
    this.items().some((item) => item.listItem) || !this.items().length ? 'list' : 'group',
  );

  private readonly keyManager = new FocusKeyManager<UiChipOption>(this.options, this.injector)
    .withHomeAndEnd()
    .skipPredicate((option) => !option.item.focusable());

  constructor() {
    inject(UiChipSetParent).connect({ itemRemoving: (item) => this.itemRemoving(item) });
    this.keyManager.change.subscribe(() =>
      this.active.set(this.keyManager.activeItem?.item ?? null),
    );
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
    // Roving tabindex: the active chip, else the first one that takes focus, is the tab stop.
    effect(() => {
      const items = this.items();
      const active = this.active();
      untracked(() => {
        const stop =
          active && items.includes(active) && active.focusable()
            ? active
            : items.find((item) => item.focusable());
        for (const item of items) item.tabIndex.set(item === stop ? 0 : -1);
      });
    });
  }

  /** Focuses the last chip that takes focus. Returns `false` when there is none. */
  focusLast(): boolean {
    const last = this.items()
      .filter((item) => item.focusable())
      .at(-1);
    if (!last) return false;
    this.keyManager.setActiveItem(last.option);
    return true;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const rtl = resolveDirection(this.host) === 'rtl';
    const endKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const last = this.items()
      .filter((item) => item.focusable())
      .at(-1);
    const atLast = !!last && this.keyManager.activeItem === last.option;
    if (event.key === endKey && this.fallback && atLast) {
      event.preventDefault();
      this.fallback.focus();
      return;
    }
    this.keyManager.withHorizontalOrientation(rtl ? 'rtl' : 'ltr');
    this.keyManager.onKeydown(event);
  }

  /** A click or Tab into a chip makes it the active one. */
  protected onFocusin(event: FocusEvent): void {
    const item = this.items().find((i) => i.element.contains(event.target as Node));
    if (item && item.option !== this.keyManager.activeItem) {
      this.keyManager.updateActiveItem(item.option);
      this.active.set(item);
    }
  }

  /** Keeps focus in the set when the app takes a focused chip out. */
  private itemRemoving(item: UiChipItem): void {
    if (!item.element.contains(this.host.ownerDocument.activeElement)) return;
    const focusable = this.items().filter((i) => i.focusable());
    const index = focusable.indexOf(item);
    afterNextRender(
      () => {
        if (this.items().includes(item)) return;
        const rest = this.items().filter((i) => i.focusable());
        const next = rest.at(Math.min(index, rest.length - 1));
        if (next) this.keyManager.setActiveItem(next.option);
        else this.fallback?.focus();
      },
      { injector: this.injector },
    );
  }
}

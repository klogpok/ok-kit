import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  booleanAttribute,
  effect,
  inject,
  input,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  CdkMenu,
  CdkMenuGroup,
  CdkMenuItem,
  CdkMenuItemCheckbox,
  CdkMenuItemRadio,
  CdkMenuTrigger,
  MENU_STACK,
} from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { provideUiLiveDirectionality } from '@vplans/ui-kit/core';
import { UiIcon, uiIconCheck, uiIconChevronRight } from '@vplans/ui-kit/icon';

/**
 * Where a menu opens next to its trigger. It flips to the other side when it does not fit.
 * `start`/`end` follow the text direction.
 */
export type UiMenuPosition = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

const BELOW = { originY: 'bottom', overlayY: 'top' } as const;
const ABOVE = { originY: 'top', overlayY: 'bottom' } as const;
const START = { originX: 'start', overlayX: 'start' } as const;
const END = { originX: 'end', overlayX: 'end' } as const;

const POSITIONS: Record<UiMenuPosition, ConnectedPosition[]> = {
  'bottom-start': [
    { ...BELOW, ...START },
    { ...ABOVE, ...START },
    { ...BELOW, ...END },
  ],
  'bottom-end': [
    { ...BELOW, ...END },
    { ...ABOVE, ...END },
    { ...BELOW, ...START },
  ],
  'top-start': [
    { ...ABOVE, ...START },
    { ...BELOW, ...START },
    { ...ABOVE, ...END },
  ],
  'top-end': [
    { ...ABOVE, ...END },
    { ...BELOW, ...END },
    { ...ABOVE, ...START },
  ],
};

/**
 * Opens a `ui-menu` from a button. Put the menu in an `ng-template`; it is created when the
 * menu opens. On a `ui-menu-item` it opens a submenu.
 *
 * Keyboard (from CDK Menu): Enter, Space and Arrow Down open the menu and focus the first item,
 * Arrow Up focuses the last one. Focus returns to the trigger when the menu closes.
 *
 * `uiMenuPosition` takes a preset (`bottom-start`, `bottom-end`, `top-start`, `top-end`) or
 * CDK connected positions.
 *
 * @example
 * <button ui-button variant="secondary" [uiMenuTriggerFor]="actions">Actions</button>
 * <ng-template #actions>
 *   <ui-menu>
 *     <button ui-menu-item (triggered)="edit()">Edit</button>
 *     <button ui-menu-item danger (triggered)="remove()">Delete</button>
 *   </ui-menu>
 * </ng-template>
 */
@Directive({
  selector: '[uiMenuTriggerFor]',
  exportAs: 'uiMenuTrigger',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: ['cdkMenuTriggerFor: uiMenuTriggerFor', 'cdkMenuTriggerData: uiMenuTriggerData'],
      outputs: ['cdkMenuOpened: menuOpened', 'cdkMenuClosed: menuClosed'],
    },
  ],
  // The CDK reads the direction for positions and arrow keys; follow runtime `dir` changes.
  providers: [provideUiLiveDirectionality()],
  host: { class: 'ui-menu-trigger' },
})
export class UiMenuTrigger {
  private readonly trigger = inject(CdkMenuTrigger);

  /**
   * A preset, or CDK connected positions. Defaults to `bottom-start` for a button and to the
   * side of the item for a submenu.
   */
  readonly position = input<UiMenuPosition | ConnectedPosition[] | null>(null, {
    alias: 'uiMenuPosition',
  });

  constructor() {
    effect(() => {
      const position = this.position();
      // Read when the menu opens; without a value the CDK picks its default.
      this.trigger.menuPosition = (typeof position === 'string'
        ? POSITIONS[position]
        : position) as unknown as ConnectedPosition[];
    });
  }

  isOpen(): boolean {
    return this.trigger.isOpen();
  }

  open(): void {
    this.trigger.open();
  }

  close(): void {
    this.trigger.close();
  }

  toggle(): void {
    this.trigger.toggle();
  }
}

/**
 * Popup list of actions (WAI-ARIA menu pattern). Use inside an `ng-template` opened by
 * `[uiMenuTriggerFor]`. Separate groups with `<ui-divider />` or `ui-menu-group`.
 *
 * Keyboard (from CDK Menu): Arrow Up/Down move between items, Home/End jump to the first/last,
 * typing a letter focuses the next matching item, Escape closes the menu. In a submenu,
 * Arrow Right opens and Arrow Left closes (mirrored in RTL).
 */
@Component({
  selector: 'ui-menu',
  template: '<ng-content />',
  styleUrl: './menu.scss',
  // Styles must reach projected dividers; selectors are scoped under `.ui-menu`.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: CdkMenu, outputs: ['closed'] }],
  providers: [provideUiLiveDirectionality()],
  host: { class: 'ui-menu' },
})
export class UiMenu {
  constructor() {
    // CDK Menu only prevents the default on Escape, so the overlay keyboard dispatcher on <body>
    // would also close a surrounding dialog. A host binding cannot stop it: CDK Menu closes the
    // menu first and the view drops its listeners. Listening here runs before CDK Menu's handler
    // on the same element, which still runs.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const unlisten = inject(Renderer2).listen(host, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.stopPropagation();
    });
    inject(DestroyRef).onDestroy(unlisten);
  }
}

/**
 * Action in a `ui-menu`. Icons projected as `<ui-icon>` go before the label. With
 * `[uiMenuTriggerFor]` it opens a submenu and shows a chevron.
 *
 * Listen to `triggered` rather than `click`: it also fires for the keyboard and closes the menu.
 * Disabled items stay focusable (`aria-disabled`) so screen reader users can find them.
 *
 * On an `<a>` it is a link (`routerLink` or `href`): Enter and Space follow it, and the menu
 * closes once the click has followed the link. A disabled link does not navigate.
 *
 * @example <button ui-menu-item (triggered)="rename()"><ui-icon icon="edit" /> Rename</button>
 * @example <a ui-menu-item routerLink="/plans/42/history">History</a>
 */
@Component({
  selector: 'button[ui-menu-item], a[ui-menu-item]',
  imports: [UiIcon],
  template: `
    <span class="ui-menu-item__icon"><ng-content select="ui-icon" /></span>
    <span class="ui-menu-item__label"><ng-content /></span>
    @if (submenu) {
      <ui-icon class="ui-menu-item__submenu" size="sm" [icon]="chevron" flipRtl />
    }
  `,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ['cdkMenuItemDisabled: disabled', 'cdkMenuitemTypeaheadLabel: typeaheadLabel'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    class: 'ui-menu-item',
    '[attr.type]': 'link ? null : "button"',
    // A static `disabled` attribute would disable the native button and take it out of the
    // focus order; CDK Menu sets `aria-disabled` instead.
    '[attr.disabled]': 'null',
    '[class.ui-menu-item--danger]': 'danger()',
  },
})
export class UiMenuItem {
  /** Destructive action: shown in the danger color. */
  readonly danger = input(false, { transform: booleanAttribute });

  protected readonly submenu = inject(UiMenuTrigger, { self: true, optional: true });
  protected readonly chevron = uiIconChevronRight;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly link = this.host.nodeName === 'A';

  constructor() {
    if (this.link) this.setUpLink();
  }

  private setUpLink(): void {
    const item = inject(CdkMenuItem, { self: true });
    const stack = inject(MENU_STACK);
    const renderer = inject(Renderer2);

    // CDK Menu closes the menu inside the click handler, and a link that is no longer in the
    // page does not navigate. Keep the menu open during the click and close it right after.
    const trigger = item.trigger.bind(item);
    item.trigger = (options?: { keepOpen: boolean }) => {
      trigger({ keepOpen: true });
      if (!options?.keepOpen && !item.disabled && !item.hasMenu) {
        setTimeout(() => {
          stack.closeAll({ focusParentTrigger: true });
        });
      }
    };

    // Registered before the CDK and RouterLink listeners of the element, so these run first.
    const block = (event: Event): void => {
      if (!item.disabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const unlisten = [
      renderer.listen(this.host, 'click', block),
      renderer.listen(this.host, 'auxclick', block),
      renderer.listen(this.host, 'keydown', (event: KeyboardEvent) => {
        // Enter follows a link natively; Space would only trigger the item.
        if (event.key !== ' ') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.host.click();
      }),
    ];
    inject(DestroyRef).onDestroy(() => {
      unlisten.forEach((fn) => {
        fn();
      });
    });
  }
}

/**
 * Labelled group of items in a `ui-menu`. Radio items in one group work together: checking one
 * unchecks the others.
 *
 * @example
 * <ui-menu-group label="Sort by">
 *   <button ui-menu-item-radio [checked]="sort() === 'name'" (triggered)="sort.set('name')">
 *     Name
 *   </button>
 *   <button ui-menu-item-radio [checked]="sort() === 'date'" (triggered)="sort.set('date')">
 *     Date
 *   </button>
 * </ui-menu-group>
 */
@Component({
  selector: 'ui-menu-group',
  template: `
    @if (label()) {
      <div class="ui-menu-group__label" aria-hidden="true" [id]="labelId">{{ label() }}</div>
    }
    <ng-content />
  `,
  styleUrl: './menu-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [CdkMenuGroup],
  host: {
    class: 'ui-menu-group',
    '[attr.aria-labelledby]': 'label() ? labelId : null',
  },
})
export class UiMenuGroup {
  /** Visible heading of the group, also its accessible name. */
  readonly label = input('');
  protected readonly labelId = inject(_IdGenerator).getId('ui-menu-group-');
}

/**
 * Menu item that turns an option on or off (`menuitemcheckbox`). Bind `checked` and update it on
 * `triggered`. Space toggles it and keeps the menu open; Enter and clicks close the menu.
 *
 * @example
 * <button ui-menu-item-checkbox [checked]="archived()" (triggered)="archived.set(!archived())">
 *   Show archived
 * </button>
 */
@Component({
  selector: 'button[ui-menu-item-checkbox]',
  imports: [UiIcon],
  template: `
    <span class="ui-menu-item__indicator" aria-hidden="true"><ui-icon [icon]="check" /></span>
    <span class="ui-menu-item__label"><ng-content /></span>
  `,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItemCheckbox,
      inputs: ['cdkMenuItemChecked: checked', 'cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    class: 'ui-menu-item ui-menu-item--selectable',
    type: 'button',
    '[attr.disabled]': 'null',
  },
})
export class UiMenuItemCheckbox {
  protected readonly check = uiIconCheck;
}

/**
 * Menu item that picks one option of its `ui-menu-group` (`menuitemradio`). Bind `checked` and
 * update it on `triggered`. Space picks it and keeps the menu open.
 *
 * @example
 * <button ui-menu-item-radio [checked]="view() === 'list'" (triggered)="view.set('list')">
 *   List
 * </button>
 */
@Component({
  selector: 'button[ui-menu-item-radio]',
  template: `
    <span class="ui-menu-item__indicator" aria-hidden="true">
      <span class="ui-menu-item__dot"></span>
    </span>
    <span class="ui-menu-item__label"><ng-content /></span>
  `,
  styleUrl: './menu-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItemRadio,
      inputs: ['cdkMenuItemChecked: checked', 'cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    class: 'ui-menu-item ui-menu-item--selectable',
    type: 'button',
    '[attr.disabled]': 'null',
  },
})
export class UiMenuItemRadio {}

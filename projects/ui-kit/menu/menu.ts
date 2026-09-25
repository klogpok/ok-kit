import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { provideUiLiveDirectionality } from '@vplans/ui-kit/core';
import { UiIcon, uiIconChevronRight } from '@vplans/ui-kit/icon';

/**
 * Opens a `ui-menu` from a button. Put the menu in an `ng-template`; it is created when the
 * menu opens. On a `ui-menu-item` it opens a submenu.
 *
 * Keyboard (from CDK Menu): Enter, Space and Arrow Down open the menu and focus the first item,
 * Arrow Up focuses the last one. Focus returns to the trigger when the menu closes.
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
      inputs: [
        'cdkMenuTriggerFor: uiMenuTriggerFor',
        'cdkMenuPosition: uiMenuPosition',
        'cdkMenuTriggerData: uiMenuTriggerData',
      ],
      outputs: ['cdkMenuOpened: menuOpened', 'cdkMenuClosed: menuClosed'],
    },
  ],
  // The CDK reads the direction for positions and arrow keys; follow runtime `dir` changes.
  providers: [provideUiLiveDirectionality()],
  host: { class: 'ui-menu-trigger' },
})
export class UiMenuTrigger {
  private readonly trigger = inject(CdkMenuTrigger);

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
 * `[uiMenuTriggerFor]`. Separate groups with `<ui-divider />`.
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
 * @example <button ui-menu-item (triggered)="rename()"><ui-icon icon="edit" /> Rename</button>
 */
@Component({
  selector: 'button[ui-menu-item]',
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
    type: 'button',
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
}

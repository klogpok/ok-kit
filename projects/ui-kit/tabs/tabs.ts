import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  model,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FocusKeyManager, FocusableOption, _IdGenerator } from '@angular/cdk/a11y';
import { resolveDirection } from '@vplans/ui-kit/core';

/**
 * Rich tab label, used instead of the `label` input.
 *
 * @example <ng-template uiTabLabel>Documents <ui-badge size="sm">3</ui-badge></ng-template>
 */
@Directive({ selector: 'ng-template[uiTabLabel]' })
export class UiTabLabel {
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * Lazy tab content: created when the tab is selected and destroyed when it is left.
 * Without it, the projected content is created up front and kept while hidden.
 *
 * @example <ng-template uiTabContent><app-heavy-report /></ng-template>
 */
@Directive({ selector: 'ng-template[uiTabContent]' })
export class UiTabContent {
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/** One tab of a `ui-tab-group`. Renders nothing by itself. */
@Component({
  selector: 'ui-tab',
  template: '<ng-template #content><ng-content /></ng-template>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTab {
  readonly label = input('');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly labelTemplate = contentChild(UiTabLabel);
  readonly lazyContent = contentChild(UiTabContent);
  private readonly projectedContent = viewChild.required<TemplateRef<void>>('content');

  readonly contentTemplate = computed(
    () => this.lazyContent()?.template ?? this.projectedContent(),
  );
}

/** Tab button inside the tab list. Internal: gives the key manager focusable items. */
@Directive({ selector: 'button[uiTabButton]' })
export class UiTabButton implements FocusableOption {
  readonly element = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  readonly tabDisabled = input(false, { alias: 'uiTabButton' });

  get disabled(): boolean {
    return this.tabDisabled();
  }

  focus(): void {
    this.element.focus();
  }
}

/**
 * Tabs that switch between panels of related content (WAI-ARIA tabs pattern).
 *
 * Keyboard: arrow keys move between tabs (mirrored in RTL), Home/End jump to the first/last tab.
 * With `activation="automatic"` (default) moving focus selects the tab; with `manual` the user
 * presses Enter or Space. Disabled tabs are skipped.
 *
 * @example
 * <ui-tab-group [(selectedIndex)]="tab" aria-label="Plan">
 *   <ui-tab label="Details">...</ui-tab>
 *   <ui-tab label="History"><ng-template uiTabContent><app-history /></ng-template></ui-tab>
 * </ui-tab-group>
 */
@Component({
  selector: 'ui-tab-group',
  imports: [NgTemplateOutlet, UiTabButton],
  template: `
    <!-- Keyboard handling lives on the tablist; the tabs themselves are native buttons. -->
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <div
      role="tablist"
      class="ui-tabs__list"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      (keydown)="onKeydown($event)"
    >
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          type="button"
          role="tab"
          class="ui-tabs__tab"
          [uiTabButton]="tab.disabled()"
          [id]="tabId(i)"
          [class.ui-tabs__tab--selected]="i === selected()"
          [disabled]="tab.disabled()"
          [attr.aria-selected]="i === selected()"
          [attr.aria-controls]="panelId(i)"
          [attr.tabindex]="i === selected() ? 0 : -1"
          (click)="select(i)"
          (focus)="onTabFocus(i)"
        >
          @if (tab.labelTemplate(); as label) {
            <ng-container [ngTemplateOutlet]="label.template" />
          } @else {
            {{ tab.label() }}
          }
        </button>
      }
    </div>
    @for (tab of tabs(); track tab; let i = $index) {
      <div
        role="tabpanel"
        class="ui-tabs__panel"
        tabindex="0"
        [id]="panelId(i)"
        [attr.aria-labelledby]="tabId(i)"
        [hidden]="i !== selected()"
      >
        @if (i === selected()) {
          <ng-container [ngTemplateOutlet]="tab.contentTemplate()" />
        }
      </div>
    }
  `,
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-tab-group' },
})
export class UiTabGroup {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly baseId = inject(_IdGenerator).getId('ui-tabs-');

  readonly selectedIndex = model(0);
  /** `automatic`: arrow keys select tabs. `manual`: arrow keys only move focus. */
  readonly activation = input<'automatic' | 'manual'>('automatic');
  readonly ariaLabel = input('', { alias: 'aria-label' });
  readonly ariaLabelledby = input('', { alias: 'aria-labelledby' });

  protected readonly tabs = contentChildren(UiTab);
  private readonly buttons = viewChildren(UiTabButton);
  private readonly keyManager = new FocusKeyManager(this.buttons, inject(Injector))
    .withHorizontalOrientation('ltr')
    .withHomeAndEnd()
    .withWrap();

  /** The selected index, moved off disabled tabs and clamped to the existing tabs. */
  protected readonly selected = computed(() => {
    const tabs = this.tabs();
    const index = Math.min(Math.max(this.selectedIndex(), 0), tabs.length - 1);
    if (!tabs[index]?.disabled()) return index;
    return tabs.findIndex((tab) => !tab.disabled());
  });

  constructor() {
    this.keyManager.change.subscribe((index) => {
      if (this.activation() === 'automatic') this.select(index);
    });
    inject(DestroyRef).onDestroy(() => this.keyManager.destroy());
    // Tell the parent which tab is really shown when its index was disabled or out of range.
    effect(() => {
      const selected = this.selected();
      if (selected >= 0 && selected !== this.selectedIndex()) {
        untracked(() => this.selectedIndex.set(selected));
      }
    });
  }

  protected tabId(index: number): string {
    return `${this.baseId}-tab-${index}`;
  }

  protected panelId(index: number): string {
    return `${this.baseId}-panel-${index}`;
  }

  select(index: number): void {
    if (this.tabs()[index]?.disabled()) return;
    this.selectedIndex.set(index);
  }

  /** Moves keyboard focus to the selected tab. */
  focus(): void {
    this.buttons()[this.selected()]?.focus();
  }

  protected onTabFocus(index: number): void {
    this.keyManager.updateActiveItem(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Read the direction on use: it can change at runtime (dir on <html> or an ancestor).
    this.keyManager.withHorizontalOrientation(resolveDirection(this.host));
    this.keyManager.onKeydown(event);
  }
}

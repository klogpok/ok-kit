import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EmbeddedViewRef,
  Injectable,
  TemplateRef,
  ViewContainerRef,
  afterRenderEffect,
  computed,
  contentChildren,
  inject,
  input,
  numberAttribute,
  viewChild,
} from '@angular/core';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UI_LABELS } from '@vplans/ui-kit/core';
import { UiIcon, uiIconMoreHorizontal } from '@vplans/ui-kit/icon';
import { UiMenu, UiMenuItem, UiMenuTrigger } from '@vplans/ui-kit/menu';

/** What a breadcrumb reads from its trail. */
interface UiBreadcrumbsOwner {
  isCollapsed(item: UiBreadcrumb): boolean;
  isCurrent(item: UiBreadcrumb): boolean;
}

/** Connects the links to their trail without adding these calls to the public API. Internal. */
@Injectable()
class UiBreadcrumbsContext {
  owner: UiBreadcrumbsOwner | null = null;
  /** Each link's element and the container that inserts views right after it. */
  readonly items = new Map<UiBreadcrumb, { host: HTMLElement; container: ViewContainerRef }>();
}

/**
 * Link in a `nav[ui-breadcrumbs]` trail. Works with `routerLink` or a plain `href`.
 * The last link is the current page (`aria-current="page"`); it may have no `href`.
 */
@Component({
  selector: 'a[ui-breadcrumb]',
  template: '<ng-content />',
  styleUrl: './breadcrumb.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-breadcrumb',
    '[class.ui-breadcrumb--current]': 'current()',
    '[attr.aria-current]': 'current() ? "page" : null',
    '[hidden]': 'collapsed()',
  },
})
export class UiBreadcrumb {
  private readonly context = inject(UiBreadcrumbsContext, { optional: true });

  protected readonly current = computed(() => this.context?.owner?.isCurrent(this) ?? false);
  protected readonly collapsed = computed(() => this.context?.owner?.isCollapsed(this) ?? false);

  constructor() {
    const context = this.context;
    if (!context) return;
    context.items.set(this, {
      host: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      container: inject(ViewContainerRef),
    });
    inject(DestroyRef).onDestroy(() => context.items.delete(this));
  }
}

/**
 * Trail of links to the current page (WAI-ARIA breadcrumb pattern). A `nav` landmark named by
 * the `breadcrumbs` label (or `aria-label`); the last link is the current page. Separators are
 * drawn with CSS, so screen readers skip them, and they point the other way in RTL.
 *
 * With more links than `maxItems`, the middle ones collapse into a "…" menu button after the
 * first link; the last `maxItems - 2` links stay visible. Choosing a menu item follows the
 * hidden link, so `routerLink` keeps working.
 *
 * @example
 * <nav ui-breadcrumbs>
 *   <a ui-breadcrumb routerLink="/">Home</a>
 *   <a ui-breadcrumb routerLink="/plans">Plans</a>
 *   <a ui-breadcrumb>Tower B, floor 4</a>
 * </nav>
 */
@Component({
  selector: 'nav[ui-breadcrumbs]',
  imports: [UiIcon, UiIconButton, UiMenu, UiMenuItem, UiMenuTrigger],
  template: `
    <ng-content />
    <ng-template #ellipsis>
      <span class="ui-breadcrumbs__more">
        <button
          ui-icon-button
          size="sm"
          class="ui-breadcrumbs__more-button"
          [label]="labels().showMore"
          [uiMenuTriggerFor]="menu"
        >
          <ui-icon [icon]="moreIcon" />
        </button>
      </span>
    </ng-template>
    <ng-template #menu>
      <ui-menu>
        @for (item of collapsedItems(); track item) {
          <button ui-menu-item (triggered)="follow(item)">{{ labelOf(item) }}</button>
        }
      </ui-menu>
    </ng-template>
  `,
  styleUrl: './breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UiBreadcrumbsContext],
  host: {
    class: 'ui-breadcrumbs',
    '[attr.aria-label]': 'ariaLabel() || labels().breadcrumbs',
  },
})
export class UiBreadcrumbs {
  protected readonly labels = inject(UI_LABELS);
  private readonly context = inject(UiBreadcrumbsContext);
  protected readonly moreIcon = uiIconMoreHorizontal;

  /** Links shown before the middle ones collapse into a menu (at least 2). */
  readonly maxItems = input(4, { transform: (value: unknown) => numberAttribute(value, 4) });
  readonly ariaLabel = input('', { alias: 'aria-label' });

  private readonly items = contentChildren(UiBreadcrumb, { descendants: true });
  private readonly ellipsis = viewChild.required<TemplateRef<unknown>>('ellipsis');

  /** The links hidden behind the "…" button, in order. */
  protected readonly collapsedItems = computed(() => {
    const items = this.items();
    const max = Math.max(2, this.maxItems());
    if (items.length <= max) return [];
    return items.slice(1, items.length - (max - 2 || 1));
  });

  private ellipsisView: EmbeddedViewRef<unknown> | null = null;
  private ellipsisAfter: UiBreadcrumb | null = null;

  constructor() {
    this.context.owner = {
      isCollapsed: (item) => this.collapsedItems().includes(item),
      isCurrent: (item) => this.items().at(-1) === item,
    };
    // The button goes right after the first link, so the focus order matches what is shown.
    afterRenderEffect({
      write: () => this.placeEllipsis(this.collapsedItems().length ? this.items()[0] : null),
    });
    inject(DestroyRef).onDestroy(() => this.ellipsisView?.destroy());
  }

  protected labelOf(item: UiBreadcrumb): string {
    return this.context.items.get(item)?.host.textContent.trim() ?? '';
  }

  /** Follows a collapsed link: its click runs `routerLink` or the `href`. */
  protected follow(item: UiBreadcrumb): void {
    this.context.items.get(item)?.host.click();
  }

  private placeEllipsis(after: UiBreadcrumb | null): void {
    if (after === this.ellipsisAfter && !this.ellipsisView?.destroyed) return;
    if (this.ellipsisView && !this.ellipsisView.destroyed) this.ellipsisView.destroy();
    this.ellipsisView = null;
    this.ellipsisAfter = after;
    const container = after ? this.context.items.get(after)?.container : undefined;
    if (!container) return;
    this.ellipsisView = container.createEmbeddedView(this.ellipsis());
    this.ellipsisView.detectChanges();
  }
}

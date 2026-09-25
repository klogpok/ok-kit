import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { LocationStrategy } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Tab-styled navigation between pages. Use it when each tab is its own route; use
 * `ui-tab-group` when the tabs switch panels on the same page.
 *
 * It is a plain `<nav>` with links, not an ARIA tablist: links keep their browser behavior
 * (open in a new tab, Tab key between them), and the current one has `aria-current="page"`.
 *
 * @example
 * <nav ui-tab-nav aria-label="Plan">
 *   <a ui-tab-link routerLink="details" routerLinkActive>Details</a>
 *   <a ui-tab-link routerLink="history" routerLinkActive>History</a>
 * </nav>
 */
@Component({
  selector: 'nav[ui-tab-nav]',
  template: '<ng-content />',
  styleUrl: './tab-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-tab-nav' },
})
export class UiTabNav {}

/**
 * Link inside `nav[ui-tab-nav]`. Active when the `RouterLinkActive` on the same element matches,
 * or when `active` is set (without the router, or to override it).
 */
@Component({
  selector: 'a[ui-tab-link]',
  template: '<ng-content />',
  styleUrl: './tab-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-tab-link',
    '[class.ui-tab-link--active]': 'isActive()',
    '[attr.aria-current]': 'isActive() ? "page" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'disabled() ? -1 : null',
  },
})
export class UiTabLink {
  private readonly routerLinkActive = inject(RouterLinkActive, { self: true, optional: true });
  private readonly routerActive = signal(false);
  private readonly routerLink = inject(RouterLink, { self: true, optional: true });

  /** Marks the link as the current page. Overrides `RouterLinkActive` when set. */
  readonly active = input<boolean | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly isActive = computed(() => this.active() ?? this.routerActive());

  private readonly router = inject(Router, { optional: true });
  private readonly locationStrategy = inject(LocationStrategy, { optional: true });

  /** The href RouterLink would render now (its own getter is deprecated). */
  private currentRouterHref(): string | null {
    const tree = this.routerLink?.urlTree;
    if (!tree || !this.router || !this.locationStrategy) return null;
    return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  constructor() {
    const subscription = this.routerLinkActive?.isActiveChange.subscribe((active) =>
      this.routerActive.set(active),
    );

    // Capture phase runs before RouterLink's own click handler.
    const host = inject<ElementRef<HTMLAnchorElement>>(ElementRef).nativeElement;
    const blockWhileDisabled = (event: Event): void => {
      if (this.disabled()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    // `auxclick`: a middle click opens the link in a new tab without a `click` event.
    for (const type of ['click', 'auxclick']) {
      host.addEventListener(type, blockWhileDisabled, { capture: true });
    }
    inject(DestroyRef).onDestroy(() => {
      subscription?.unsubscribe();
      for (const type of ['click', 'auxclick']) {
        host.removeEventListener(type, blockWhileDisabled, { capture: true });
      }
    });

    // A disabled link has no href, so "Open in new tab" is not offered either. RouterLink writes
    // the href again after navigations, so remove it after every render while disabled.
    let removedHref: string | null = null;
    afterEveryRender({
      write: () => {
        if (this.disabled()) {
          const href = host.getAttribute('href');
          if (href === null) return;
          removedHref = href;
          host.removeAttribute('href');
        } else if (removedHref !== null) {
          host.setAttribute('href', this.currentRouterHref() ?? removedHref);
          removedHref = null;
        }
      },
    });
  }
}

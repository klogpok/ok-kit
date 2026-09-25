import {
  DestroyRef,
  Directive,
  ElementRef,
  afterEveryRender,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { UiSize, UiVariant } from '@vplans/ui-kit/core';

/** Shared behavior of `ui-button` and `ui-icon-button` on `<button>` and `<a>` hosts. */
@Directive({
  host: {
    '[class]': 'modifierClasses()',
    '[attr.type]': 'isAnchor ? null : type()',
    '[attr.disabled]': '!isAnchor && disabled() && !disabledInteractive() ? "" : null',
    '[attr.aria-disabled]':
      'isInert() && (isAnchor || loading() || disabledInteractive()) ? "true" : null',
    '[attr.tabindex]': 'anchorTabIndex()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export abstract class UiButtonBase {
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isAnchor = this.host.tagName === 'A';

  abstract readonly variant: () => UiVariant;
  readonly size = input<UiSize>('md');
  /** Ignored for `<a>` hosts. Defaults to `button` so buttons never submit forms by accident. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Keeps a disabled button focusable and hoverable (`aria-disabled` instead of `disabled`), so a
   * `uiTooltip` can explain why it is disabled. Activation stays blocked.
   */
  readonly disabledInteractive = input(false, { transform: booleanAttribute });
  /**
   * Shows a spinner and blocks activation while keeping the button focusable
   * (`aria-disabled` + `aria-busy`) so screen reader users keep their place.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Disabled or loading: activation is blocked. */
  protected readonly isInert = computed(() => this.disabled() || this.loading());

  /** An inert anchor has no href, so it needs a tabindex to stay focusable (or to leave the order). */
  protected readonly anchorTabIndex = computed(() => {
    if (!this.isAnchor || !this.isInert()) return null;
    return this.disabled() && !this.disabledInteractive() ? -1 : 0;
  });

  protected readonly modifierClasses = computed(() =>
    [
      `ui-button--${this.variant()}`,
      `ui-button--${this.size()}`,
      this.disabled() ? 'ui-button--disabled' : '',
      this.loading() ? 'ui-button--loading' : '',
    ].join(' '),
  );

  constructor() {
    // Capture phase on the host runs before any (click) handler bound by consumers.
    const blockWhileInert = (event: Event): void => {
      if (this.isInert()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    // `auxclick`: a middle click opens a link in a new tab without a `click` event.
    const types = this.isAnchor ? ['click', 'auxclick'] : ['click'];
    for (const type of types) this.host.addEventListener(type, blockWhileInert, { capture: true });
    inject(DestroyRef).onDestroy(() => {
      for (const type of types) {
        this.host.removeEventListener(type, blockWhileInert, { capture: true });
      }
    });

    // An inert link has no href, so Ctrl+click and "Open in new tab" do not navigate either.
    // RouterLink may write the href again after navigations, so check after every render.
    if (this.isAnchor) {
      let removedHref: string | null = null;
      afterEveryRender({
        write: () => {
          if (this.isInert()) {
            const href = this.host.getAttribute('href');
            if (href === null) return;
            removedHref = href;
            this.host.removeAttribute('href');
          } else if (removedHref !== null) {
            this.host.setAttribute('href', removedHref);
            removedHref = null;
          }
        },
      });
    }
  }
}

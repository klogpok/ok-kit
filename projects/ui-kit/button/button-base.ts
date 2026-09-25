import {
  DestroyRef,
  Directive,
  ElementRef,
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
    '[attr.disabled]': '!isAnchor && disabled() ? "" : null',
    '[attr.aria-disabled]': 'isInert() && (isAnchor || loading()) ? "true" : null',
    '[attr.tabindex]': 'isAnchor && disabled() ? -1 : null',
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
   * Shows a spinner and blocks activation while keeping the button focusable
   * (`aria-disabled` + `aria-busy`) so screen reader users keep their place.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Disabled or loading: activation is blocked. */
  protected readonly isInert = computed(() => this.disabled() || this.loading());

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
    this.host.addEventListener('click', blockWhileInert, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      this.host.removeEventListener('click', blockWhileInert, { capture: true }),
    );
  }
}

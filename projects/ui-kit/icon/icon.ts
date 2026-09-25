import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiSize } from '@vplans/ui-kit/core';
import { UiIconDefinition, UiIconRegistry } from './icon-registry';
import { UiIconName } from './icons';

/**
 * Renders an SVG icon that inherits the current text color.
 * Decorative by default (`aria-hidden`); pass `label` for meaningful, standalone icons.
 *
 * @example <ui-icon icon="search" />
 * @example <ui-icon [icon]="uiIconAlertCircle" label="Error" size="md" />
 */
@Component({
  selector: 'ui-icon',
  template: '',
  styleUrl: './icon.scss',
  // Styles must reach the injected <svg>; selectors are scoped under `.ui-icon`.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-icon',
    '[class]': '"ui-icon--" + size()',
    '[class.ui-icon--flip-rtl]': 'flipRtl()',
    '[innerHTML]': 'svg()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class UiIcon {
  private readonly registry = inject(UiIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Registered icon name or an icon definition. Built-in names autocomplete; names of the app's
   * own registered icons work too.
   */
  readonly icon = input.required<UiIconName | (string & Record<never, never>) | UiIconDefinition>();
  /** `inherit` scales with the surrounding font size (1em). */
  readonly size = input<UiSize | 'inherit'>('inherit');
  /** Accessible name. When empty the icon is decorative. */
  readonly label = input('');
  /** Mirror horizontally in RTL (for directional icons such as arrows). */
  readonly flipRtl = input(false, { transform: booleanAttribute });

  protected readonly svg = computed<SafeHtml | null>(() => {
    const icon = this.icon();
    const markup = typeof icon === 'string' ? this.registry.get(icon) : icon.svg;
    if (markup === undefined) {
      if (isDevMode()) {
        console.warn(`[ui-icon] Icon "${String(icon)}" is not registered. Use provideUiIcons().`);
      }
      return null;
    }
    // Icon markup comes from the registry/definitions, which only accept trusted, developer-provided SVG.
    return this.sanitizer.bypassSecurityTrustHtml(markup);
  });
}

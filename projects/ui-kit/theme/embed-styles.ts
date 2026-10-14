import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Loads the kit's global styles into a host app that has document styles of its own and cannot
 * add `ui-kit.scss` to its build: the tokens (on `:root`, so overlays get them too) and the
 * layout classes, without the kit's document defaults, typography classes or the
 * `prefers-color-scheme` switch (`styles/ui-kit-embed.scss`).
 *
 * Render it once in the template of every component that uses the kit. Angular adds an
 * unencapsulated stylesheet to the document while a component that uses it is rendered, so the
 * tokens are there as long as one consumer is on screen. The element itself is hidden and has no
 * content.
 *
 * @example <ui-embed-styles />
 */
@Component({
  selector: 'ui-embed-styles',
  template: '',
  styleUrl: '../styles/ui-kit-embed.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { hidden: '' },
})
export class UiEmbedStyles {}

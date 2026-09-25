import { InjectionToken, Signal } from '@angular/core';

/**
 * Provided by `uiTooltip` on its host element. Components that show a native `title` read it
 * (with `{ self: true, optional: true }`) and drop the `title` while the tooltip is active,
 * so the browser does not show a second tooltip.
 */
export interface UiTooltipHost {
  /** Whether the tooltip has a message and is not disabled. */
  readonly active: Signal<boolean>;
}

export const UI_TOOLTIP_HOST = new InjectionToken<UiTooltipHost>('UiTooltipHost');

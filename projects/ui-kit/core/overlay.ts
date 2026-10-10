import type { ConnectedPosition, OverlayRef } from '@angular/cdk/overlay';
import { resolveDirection } from './direction';

/** Dropdown panel: below the start edge of the origin, above it when there is no room. */
export const UI_DROPDOWN_POSITIONS: readonly ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/**
 * Dropdown panel that is wider than its origin (a calendar): like `UI_DROPDOWN_POSITIONS`, then
 * below the end edge when the panel does not fit after the start edge.
 */
export const UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK: readonly ConnectedPosition[] = [
  ...UI_DROPDOWN_POSITIONS,
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
];

/** Side of the origin a tooltip or popover opens on. `start`/`end` follow the direction. */
export type UiOverlaySide = 'top' | 'bottom' | 'start' | 'end';

/** Position of an overlay centered on one side of its origin. */
export const UI_SIDE_POSITIONS: Readonly<Record<UiOverlaySide, ConnectedPosition>> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
  start: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
  end: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
};

/** The side an overlay flips to when the preferred one has no room. */
export const UI_OPPOSITE_SIDE: Readonly<Record<UiOverlaySide, UiOverlaySide>> = {
  top: 'bottom',
  bottom: 'top',
  start: 'end',
  end: 'start',
};

/**
 * Positions for an overlay on the `preferred` side of its origin, with the opposite side as the
 * fallback. Each one adds the pane class `<panelClassPrefix>--<side>`, so the panel can tell
 * where it ended up.
 */
export function sideOverlayPositions(
  preferred: UiOverlaySide,
  panelClassPrefix: string,
): ConnectedPosition[] {
  return [preferred, UI_OPPOSITE_SIDE[preferred]].map((side) => ({
    ...UI_SIDE_POSITIONS[side],
    panelClass: `${panelClassPrefix}--${side}`,
  }));
}

/**
 * Sets the overlay direction from the closest `dir` attribute of `host`. The CDK reads the
 * direction once at startup, so call it each time the overlay opens to follow runtime changes.
 */
export function syncOverlayDirection(
  overlayRef: OverlayRef | null | undefined,
  host: Element,
): void {
  overlayRef?.setDirection(resolveDirection(host));
}

/** Edges of a box, in pixels from the top-left corner of the visible viewport. */
export interface UiOverlayBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * How far to move an overlay so it stays `margin` px clear of every viewport edge. Zero when it
 * fits by the CDK's own test (one of its positions was applied as is), so unpushed overlays stay
 * put. Too large for the viewport, the overlay keeps its top edge and its inline-start edge (the
 * left one in LTR, the right one in RTL) on screen.
 */
export function pushOnScreen(
  box: UiOverlayBox,
  viewport: { width: number; height: number },
  margin: number,
  direction: 'ltr' | 'rtl' = 'ltr',
): { x: number; y: number } {
  // The CDK's fit test: a position fits from 0 to the size less both margins.
  const fits =
    box.left >= 0 &&
    box.top >= 0 &&
    box.right <= viewport.width - 2 * margin &&
    box.bottom <= viewport.height - 2 * margin;
  if (fits) return { x: 0, y: 0 };
  // Brings the far edge inside the margin without moving the kept edge past it: when the box is
  // too large, the kept edge wins.
  const push = (start: number, end: number, size: number, keepEnd = false) =>
    (keepEnd
      ? Math.min(size - margin - end, Math.max(0, margin - start))
      : Math.max(margin - start, Math.min(0, size - margin - end))) || 0;
  return {
    x: push(box.left, box.right, viewport.width, direction === 'rtl'),
    y: push(box.top, box.bottom, viewport.height),
  };
}

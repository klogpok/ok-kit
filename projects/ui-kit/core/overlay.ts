import type { Injector } from '@angular/core';
import {
  type ConnectedPosition,
  type FlexibleConnectedPositionStrategy,
  type OverlayRef,
  type PositionStrategy,
  createFlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import { ViewportRuler } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
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
  return overlayPlacementPositions(preferred, panelClassPrefix);
}

/**
 * Corner of the trigger a tooltip or popover opens diagonally outside of: above or below it,
 * entirely before its start edge or after its end edge. `start`/`end` follow the direction.
 */
export type UiOverlayCorner =
  'corner-top-start' | 'corner-top-end' | 'corner-bottom-start' | 'corner-bottom-end';

/** Where a tooltip or popover sits against its trigger: a side or a corner. */
export type UiOverlayPlacement = UiOverlaySide | UiOverlayCorner;

/** Every placement: the four sides, then the four corners. */
export const UI_OVERLAY_PLACEMENTS: readonly UiOverlayPlacement[] = [
  'top',
  'bottom',
  'start',
  'end',
  'corner-top-start',
  'corner-top-end',
  'corner-bottom-start',
  'corner-bottom-end',
];

/** Position of an overlay at each placement. A corner's inline edge meets the trigger's. */
const PLACEMENT_POSITIONS: Readonly<Record<UiOverlayPlacement, ConnectedPosition>> = {
  ...UI_SIDE_POSITIONS,
  'corner-top-start': { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
  'corner-top-end': { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  'corner-bottom-start': { originX: 'start', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  'corner-bottom-end': { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
};

/**
 * The placement an overlay flips to when the preferred one has no room: the opposite side, or the
 * vertical mirror of a corner (it keeps its inline side; the push handles the inline axis).
 */
const FLIPPED_PLACEMENT: Readonly<Record<UiOverlayPlacement, UiOverlayPlacement>> = {
  ...UI_OPPOSITE_SIDE,
  'corner-top-start': 'corner-bottom-start',
  'corner-bottom-start': 'corner-top-start',
  'corner-top-end': 'corner-bottom-end',
  'corner-bottom-end': 'corner-top-end',
};

/**
 * Positions for an overlay at the `preferred` placement of its trigger, then at its flip (see
 * `UiOverlayPlacement`). Each one adds the pane class `<panelClassPrefix>--<placement>`, so the
 * panel can tell where it ended up. For a side it equals `sideOverlayPositions()`.
 */
export function overlayPlacementPositions(
  preferred: UiOverlayPlacement,
  panelClassPrefix: string,
): ConnectedPosition[] {
  return [preferred, FLIPPED_PLACEMENT[preferred]].map((placement) => ({
    ...PLACEMENT_POSITIONS[placement],
    panelClass: `${panelClassPrefix}--${placement}`,
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
 * The positions whose block axis fits (`height` tall, from 0 to `viewportHeight` less both
 * margins, like the CDK's fit test), or all of them when none does: a push then only moves the
 * overlay along the origin, never onto it. A position that fits in full is among them, so this
 * changes the CDK's choice only when none fits. That choice compares the visible areas, and an
 * overlay past the viewport edge on the inline axis has none (or a negative one), so the CDK
 * kept a top corner with no room above and the push moved it over the origin.
 */
export function blockFittingPositions(
  positions: readonly ConnectedPosition[],
  origin: { top: number; bottom: number },
  height: number,
  viewportHeight: number,
  margin: number,
): ConnectedPosition[] {
  const limit = viewportHeight - 2 * margin;
  const fits = ({ originY, overlayY }: ConnectedPosition) => {
    // A start or end side is centered on the block axis; a push keeps it beside the origin.
    if (overlayY === 'center') return true;
    const edge = originY === 'top' ? origin.top : origin.bottom;
    const top = overlayY === 'bottom' ? edge - height : edge;
    return top >= 0 && top + height <= limit;
  };
  const fitting = positions.filter(fits);
  return fitting.length ? fitting : [...positions];
}

/**
 * Position strategy of a tooltip or popover: wraps the CDK connected strategy (flexible dimensions
 * off) and applies it again with the positions that fit on the block axis (`blockFittingPositions`
 * above), so an overlay at a viewport corner flips instead of being pushed over its origin. It
 * also applies itself on a window resize: the CDK does that without going through a wrapper, with
 * the positions that fitted before. With `push` the CDK pushes the overlay back on screen (the
 * tooltip); a subclass that pushes itself passes `false` (the popover).
 */
export class UiBlockFittingPositionStrategy implements PositionStrategy {
  /** The wrapped CDK strategy, for its `positionChanges`. Configure it through `configure()`. */
  readonly connected: FlexibleConnectedPositionStrategy;
  protected overlayRef: OverlayRef | null = null;
  protected margin = 0;
  protected offsetX = 0;
  private positions: ConnectedPosition[] = [];
  private resize = Subscription.EMPTY;

  constructor(
    private readonly origin: HTMLElement,
    private readonly injector: Injector,
    push: boolean,
  ) {
    this.connected = createFlexibleConnectedPositionStrategy(injector, origin)
      .withFlexibleDimensions(false)
      .withPush(push);
  }

  /**
   * Sets the positions, the viewport margin and `overlayOffsetX()` (the visible viewport starts
   * after a page scrollbar on the left). Read them each time the overlay opens.
   */
  configure(positions: ConnectedPosition[], margin: number, offsetX: number): void {
    this.positions = positions;
    this.margin = margin;
    this.offsetX = offsetX;
    this.connected.withPositions(positions).withViewportMargin(margin).withDefaultOffsetX(offsetX);
  }

  attach(overlayRef: OverlayRef): void {
    this.connected.attach(overlayRef);
    this.overlayRef = overlayRef;
    // Subscribed after the CDK strategy's own resize listener, so this apply wins.
    this.resize.unsubscribe();
    this.resize = this.injector
      .get(ViewportRuler)
      .change()
      .subscribe(() => this.apply());
  }

  apply(): void {
    this.connected.withPositions(this.positions).apply();
    const pane = this.overlayRef?.overlayElement;
    if (!pane?.isConnected) return;
    // The pane has its real height only once the CDK has laid out its bounding box.
    const fitting = blockFittingPositions(
      this.positions,
      this.origin.getBoundingClientRect(),
      Math.floor(pane.getBoundingClientRect().height),
      pane.ownerDocument.documentElement.clientHeight,
      this.margin,
    );
    if (fitting.length < this.positions.length) this.connected.withPositions(fitting).apply();
  }

  detach(): void {
    this.resize.unsubscribe();
    this.connected.detach();
  }

  dispose(): void {
    this.resize.unsubscribe();
    this.connected.dispose();
    this.overlayRef = null;
  }
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

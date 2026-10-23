import type { ConnectedPosition, OverlayRef } from '@angular/cdk/overlay';
import {
  UI_DROPDOWN_POSITIONS,
  blockFittingPositions,
  overlayPlacementPositions,
  pushOnScreen,
  sideOverlayPositions,
  syncOverlayDirection,
} from './overlay';

describe('syncOverlayDirection', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('sets the direction of the closest dir attribute of the host, read at call time', () => {
    root.innerHTML = '<div dir="ltr"><span id="host"></span></div>';
    const host = root.querySelector('#host')!;
    const setDirection = vi.fn();
    const overlayRef = { setDirection } as unknown as OverlayRef;

    syncOverlayDirection(overlayRef, host);
    host.parentElement!.setAttribute('dir', 'rtl');
    syncOverlayDirection(overlayRef, host);

    expect(setDirection.mock.calls).toEqual([['ltr'], ['rtl']]);
  });

  it('does nothing without an overlay', () => {
    expect(() => syncOverlayDirection(undefined, root)).not.toThrow();
  });
});

describe('sideOverlayPositions', () => {
  it('returns the preferred side, then the opposite one, each with its pane class', () => {
    expect(sideOverlayPositions('start', 'ui-x-pane')).toEqual([
      {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
        panelClass: 'ui-x-pane--start',
      },
      {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
        panelClass: 'ui-x-pane--end',
      },
    ]);
  });

  it('places top above the origin, centered, and falls back below', () => {
    const [top, bottom] = sideOverlayPositions('top', 'p');
    expect(top).toMatchObject({ originY: 'top', overlayY: 'bottom', originX: 'center' });
    expect(bottom).toMatchObject({ originY: 'bottom', overlayY: 'top', panelClass: 'p--bottom' });
  });
});

describe('overlayPlacementPositions', () => {
  it('centers a side on its edge of the trigger and flips it to the opposite side', () => {
    expect(overlayPlacementPositions('bottom', 'p')).toEqual([
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        panelClass: 'p--bottom',
      },
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        panelClass: 'p--top',
      },
    ]);
  });

  it('gives a side the same positions as sideOverlayPositions', () => {
    for (const side of ['top', 'bottom', 'start', 'end'] as const) {
      expect(overlayPlacementPositions(side, 'p')).toEqual(sideOverlayPositions(side, 'p'));
    }
  });

  // Each corner sits diagonally outside the trigger: its inline edge meets the trigger's opposite
  // edge, its block edge meets the trigger's top or bottom.
  const topStart = {
    originX: 'start',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    panelClass: 'p--corner-top-start',
  };
  const topEnd = {
    originX: 'end',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    panelClass: 'p--corner-top-end',
  };
  const bottomStart = {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    panelClass: 'p--corner-bottom-start',
  };
  const bottomEnd = {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    panelClass: 'p--corner-bottom-end',
  };

  it('places a corner outside the trigger and flips it to its vertical mirror', () => {
    expect(overlayPlacementPositions('corner-top-start', 'p')).toEqual([topStart, bottomStart]);
    expect(overlayPlacementPositions('corner-top-end', 'p')).toEqual([topEnd, bottomEnd]);
    expect(overlayPlacementPositions('corner-bottom-start', 'p')).toEqual([bottomStart, topStart]);
    expect(overlayPlacementPositions('corner-bottom-end', 'p')).toEqual([bottomEnd, topEnd]);
  });
});

describe('UI_DROPDOWN_POSITIONS', () => {
  it('opens below the start edge and falls back above it', () => {
    expect(UI_DROPDOWN_POSITIONS).toEqual([
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    ]);
  });
});

describe('blockFittingPositions', () => {
  // A 300 px tall viewport with an 8 px margin and a 60 px tall overlay.
  const [topStart, bottomStart] = overlayPlacementPositions('corner-top-start', 'p');
  const [top, bottom] = overlayPlacementPositions('top', 'p');
  const [start, end] = overlayPlacementPositions('start', 'p');
  const fitting = (
    positions: ConnectedPosition[],
    origin: { top: number; bottom: number },
    height = 60,
  ) => blockFittingPositions(positions, origin, height, 300, 8);

  it('keeps every position that fits on the block axis', () => {
    expect(fitting([topStart, bottomStart], { top: 120, bottom: 150 })).toEqual([
      topStart,
      bottomStart,
    ]);
  });

  it('drops a position above the viewport, so the corner flips to the one below', () => {
    expect(fitting([topStart, bottomStart], { top: 10, bottom: 40 })).toEqual([bottomStart]);
  });

  it('drops a position below the viewport margin', () => {
    expect(fitting([bottom, top], { top: 250, bottom: 280 })).toEqual([top]);
  });

  it('keeps a position that ends exactly on the margin', () => {
    // 224 + 60 = 284 = 300 - 2 * 8: the CDK fit test measures from 0 to the size less both margins.
    expect(fitting([bottomStart, topStart], { top: 100, bottom: 224 })).toEqual([
      bottomStart,
      topStart,
    ]);
    expect(fitting([bottomStart, topStart], { top: 100, bottom: 225 })).toEqual([topStart]);
  });

  it('keeps all positions when none fits, so the push moves the overlay along the trigger', () => {
    expect(fitting([topStart, bottomStart], { top: 10, bottom: 40 }, 280)).toEqual([
      topStart,
      bottomStart,
    ]);
  });

  it('keeps a start or end side, which is centered on the block axis', () => {
    expect(fitting([start, end], { top: 0, bottom: 30 })).toEqual([start, end]);
  });
});

describe('pushOnScreen', () => {
  // A 400×300 viewport with an 8 px margin. Rects are relative to the visible viewport.
  const viewport = { width: 400, height: 300 };
  const rect = (left: number, top: number, width = 200, height = 100) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
  });

  it('leaves a popover that fits where it opened, even inside the margin', () => {
    expect(pushOnScreen(rect(100, 50), viewport, 8)).toEqual({ x: 0, y: 0 });
    expect(pushOnScreen(rect(3, 2), viewport, 8)).toEqual({ x: 0, y: 0 });
  });

  it('pushes a popover past the start edge back to the margin', () => {
    expect(pushOnScreen(rect(-60, 50), viewport, 8)).toEqual({ x: 68, y: 0 });
  });

  it('pushes a popover past the end edge back to the margin', () => {
    expect(pushOnScreen(rect(250, 50), viewport, 8)).toEqual({ x: -58, y: 0 });
  });

  it('keeps the margin on both sides of a popover as wide as the viewport allows', () => {
    expect(pushOnScreen(rect(100, 50, 384), viewport, 8)).toEqual({ x: -92, y: 0 });
  });

  it('pushes vertically too, keeping the top edge when the popover is too tall', () => {
    expect(pushOnScreen(rect(100, 250), viewport, 8)).toEqual({ x: 0, y: -58 });
    expect(pushOnScreen(rect(100, -40, 200, 400), viewport, 8)).toEqual({ x: 0, y: 48 });
  });

  it('keeps the inline-start edge of a popover wider than the viewport: left in LTR, right in RTL', () => {
    // 500 px wide in a 400 px viewport, opened 50 px from the left.
    expect(pushOnScreen(rect(50, 50, 500), viewport, 8, 'ltr')).toEqual({ x: -42, y: 0 });
    expect(pushOnScreen(rect(50, 50, 500), viewport, 8, 'rtl')).toEqual({ x: -158, y: 0 });
  });

  it('pushes the same way in RTL when the popover fits between the margins', () => {
    expect(pushOnScreen(rect(-60, 50), viewport, 8, 'rtl')).toEqual({ x: 68, y: 0 });
    expect(pushOnScreen(rect(250, 50), viewport, 8, 'rtl')).toEqual({ x: -58, y: 0 });
  });
});

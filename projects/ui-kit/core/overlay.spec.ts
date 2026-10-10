import type { OverlayRef } from '@angular/cdk/overlay';
import { UI_DROPDOWN_POSITIONS, sideOverlayPositions, syncOverlayDirection } from './overlay';

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

describe('UI_DROPDOWN_POSITIONS', () => {
  it('opens below the start edge and falls back above it', () => {
    expect(UI_DROPDOWN_POSITIONS).toEqual([
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    ]);
  });
});

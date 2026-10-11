import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiDropdownPanel } from './dropdown-panel';
import { UI_DROPDOWN_POSITIONS, UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK } from './overlay';

@Component({
  imports: [UiDropdownPanel, CdkOverlayOrigin],
  template: `
    <div [attr.dir]="dir()">
      <button type="button" id="origin" cdkOverlayOrigin #o="cdkOverlayOrigin">open</button>
      <ng-template [uiDropdownPanel]="o" [open]="open()" (closed)="onClosed()">
        <div class="panel"><button type="button" id="inside">inside</button></div>
      </ng-template>
    </div>
    <p id="outside">outside</p>
  `,
})
class Host {
  readonly dir = signal('rtl');
  readonly open = signal(false);
  closedCount = 0;
  readonly cdk = viewChild.required(UiDropdownPanel, { read: CdkConnectedOverlay });
  onClosed() {
    this.closedCount++;
    this.open.set(false);
  }
}

/** A calendar-like panel: wider positions, its own width, focus inside and back to a button. */
@Component({
  imports: [UiDropdownPanel],
  template: `
    <div #field class="field">
      <button type="button" #toggle id="toggle">toggle</button>
    </div>
    <ng-template
      [uiDropdownPanel]="field"
      [open]="open()"
      [positions]="positions"
      [matchWidth]="false"
      [returnFocusTo]="toggle"
      (attached)="attached = attached + 1"
      (closed)="open.set(false)"
    >
      <div class="panel"><button type="button" id="inside">inside</button></div>
    </ng-template>
    <button type="button" id="elsewhere">elsewhere</button>
  `,
})
class CalendarHost {
  readonly open = signal(false);
  readonly positions = UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK;
  attached = 0;
  readonly cdk = viewChild.required(UiDropdownPanel, { read: CdkConnectedOverlay });
}

/** Stubs the layout jsdom lacks: the origin box and the left edge of the overlay container. */
function stubLayout(originId: string) {
  const layout = { width: 200, containerLeft: 0 };
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.id === originId) {
      return DOMRect.fromRect({ x: 100, y: 20, width: layout.width, height: 30 });
    }
    // The fixed probe of overlayOffsetX().
    if (this.style.position === 'fixed' && this.style.visibility === 'hidden') {
      return DOMRect.fromRect({ x: layout.containerLeft, y: 0, width: 0, height: 0 });
    }
    return DOMRect.fromRect();
  });
  return layout;
}

async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function click(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function escape() {
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
  );
}

function find(fixture: { nativeElement: unknown }, selector: string): HTMLElement {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector)!;
}

const pane = () => document.querySelector('.cdk-overlay-pane .panel');

describe('UiDropdownPanel', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens in the direction of the origin, read when it opens', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    await settle(fixture);
    expect(pane()).toBeNull();

    host.open.set(true);
    await settle(fixture);
    expect(pane()?.textContent).toBe('inside');
    expect(pane()?.closest('[dir]')?.getAttribute('dir')).toBe('rtl');

    host.open.set(false);
    host.dir.set('ltr');
    await settle(fixture);
    host.open.set(true);
    await settle(fixture);
    expect(pane()?.closest('[dir]')?.getAttribute('dir')).toBe('ltr');
  });

  it('closes on a click outside, but not on its origin', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.open.set(true);
    await settle(fixture);

    click(find(fixture, '#origin'));
    await settle(fixture);
    expect(host.closedCount).toBe(0);

    click(find(fixture, '#outside'));
    await settle(fixture);
    expect(host.closedCount).toBe(1);
    expect(pane()).toBeNull();
  });

  it('closes on Escape once, and opens again', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.open.set(true);
    await settle(fixture);

    escape();
    await settle(fixture);
    expect(host.closedCount).toBe(1);
    expect(host.open()).toBe(false);
    expect(pane()).toBeNull();

    host.open.set(true);
    await settle(fixture);
    expect(pane()).not.toBeNull();
  });

  // Guards the CDK behavior the directive relies on: the offsetX setter re-applies the origin and
  // the positions to an existing overlay, and minWidth needs updateSize() on a reopen.
  it('takes the origin width and the container offset each time it opens', async () => {
    const layout = stubLayout('origin');
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.open.set(true);
    await settle(fixture);
    const overlayPane = document.querySelector<HTMLElement>('.cdk-overlay-pane')!;
    expect(overlayPane.style.minWidth).toBe('200px');
    expect(overlayPane.style.transform).toBe('');

    host.open.set(false);
    await settle(fixture);
    layout.width = 300;
    layout.containerLeft = -15;
    host.open.set(true);
    await settle(fixture);
    expect(overlayPane.style.minWidth).toBe('300px');
    expect(overlayPane.style.transform).toBe('translateX(15px)');
    expect(host.cdk().positions).toMatchObject([...UI_DROPDOWN_POSITIONS]);
  });

  it('can keep its own width and use other positions', async () => {
    stubLayout('never');
    const fixture = TestBed.createComponent(CalendarHost);
    const host = fixture.componentInstance;
    host.open.set(true);
    await settle(fixture);
    expect(document.querySelector<HTMLElement>('.cdk-overlay-pane')!.style.minWidth).toBe('');
    expect(host.cdk().positions).toMatchObject([...UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK]);
  });

  it('reports each attach, once the content is in the page', async () => {
    const fixture = TestBed.createComponent(CalendarHost);
    const host = fixture.componentInstance;
    host.open.set(true);
    await settle(fixture);
    expect(host.attached).toBe(1);
    expect(document.querySelector('#inside')).not.toBeNull();

    host.open.set(false);
    await settle(fixture);
    host.open.set(true);
    await settle(fixture);
    expect(host.attached).toBe(2);
  });

  describe('focus return', () => {
    async function openWithFocusInside() {
      const fixture = TestBed.createComponent(CalendarHost);
      fixture.autoDetectChanges();
      fixture.componentInstance.open.set(true);
      await settle(fixture);
      document.querySelector<HTMLElement>('#inside')!.focus();
      return fixture;
    }

    it('moves focus from the panel to returnFocusTo when the field closes it', async () => {
      const fixture = await openWithFocusInside();
      fixture.componentInstance.open.set(false);
      await settle(fixture);
      expect(document.activeElement?.id).toBe('toggle');
    });

    it('moves focus lost with the panel on Escape to returnFocusTo', async () => {
      const fixture = await openWithFocusInside();
      escape();
      await settle(fixture);
      expect(fixture.componentInstance.open()).toBe(false);
      expect(pane()).toBeNull();
      expect(document.activeElement?.id).toBe('toggle');
    });

    it('leaves focus that already moved out of the panel', async () => {
      const fixture = await openWithFocusInside();
      find(fixture, '#elsewhere').focus();
      fixture.componentInstance.open.set(false);
      await settle(fixture);
      expect(document.activeElement?.id).toBe('elsewhere');
    });

    it('does not move focus on the first render or while closed', async () => {
      const fixture = TestBed.createComponent(CalendarHost);
      await settle(fixture);
      expect(document.activeElement).toBe(document.body);
    });
  });

  it('closes without a closed event when the field is destroyed', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    host.open.set(true);
    await settle(fixture);

    fixture.destroy();
    expect(host.closedCount).toBe(0);
    expect(pane()).toBeNull();
  });
});

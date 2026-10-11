import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiDropdownPanel } from './dropdown-panel';

@Component({
  imports: [UiDropdownPanel, CdkOverlayOrigin],
  template: `
    <div dir="rtl">
      <button type="button" id="origin" cdkOverlayOrigin #o="cdkOverlayOrigin">open</button>
      <ng-template [uiDropdownPanel]="o" [open]="open()" (closed)="onClosed()">
        <div class="panel">panel</div>
      </ng-template>
    </div>
    <p id="outside">outside</p>
  `,
})
class Host {
  readonly open = signal(false);
  closedCount = 0;
  readonly cdk = viewChild.required(UiDropdownPanel, { read: CdkConnectedOverlay });
  onClosed() {
    this.closedCount++;
    this.open.set(false);
  }
}

async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  fixture.detectChanges();
  await fixture.whenStable();
}

function click(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('UiDropdownPanel (prototype)', () => {
  it('opens, syncs direction from the origin, closes on outside click only', async () => {
    const fixture = TestBed.createComponent(Host);
    const host = fixture.componentInstance;
    await settle(fixture);
    expect(document.querySelector('.cdk-overlay-pane')).toBeNull();

    host.open.set(true);
    await settle(fixture);

    const pane = document.querySelector('.cdk-overlay-pane')!;
    expect(pane.querySelector('.panel')?.textContent).toBe('panel');
    expect(host.cdk().overlayRef.getDirection()).toBe('rtl');
    expect(pane.closest('[dir]')?.getAttribute('dir')).toBe('rtl');
    expect(host.cdk().positions[0]).toEqual(
      expect.objectContaining({ originX: 'start', overlayY: 'top' }),
    );

    click(fixture.nativeElement.querySelector('#origin'));
    await settle(fixture);
    expect(host.closedCount).toBe(0);

    click(fixture.nativeElement.querySelector('#outside'));
    await settle(fixture);
    expect(host.closedCount).toBe(1);
    expect(document.querySelector('.cdk-overlay-pane .panel')).toBeNull();

    // Reopen works (overlayRef reused) and Escape detaches -> closed.
    host.open.set(true);
    await settle(fixture);
    expect(document.querySelector('.cdk-overlay-pane .panel')).not.toBeNull();
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
    );
    await settle(fixture);
    expect(host.closedCount).toBe(2);
    expect(host.open()).toBe(false);
  });
});

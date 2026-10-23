import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { UiDialog } from '@vplans/ui-kit/dialog';
import { UiPopoverPosition, UiPopoverTrigger } from './popover';

// jsdom has no layout, so the real checker treats every element as hidden.
const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]';
const focusable = (el: HTMLElement) => el.matches(FOCUSABLE) && !el.hasAttribute('disabled');
const layoutFreeChecker: Partial<InteractivityChecker> = {
  isFocusable: focusable,
  isTabbable: (el) => focusable(el) && el.tabIndex >= 0,
  isVisible: () => true,
  isDisabled: (el) => el.hasAttribute('disabled'),
};

@Component({
  imports: [UiPopoverTrigger],
  template: `
    <div [attr.dir]="dir()">
      <button
        id="trigger"
        type="button"
        [uiPopoverTriggerFor]="content"
        [uiPopoverPosition]="position()"
        [uiPopoverLabel]="label()"
        [uiPopoverDisabled]="disabled()"
        (opened)="events.push('opened')"
        (closed)="events.push('closed')"
      >
        Filters
      </button>
      <button id="outside" type="button">Outside</button>
    </div>
    <ng-template #content let-close="close">
      <p>Show plans</p>
      <input id="first" aria-label="Owner" />
      <button id="apply" type="button" (click)="close()">Apply</button>
    </ng-template>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly position = signal<UiPopoverPosition>('bottom');
  readonly label = signal('');
  readonly disabled = signal(false);
  readonly events: string[] = [];
  readonly trigger = viewChild.required(UiPopoverTrigger);
}

describe('UiPopoverTrigger', () => {
  let fixture: ComponentFixture<Host>;
  const trigger = () => document.querySelector<HTMLButtonElement>('#trigger')!;
  const panel = () => document.querySelector<HTMLElement>('ui-popover-panel');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  };
  const escape = (target: Element) =>
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }),
    );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: InteractivityChecker, useValue: layoutFreeChecker }],
    });
    fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => (fixture.nativeElement as HTMLElement).remove());

  it('links the trigger to the closed popover', () => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().hasAttribute('aria-controls')).toBe(false);
    expect(trigger().id).toBe('trigger');
    expect(panel()).toBeNull();
  });

  it('opens a non-modal dialog named by the trigger and focuses the first field', async () => {
    trigger().click();
    await settle();
    const popover = panel()!;
    expect(popover.getAttribute('role')).toBe('dialog');
    expect(popover.hasAttribute('aria-modal')).toBe(false);
    expect(popover.getAttribute('aria-labelledby')).toBe('trigger');
    expect(popover.textContent).toContain('Show plans');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(popover.id);
    expect(document.activeElement?.id).toBe('first');
    expect(fixture.componentInstance.events).toEqual(['opened']);
  });

  it('uses the label as the name when given', async () => {
    fixture.componentInstance.label.set('Plan filters');
    await settle();
    trigger().click();
    await settle();
    expect(panel()?.getAttribute('aria-label')).toBe('Plan filters');
    expect(panel()?.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('closes on a second trigger click', async () => {
    trigger().click();
    await settle();
    trigger().click();
    await settle();
    expect(panel()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.events).toEqual(['opened', 'closed']);
  });

  it('removes an open popover with its trigger without emitting closed (NG0953)', async () => {
    trigger().click();
    await settle();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fixture.destroy();
    expect(panel()).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('closes on Escape, returns focus and keeps Escape from reaching the page', async () => {
    trigger().click();
    await settle();
    const onDocument = vi.fn();
    document.addEventListener('keydown', onDocument);
    escape(document.querySelector('#first')!);
    await settle();
    document.removeEventListener('keydown', onDocument);
    expect(panel()).toBeNull();
    expect(onDocument).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes from the template with close()', async () => {
    trigger().click();
    await settle();
    document.querySelector<HTMLButtonElement>('#apply')!.click();
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes when focus tabs out, leaving focus where it went', async () => {
    trigger().click();
    await settle();
    const outside = document.querySelector<HTMLButtonElement>('#outside')!;
    // Focus is on the first field; moving it out fires focusout with the new target.
    outside.focus();
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(outside);
    expect(fixture.componentInstance.events).toEqual(['opened', 'closed']);
  });

  it('closes on a click outside', async () => {
    trigger().click();
    await settle();
    const outside = document.querySelector<HTMLButtonElement>('#outside')!;
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(panel()).toBeNull();
  });

  it('opens in code, follows the direction and stays shut when disabled', async () => {
    fixture.componentInstance.dir.set('rtl');
    await settle();
    fixture.componentInstance.trigger().open();
    await settle();
    expect(panel()?.closest('[dir]')?.getAttribute('dir')).toBe('rtl');
    fixture.componentInstance.trigger().close();
    await settle();

    fixture.componentInstance.disabled.set(true);
    await settle();
    trigger().click();
    await settle();
    expect(panel()).toBeNull();
  });

  it('opens in each corner with its panel class', async () => {
    const corners: UiPopoverPosition[] = [
      'corner-top-start',
      'corner-top-end',
      'corner-bottom-start',
      'corner-bottom-end',
    ];
    for (const corner of corners) {
      fixture.componentInstance.position.set(corner);
      await settle();
      fixture.componentInstance.trigger().open();
      await settle();
      expect(panel()?.classList).toContain(`ui-popover--${corner}`);
      fixture.componentInstance.trigger().close();
      await settle();
    }
  });

  describe('in a corner', () => {
    // A 400×300 viewport with an 8 px margin, a 120×60 popover and an 80×30 trigger.
    const viewport = { width: 400, height: 300 };
    const size = { width: 120, height: 60 };
    let triggerBox: DOMRect;
    const pane = () => panel()!.closest<HTMLElement>('.cdk-overlay-pane')!;

    /** Where the pane is drawn: from the CDK's `left`/`right`/`top`/`bottom` and the push. */
    function paneBox(element: HTMLElement): DOMRect {
      const { left, right, top, bottom, transform } = element.style;
      const x = left
        ? parseFloat(left)
        : right
          ? viewport.width - parseFloat(right) - size.width
          : 0;
      const y = top
        ? parseFloat(top)
        : bottom
          ? viewport.height - parseFloat(bottom) - size.height
          : 0;
      const push = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(transform);
      return DOMRect.fromRect({
        x: x + (push ? parseFloat(push[1]) : 0),
        y: y + (push ? parseFloat(push[2]) : 0),
        ...size,
      });
    }

    const open = async (corner: UiPopoverPosition, dir: 'ltr' | 'rtl', box: DOMRect) => {
      triggerBox = box;
      fixture.componentInstance.dir.set(dir);
      fixture.componentInstance.position.set(corner);
      await settle();
      fixture.componentInstance.trigger().open();
      await settle();
      return paneBox(pane());
    };

    beforeEach(() => {
      const root = document.documentElement;
      root.style.setProperty('--ui-popover-viewport-margin', '8px');
      vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(viewport.width);
      vi.spyOn(root, 'clientHeight', 'get').mockReturnValue(viewport.height);
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        if (this.id === 'trigger') return triggerBox;
        if (this.classList.contains('cdk-overlay-pane')) return paneBox(this);
        return DOMRect.fromRect();
      });
    });

    afterEach(() => {
      document.documentElement.style.removeProperty('--ui-popover-viewport-margin');
      vi.restoreAllMocks();
    });

    const middle = DOMRect.fromRect({ x: 160, y: 120, width: 80, height: 30 });

    it('sits diagonally outside the corner, before the start edge in LTR', async () => {
      const topStart = await open('corner-top-start', 'ltr', middle);
      expect([topStart.right, topStart.bottom]).toEqual([middle.left, middle.top]);
      fixture.componentInstance.trigger().close();
      const bottomEnd = await open('corner-bottom-end', 'ltr', middle);
      expect([bottomEnd.left, bottomEnd.top]).toEqual([middle.right, middle.bottom]);
    });

    it('mirrors the inline side in RTL: start is on the right', async () => {
      const topStart = await open('corner-top-start', 'rtl', middle);
      expect([topStart.left, topStart.bottom]).toEqual([middle.right, middle.top]);
      fixture.componentInstance.trigger().close();
      const bottomEnd = await open('corner-bottom-end', 'rtl', middle);
      expect([bottomEnd.right, bottomEnd.top]).toEqual([middle.left, middle.bottom]);
    });

    it('flips a top corner with no room above to the bottom corner on the same side', async () => {
      const atTop = DOMRect.fromRect({ x: 160, y: 10, width: 80, height: 30 });
      const box = await open('corner-top-start', 'ltr', atTop);
      expect(panel()?.classList).toContain('ui-popover--corner-bottom-start');
      expect([box.right, box.top]).toEqual([atTop.left, atTop.bottom]);
    });

    it('is pushed inside the viewport without covering the trigger', async () => {
      // At the inline-start edge: no room before it, in LTR on the left, in RTL on the right.
      for (const dir of ['ltr', 'rtl'] as const) {
        const x = dir === 'ltr' ? 20 : viewport.width - 100;
        const atEdge = DOMRect.fromRect({ x, y: 120, width: 80, height: 30 });
        const box = await open('corner-top-start', dir, atEdge);
        expect(panel()?.classList).toContain('ui-popover--corner-top-start');
        expect(dir === 'ltr' ? box.left : viewport.width - box.right).toBe(8);
        expect(box.bottom).toBe(atEdge.top);
        fixture.componentInstance.trigger().close();
        await settle();
      }
    });

    it('flips before the push when the corner is off screen on the inline axis', async () => {
      // A trigger in the top corner of the viewport at its inline-start edge: neither corner shows
      // any of the popover, so the CDK keeps the preferred one; pushed down, it covered the trigger.
      for (const dir of ['ltr', 'rtl'] as const) {
        const x = dir === 'ltr' ? 0 : viewport.width - 80;
        const atCorner = DOMRect.fromRect({ x, y: 10, width: 80, height: 30 });
        const box = await open('corner-top-start', dir, atCorner);
        expect(panel()?.classList).toContain('ui-popover--corner-bottom-start');
        expect(dir === 'ltr' ? box.left : viewport.width - box.right).toBe(8);
        expect(box.top).toBe(atCorner.bottom);
        fixture.componentInstance.trigger().close();
        await settle();
      }
    });
  });

  it('closes on Escape while focus is still on the trigger', async () => {
    fixture.componentInstance.trigger().open();
    await settle();
    trigger().focus();
    escape(trigger());
    await settle();
    expect(panel()).toBeNull();
    expect(fixture.componentInstance.events).toEqual(['opened', 'closed']);
  });

  it('reads the viewport margin token in rem', async () => {
    document.documentElement.style.setProperty('--ui-popover-viewport-margin', '0.5rem');
    try {
      fixture.componentInstance.trigger().open();
      await settle();
      expect(panel()).not.toBeNull();
    } finally {
      document.documentElement.style.removeProperty('--ui-popover-viewport-margin');
    }
  });

  it('fits the overlay container less the viewport margins, not 100vw', async () => {
    document.documentElement.style.setProperty('--ui-popover-viewport-margin', '12px');
    try {
      fixture.componentInstance.trigger().open();
      await settle();
      const pane = panel()!.closest<HTMLElement>('.cdk-overlay-pane')!;
      expect(pane.style.maxWidth).toBe('calc(100% - 24px)');
    } finally {
      document.documentElement.style.removeProperty('--ui-popover-viewport-margin');
    }
  });

  it('closes only itself on Escape inside a dialog', async () => {
    @Component({
      imports: [UiPopoverTrigger],
      template: `
        <button id="inner" type="button" [uiPopoverTriggerFor]="tpl">More</button>
        <ng-template #tpl><button id="inside" type="button">Inside</button></ng-template>
      `,
    })
    class DialogContent {}

    const ref = TestBed.inject(UiDialog).open(DialogContent);
    await settle();
    document.querySelector<HTMLButtonElement>('#inner')!.click();
    await settle();
    escape(document.querySelector('#inside')!);
    await settle();
    expect(panel()).toBeNull();
    expect(document.querySelector('ui-dialog-container')).not.toBeNull();
    ref.close();
    await settle();
  });
});

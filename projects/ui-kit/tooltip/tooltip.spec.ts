import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusMonitor } from '@angular/cdk/a11y';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UiTooltip, UiTooltipDefaults, UiTooltipPosition, provideUiTooltip } from './tooltip';

@Component({
  imports: [UiTooltip],
  template: `
    <button
      type="button"
      [uiTooltip]="message()"
      [uiTooltipDisabled]="disabled()"
      uiTooltipPosition="bottom"
      uiTooltipShowDelay="200"
      uiTooltipHideDelay="50"
    >
      Delete
    </button>
  `,
})
class Host {
  readonly message = signal('Delete the plan');
  readonly disabled = signal(false);
  readonly tooltip = viewChild.required(UiTooltip);
}

describe('UiTooltip', () => {
  let fixture: ComponentFixture<Host>;
  let button: HTMLButtonElement;
  const panel = () => document.querySelector<HTMLElement>('ui-tooltip-panel');
  const describedText = () => {
    const ids = button.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map((id) => document.getElementById(id)?.textContent).join(' ');
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  });

  afterEach(() => {
    vi.useRealTimers();
    (fixture.nativeElement as HTMLElement).remove();
  });

  const pointer = (type: string, pointerType = 'mouse') =>
    Object.assign(new MouseEvent(type), { pointerType });

  it('does not show for a touch, which would leave a sticky bubble', () => {
    button.dispatchEvent(pointer('pointerenter', 'touch'));
    vi.advanceTimersByTime(1000);
    expect(panel()).toBeNull();
  });

  it('describes the host with the message', () => {
    expect(describedText()).toBe('Delete the plan');
  });

  it('shows after the delay on hover and hides after the pointer leaves', () => {
    button.dispatchEvent(pointer('pointerenter'));
    vi.advanceTimersByTime(150);
    expect(panel()).toBeNull();
    vi.advanceTimersByTime(60);
    expect(panel()?.textContent).toBe('Delete the plan');
    expect(panel()?.getAttribute('aria-hidden')).toBe('true');
    expect(panel()?.classList).toContain('ui-tooltip--bottom');

    button.dispatchEvent(pointer('pointerleave'));
    vi.advanceTimersByTime(60);
    expect(panel()).toBeNull();
  });

  it('stays open while the pointer is over the tooltip', () => {
    fixture.componentInstance.tooltip().show();
    button.dispatchEvent(pointer('pointerleave'));
    panel()!.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(100);
    expect(panel()).not.toBeNull();

    panel()!.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(100);
    expect(panel()).toBeNull();
  });

  it('shows on keyboard focus and hides on blur', () => {
    TestBed.inject(FocusMonitor).focusVia(button, 'keyboard');
    expect(panel()).not.toBeNull();
    button.blur();
    expect(panel()).toBeNull();
  });

  it('does not show on mouse focus', () => {
    TestBed.inject(FocusMonitor).focusVia(button, 'mouse');
    expect(panel()).toBeNull();
  });

  it('hides on Escape without letting the event bubble', () => {
    const outer = vi.fn();
    document.body.addEventListener('keydown', outer);
    fixture.componentInstance.tooltip().show();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(panel()).toBeNull();
    expect(outer).not.toHaveBeenCalled();

    // With the tooltip closed, Escape reaches outer handlers (e.g. a dialog).
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(outer).toHaveBeenCalledTimes(1);
    document.body.removeEventListener('keydown', outer);
  });

  it('updates the text of an open tooltip', () => {
    fixture.componentInstance.tooltip().show();
    fixture.componentInstance.message.set('Remove');
    fixture.detectChanges();
    expect(panel()?.textContent).toBe('Remove');
    expect(describedText()).toBe('Remove');
  });

  it('does nothing when disabled or empty', () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    fixture.componentInstance.tooltip().show();
    expect(panel()).toBeNull();

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.message.set('  ');
    fixture.detectChanges();
    fixture.componentInstance.tooltip().show();
    expect(panel()).toBeNull();
  });

  it('closes an open tooltip when it becomes disabled', () => {
    fixture.componentInstance.tooltip().show();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });
});

@Component({
  imports: [UiIconButton, UiTooltip],
  template: `
    <button
      ui-icon-button
      label="Delete"
      [disabled]="buttonDisabled()"
      [uiTooltip]="message()"
      [uiTooltipDisabled]="disabled()"
    >
      x
    </button>
    <button ui-icon-button label="Close" id="plain">x</button>
  `,
})
class IconHost {
  readonly message = signal('Delete the plan');
  readonly disabled = signal(false);
  readonly buttonDisabled = signal(false);
}

describe('UiTooltip on ui-icon-button', () => {
  it('removes the native title while the tooltip is active', async () => {
    const fixture = TestBed.createComponent(IconHost);
    await fixture.whenStable();
    const [button, plain] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    );
    expect(button.hasAttribute('title')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Delete');
    expect(plain.getAttribute('title')).toBe('Close');

    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    expect(button.getAttribute('title')).toBe('Delete');

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.message.set('');
    await fixture.whenStable();
    expect(button.getAttribute('title')).toBe('Delete');

    fixture.componentInstance.message.set('   ');
    await fixture.whenStable();
    expect(button.getAttribute('title')).toBe('Delete');
  });

  it('leaves out the native title of a disabled button too', async () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.componentInstance.buttonDisabled.set(true);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.disabled).toBe(true);
    expect(button.hasAttribute('title')).toBe(false);
  });
});

@Component({
  imports: [UiTooltip],
  template: `
    <a href="/plans" title="Open" [uiTooltip]="message()" [uiTooltipDisabled]="disabled()">Plans</a>
    <span [attr.title]="title()" [uiTooltip]="message()">Status</span>
  `,
})
class TitleHost {
  readonly message = signal('Open the plan list');
  readonly disabled = signal(false);
  readonly title = signal<string | null>('Draft');
}

describe('UiTooltip native title', () => {
  let fixture: ComponentFixture<TitleHost>;
  let link: HTMLElement;
  let span: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TitleHost);
    await fixture.whenStable();
    link = (fixture.nativeElement as HTMLElement).querySelector('a')!;
    span = (fixture.nativeElement as HTMLElement).querySelector('span')!;
  });

  it('takes off a static title while active and puts it back after', async () => {
    expect(link.hasAttribute('title')).toBe(false);

    fixture.componentInstance.disabled.set(true);
    await fixture.whenStable();
    expect(link.getAttribute('title')).toBe('Open');

    fixture.componentInstance.disabled.set(false);
    await fixture.whenStable();
    expect(link.hasAttribute('title')).toBe(false);

    fixture.componentInstance.message.set('');
    await fixture.whenStable();
    expect(link.getAttribute('title')).toBe('Open');
  });

  it('keeps a bound title off and puts back its latest value', async () => {
    expect(span.hasAttribute('title')).toBe(false);

    fixture.componentInstance.title.set('Signed');
    await fixture.whenStable();
    expect(span.hasAttribute('title')).toBe(false);

    fixture.componentInstance.message.set('');
    await fixture.whenStable();
    expect(span.getAttribute('title')).toBe('Signed');
  });
});

@Component({
  imports: [UiTooltip],
  template: `
    <button type="button" id="plain" uiTooltip="Plain">Plain</button>
    <button
      type="button"
      id="bound"
      uiTooltip="Bound"
      uiTooltipPosition="end"
      uiTooltipShowDelay="20"
      uiTooltipHideDelay="10"
    >
      Bound
    </button>
  `,
})
class DefaultsHost {}

describe('UiTooltip defaults', () => {
  let fixture: ComponentFixture<DefaultsHost>;
  const panel = () => document.querySelector<HTMLElement>('ui-tooltip-panel');
  const pointer = (type: string) => Object.assign(new MouseEvent(type), { pointerType: 'mouse' });

  async function render(defaults?: UiTooltipDefaults) {
    if (defaults) TestBed.configureTestingModule({ providers: [provideUiTooltip(defaults)] });
    vi.useFakeTimers();
    fixture = TestBed.createComponent(DefaultsHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const button = (id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(`#${id}`)!;

  afterEach(() => {
    vi.useRealTimers();
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('keeps the built-in defaults without the provider', async () => {
    await render();
    button('plain').dispatchEvent(pointer('pointerenter'));
    vi.advanceTimersByTime(290);
    expect(panel()).toBeNull();
    vi.advanceTimersByTime(20);
    expect(panel()?.classList).toContain('ui-tooltip--top');

    button('plain').dispatchEvent(pointer('pointerleave'));
    vi.advanceTimersByTime(90);
    expect(panel()).not.toBeNull();
    vi.advanceTimersByTime(20);
    expect(panel()).toBeNull();
  });

  it('takes the app defaults from provideUiTooltip()', async () => {
    await render({ position: 'bottom', showDelay: 600, hideDelay: 400 });
    button('plain').dispatchEvent(pointer('pointerenter'));
    vi.advanceTimersByTime(590);
    expect(panel()).toBeNull();
    vi.advanceTimersByTime(20);
    expect(panel()?.classList).toContain('ui-tooltip--bottom');

    button('plain').dispatchEvent(pointer('pointerleave'));
    vi.advanceTimersByTime(390);
    expect(panel()).not.toBeNull();
    vi.advanceTimersByTime(20);
    expect(panel()).toBeNull();
  });

  it('keeps the built-in values the provider leaves out', async () => {
    await render({ position: 'bottom' });
    button('plain').dispatchEvent(pointer('pointerenter'));
    vi.advanceTimersByTime(310);
    expect(panel()?.classList).toContain('ui-tooltip--bottom');
  });

  it('lets an input on the tooltip win over the provider', async () => {
    await render({ position: 'bottom', showDelay: 600, hideDelay: 400 });
    button('bound').dispatchEvent(pointer('pointerenter'));
    vi.advanceTimersByTime(30);
    expect(panel()?.classList).toContain('ui-tooltip--end');

    button('bound').dispatchEvent(pointer('pointerleave'));
    vi.advanceTimersByTime(20);
    expect(panel()).toBeNull();
  });
});

@Component({
  imports: [UiTooltip],
  template: `
    <div [attr.dir]="dir()">
      <button type="button" uiTooltip="Delete the plan" [uiTooltipPosition]="position()">
        Delete
      </button>
    </div>
  `,
})
class CornerHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly position = signal<UiTooltipPosition>('corner-top-start');
  readonly tooltip = viewChild.required(UiTooltip);
}

describe('UiTooltip corners', () => {
  // jsdom has no layout: a 1024x768 viewport, a 40x20 trigger and an 80x30 tooltip.
  const trigger = { left: 400, top: 300, width: 40, height: 20 };
  const tooltip = { width: 80, height: 30 };
  let fixture: ComponentFixture<CornerHost>;
  let button: HTMLButtonElement;
  const panel = () => document.querySelector<HTMLElement>('ui-tooltip-panel');
  const pane = () => document.querySelector<HTMLElement>('.ui-tooltip-pane')!;

  /** Top-left corner of the tooltip, from the `left`/`right` and `top`/`bottom` the CDK set. */
  const tooltipCorner = () => {
    const { left, right, top, bottom } = pane().style;
    return {
      left: left ? parseFloat(left) : innerWidth - parseFloat(right) - tooltip.width,
      top: top ? parseFloat(top) : innerHeight - parseFloat(bottom) - tooltip.height,
    };
  };

  function rect(box: { left: number; top: number; width: number; height: number }): DOMRect {
    const { left, top, width, height } = box;
    const edges = { x: left, y: top, right: left + width, bottom: top + height };
    return { left, top, width, height, ...edges, toJSON: () => edges };
  }

  beforeEach(async () => {
    // The CDK measures the right and bottom styles from the document element.
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(innerWidth);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(innerHeight);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      if (this === button) return rect(trigger);
      if (this.classList.contains('ui-tooltip-pane')) return rect({ left: 0, top: 0, ...tooltip });
      return rect({ left: 0, top: 0, width: 0, height: 0 });
    });
    fixture = TestBed.createComponent(CornerHost);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (fixture.nativeElement as HTMLElement).remove();
  });

  async function open(position: UiTooltipPosition, dir: 'ltr' | 'rtl' = 'ltr') {
    fixture.componentInstance.position.set(position);
    fixture.componentInstance.dir.set(dir);
    await fixture.whenStable();
    fixture.componentInstance.tooltip().show();
    await fixture.whenStable();
  }

  // Trigger: x 400-440, y 300-320. The tooltip's inline edge meets the trigger's, with no gap.
  it.each([
    ['corner-top-start', 'ltr', { left: 320, top: 270 }],
    ['corner-top-end', 'ltr', { left: 440, top: 270 }],
    ['corner-bottom-start', 'ltr', { left: 320, top: 320 }],
    ['corner-bottom-end', 'ltr', { left: 440, top: 320 }],
    ['corner-top-start', 'rtl', { left: 440, top: 270 }],
    ['corner-top-end', 'rtl', { left: 320, top: 270 }],
    ['corner-bottom-start', 'rtl', { left: 440, top: 320 }],
    ['corner-bottom-end', 'rtl', { left: 320, top: 320 }],
  ] as const)('opens %s (%s) outside that corner of the trigger', async (position, dir, corner) => {
    await open(position, dir);
    expect(panel()?.classList).toContain(`ui-tooltip--${position}`);
    expect(tooltipCorner()).toEqual(corner);
  });
});

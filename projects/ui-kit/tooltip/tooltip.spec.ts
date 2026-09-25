import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusMonitor } from '@angular/cdk/a11y';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UiTooltip } from './tooltip';

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

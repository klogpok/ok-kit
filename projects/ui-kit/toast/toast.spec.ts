import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { provideUiLabels } from '@vplans/ui-kit/core';
import { UiToast, UiToastDismissReason, provideUiToast } from './toast';

describe('UiToast', () => {
  let toast: UiToast;
  let announce: ReturnType<typeof vi.fn>;
  const container = () => document.querySelector<HTMLElement>('ui-toast-container');
  const items = () => [...document.querySelectorAll<HTMLElement>('.ui-toast')];
  const render = () => TestBed.tick();

  beforeEach(() => {
    vi.useFakeTimers();
    announce = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        provideUiToast({ duration: 1000, max: 2, position: 'top-center' }),
        provideUiLabels({ close: 'סגירה', notifications: 'התראות' }),
        { provide: LiveAnnouncer, useValue: { announce } },
      ],
    });
    toast = TestBed.inject(UiToast);
  });

  afterEach(() => {
    toast.dismissAll();
    vi.useRealTimers();
  });

  it('renders a toast in a labelled region', () => {
    toast.success('Plan sent', { title: 'Done' });
    render();
    expect(container()!.getAttribute('role')).toBe('region');
    expect(container()!.getAttribute('aria-label')).toBe('התראות');
    expect(container()!.classList).toContain('ui-toast-container--top-center');
    expect(items()).toHaveLength(1);
    expect(items()[0].classList).toContain('ui-toast--success');
    expect(items()[0].textContent).toContain('Done');
    expect(items()[0].textContent).toContain('Plan sent');
  });

  it('loads the visually hidden styles the announcer element needs', () => {
    const css = [...document.querySelectorAll('style')].map((style) => style.textContent).join('');
    expect(css).toContain('.cdk-visually-hidden');
  });

  it('announces politely, and assertively for errors', () => {
    toast.info('Saved', { title: 'Plan' });
    expect(announce).toHaveBeenLastCalledWith('Plan. Saved', 'polite');
    toast.error('Upload failed');
    expect(announce).toHaveBeenLastCalledWith('Upload failed', 'assertive');
  });

  it('hides after the duration and reports the reason', () => {
    const reasons: UiToastDismissReason[] = [];
    toast.show('Saved').afterDismissed.subscribe((r) => reasons.push(r));
    render();
    vi.advanceTimersByTime(999);
    expect(toast.active()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    render();
    expect(toast.active()).toHaveLength(0);
    expect(items()).toHaveLength(0);
    expect(reasons).toEqual(['timeout']);
  });

  it('keeps a toast with duration 0 until dismissed', () => {
    const ref = toast.show({ message: 'Offline', duration: 0 });
    vi.advanceTimersByTime(60_000);
    expect(toast.active()).toHaveLength(1);
    ref.dismiss();
    expect(toast.active()).toHaveLength(0);
  });

  const pointer = (type: string, pointerType: string) =>
    Object.assign(new MouseEvent(type), { pointerType });

  it('pauses the timers while hovered', () => {
    toast.show('Saved');
    render();
    vi.advanceTimersByTime(600);
    container()!.dispatchEvent(pointer('pointerenter', 'mouse'));
    vi.advanceTimersByTime(5000);
    expect(toast.active()).toHaveLength(1);

    container()!.dispatchEvent(pointer('pointerleave', 'mouse'));
    vi.advanceTimersByTime(399);
    expect(toast.active()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toast.active()).toHaveLength(0);
  });

  it('does not pause for a touch, which has no leave to resume', () => {
    toast.show('Saved');
    render();
    container()!.dispatchEvent(pointer('pointerenter', 'touch'));
    vi.advanceTimersByTime(1000);
    expect(toast.active()).toHaveLength(0);
  });

  it('pauses while the browser tab is hidden', () => {
    toast.show('Saved');
    render();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(5000);
    expect(toast.active()).toHaveLength(1);
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(1000);
    expect(toast.active()).toHaveLength(0);
    hidden.mockRestore();
  });

  it('hides on resume when it was paused after its time was up', () => {
    const reasons: UiToastDismissReason[] = [];
    toast.show('Saved').afterDismissed.subscribe((r) => reasons.push(r));
    render();
    // The main thread was busy: the clock passed the duration but the timer has not run yet.
    vi.setSystemTime(Date.now() + 1500);
    container()!.dispatchEvent(pointer('pointerenter', 'mouse'));
    container()!.dispatchEvent(pointer('pointerleave', 'mouse'));
    expect(reasons).toEqual(['timeout']);
  });

  it('pauses while focus is inside and resumes when it leaves', () => {
    toast.show('Saved');
    render();
    const close = container()!.querySelector<HTMLButtonElement>('.ui-toast__close')!;
    close.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.advanceTimersByTime(5000);
    expect(toast.active()).toHaveLength(1);
    close.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }),
    );
    vi.advanceTimersByTime(1000);
    expect(toast.active()).toHaveLength(0);
  });

  it('closes with the translated close button', () => {
    const reasons: UiToastDismissReason[] = [];
    toast.show('Saved').afterDismissed.subscribe((r) => reasons.push(r));
    render();
    const close = container()!.querySelector<HTMLButtonElement>('.ui-toast__close')!;
    expect(close.getAttribute('aria-label')).toBe('סגירה');
    close.click();
    expect(reasons).toEqual(['close']);
  });

  it('moves focus to the next toast when the focused one is closed', () => {
    toast.show('First');
    toast.show('Second');
    render();
    const [first, second] = items().map((item) =>
      item.querySelector<HTMLElement>('.ui-toast__close')!,
    );
    first.focus();
    first.click();
    render();
    expect(document.activeElement).toBe(second);
  });

  it('returns focus to where it came from when the last toast is closed', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    toast.show('Only');
    render();
    outside.focus();
    const close = items()[0].querySelector<HTMLElement>('.ui-toast__close')!;
    close.focus();
    close.click();
    render();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('keeps the timers running after a mouse click closes a toast', () => {
    toast.show('First');
    toast.show('Second');
    render();
    const [first, second] = items().map((item) =>
      item.querySelector<HTMLElement>('.ui-toast__close')!,
    );
    first.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, buttons: 1, detail: 1 }));
    first.focus();
    first.click();
    render();
    expect(document.activeElement).not.toBe(second);
    vi.advanceTimersByTime(1000);
    expect(toast.active()).toHaveLength(0);
  });

  it('keeps keyboard focus when the focused toast is dropped beyond the maximum', () => {
    toast.show('One');
    toast.show('Two');
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    const [one, two] = items().map((item) => item.querySelector<HTMLElement>('.ui-toast__close')!);
    one.focus();
    toast.show('Three');
    render();
    expect(document.activeElement).toBe(two);
  });

  it('returns focus to where it came from when all toasts are dismissed', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    toast.show('One');
    toast.show('Two');
    render();
    outside.focus();
    items()[1].querySelector<HTMLElement>('.ui-toast__close')!.focus();
    toast.dismissAll();
    render();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('runs the action and then dismisses', () => {
    const onAction = vi.fn();
    const reasons: UiToastDismissReason[] = [];
    const ref = toast.show({ message: 'Plan deleted', action: 'Undo' });
    ref.onAction.subscribe(onAction);
    ref.afterDismissed.subscribe((r) => reasons.push(r));
    render();
    const action = [...items()[0].querySelectorAll('button')].find(
      (b) => b.textContent.trim() === 'Undo',
    )!;
    action.click();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(reasons).toEqual(['action']);
  });

  it('drops the oldest toast beyond the maximum', () => {
    const reasons: UiToastDismissReason[] = [];
    toast.show('One').afterDismissed.subscribe((r) => reasons.push(r));
    toast.show('Two');
    toast.show('Three');
    render();
    expect(toast.active().map((t) => t.message)).toEqual(['Two', 'Three']);
    expect(reasons).toEqual(['overflow']);
  });

  it('moves the stack to the top only after a later overlay covered it', () => {
    toast.show('One');
    render();
    const host = container()!.closest<HTMLElement>('.cdk-global-overlay-wrapper')!;
    host.setAttribute('popover', 'manual');
    const hide = vi.fn();
    const show = vi.fn();
    Object.assign(host, { hidePopover: hide, showPopover: show });
    const opened = (target: Element, newState: 'open' | 'closed') =>
      target.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState }));

    toast.show('Two');
    expect(hide).not.toHaveBeenCalled();

    const dialog = document.createElement('div');
    document.body.appendChild(dialog);
    opened(dialog, 'open');
    opened(dialog, 'closed');
    toast.show('Three');
    expect(hide).not.toHaveBeenCalled();

    opened(dialog, 'open');
    toast.show('Four');
    expect(hide).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
    toast.show('Five');
    expect(hide).toHaveBeenCalledTimes(1);
    dialog.remove();
  });

  it('does not replay the entry animation of toasts that have entered', () => {
    toast.show('One');
    render();
    items()[0].dispatchEvent(new Event('animationend', { bubbles: true }));
    render();
    expect(items()[0].classList).toContain('ui-toast--entered');
  });

  it('hides the close button when not dismissible', () => {
    toast.show({ message: 'Syncing', dismissible: false });
    render();
    expect(container()!.querySelector('.ui-toast__close')).toBeNull();
  });
});

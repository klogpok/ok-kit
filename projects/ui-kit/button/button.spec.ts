import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiVariant } from '@vplans/ui-kit/core';
import { UiButton } from './button';
import { UiIconButton } from './icon-button';

@Component({
  imports: [UiButton, UiIconButton],
  template: `
    <button
      ui-button
      id="btn"
      [variant]="variant()"
      [disabled]="disabled()"
      [disabledInteractive]="interactive()"
      [loading]="loading()"
      (click)="clicks = clicks + 1"
    >
      Save
    </button>
    <button ui-button id="submit" type="submit">Submit</button>
    <a
      ui-button
      id="link"
      href="/orders"
      [disabled]="disabled()"
      [disabledInteractive]="interactive()"
      (click)="clicks = clicks + 1"
      >Orders</a
    >
    <button ui-icon-button id="icon" label="Close" size="sm">x</button>
  `,
})
class Host {
  readonly variant = signal<UiVariant>('primary');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly interactive = signal(false);
  clicks = 0;
}

describe('UiButton', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const get = (id: string) => el.querySelector<HTMLElement>(`#${id}`)!;
    const update = (fn: (host: Host) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
    };
    return { fixture, host: fixture.componentInstance, get, update };
  }

  it('renders with default variant, size and type="button"', () => {
    const { get } = setup();
    const btn = get('btn');
    expect(btn.classList).toContain('ui-button');
    expect(btn.classList).toContain('ui-button--primary');
    expect(btn.classList).toContain('ui-button--md');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.textContent?.trim()).toBe('Save');
  });

  it('respects an explicit type', () => {
    expect(setup().get('submit').getAttribute('type')).toBe('submit');
  });

  it('updates the variant class', () => {
    const { get, update } = setup();
    update((h) => h.variant.set('danger'));
    expect(get('btn').classList).toContain('ui-button--danger');
    expect(get('btn').classList).not.toContain('ui-button--primary');
  });

  it('uses the native disabled attribute on <button>', () => {
    const { get, update, host } = setup();
    update((h) => h.disabled.set(true));
    const btn = get('btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    btn.click();
    expect(host.clicks).toBe(0);
  });

  it('removes the href of a disabled anchor and blocks middle clicks', () => {
    const { get, update } = setup();
    update((h) => h.disabled.set(true));
    const link = get('link');
    expect(link.hasAttribute('href')).toBe(false);
    const middle = new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true });
    link.dispatchEvent(middle);
    expect(middle.defaultPrevented).toBe(true);

    update((h) => h.disabled.set(false));
    expect(link.getAttribute('href')).toBe('/orders');
  });

  it('keeps a disabledInteractive anchor focusable without its href', () => {
    const { get, update } = setup();
    update((h) => {
      h.disabled.set(true);
      h.interactive.set(true);
    });
    const link = get('link');
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('tabindex')).toBe('0');
  });

  it('disables anchors with aria-disabled, removes them from tab order and blocks clicks', () => {
    const { get, update, host } = setup();
    update((h) => h.disabled.set(true));
    const link = get('link');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.hasAttribute('type')).toBe(false);
    expect(link.hasAttribute('disabled')).toBe(false);

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(host.clicks).toBe(0);
  });

  it('keeps a disabledInteractive button and link focusable but blocks clicks', () => {
    const { get, update, host } = setup();
    update((h) => {
      h.disabled.set(true);
      h.interactive.set(true);
    });
    const btn = get('btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.classList).toContain('ui-button--disabled');
    btn.click();

    const link = get('link');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('0');
    link.click();
    expect(host.clicks).toBe(0);

    update((h) => h.disabled.set(false));
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    expect(link.hasAttribute('aria-disabled')).toBe(false);
  });

  it('shows a spinner while loading, stays focusable and blocks clicks', () => {
    const { get, update, host } = setup();
    update((h) => h.loading.set(true));
    const btn = get('btn') as HTMLButtonElement;
    expect(btn.querySelector('ui-spinner')).not.toBeNull();
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.disabled).toBe(false);
    btn.focus();
    expect(document.activeElement).toBe(btn);
    btn.click();
    expect(host.clicks).toBe(0);

    update((h) => h.loading.set(false));
    btn.click();
    expect(host.clicks).toBe(1);
    expect(btn.querySelector('ui-spinner')).toBeNull();
  });

  it('emits clicks when enabled', () => {
    const { get, host } = setup();
    get('btn').click();
    expect(host.clicks).toBe(1);
  });
});

describe('UiIconButton', () => {
  it('uses label as accessible name and native title, and defaults to ghost', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('#icon')!;
    expect(btn.getAttribute('aria-label')).toBe('Close');
    expect(btn.getAttribute('title')).toBe('Close');
    expect(btn.classList).toContain('ui-button--icon');
    expect(btn.classList).toContain('ui-button--ghost');
    expect(btn.classList).toContain('ui-button--sm');
  });
});

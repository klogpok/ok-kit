import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiBadge, UiBadgeTone } from './badge';

@Component({
  imports: [UiBadge],
  template: `
    <ui-badge id="default">Draft</ui-badge>
    <ui-badge id="custom" [tone]="tone()" appearance="soft" size="sm">ממתין לחתימה</ui-badge>
  `,
})
class Host {
  readonly tone = signal<UiBadgeTone>('warning');
}

describe('UiBadge', () => {
  let fixture: ComponentFixture<Host>;
  const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders projected text with neutral solid md defaults', () => {
    expect(el('default').textContent).toBe('Draft');
    expect([...el('default').classList]).toEqual(
      expect.arrayContaining(['ui-badge', 'ui-badge--neutral', 'ui-badge--solid', 'ui-badge--md']),
    );
  });

  it('applies tone, appearance and size', () => {
    expect([...el('custom').classList]).toEqual(
      expect.arrayContaining(['ui-badge--warning', 'ui-badge--soft', 'ui-badge--sm']),
    );
    fixture.componentInstance.tone.set('primary');
    fixture.detectChanges();
    expect(el('custom').classList).toContain('ui-badge--primary');
    expect(el('custom').classList).not.toContain('ui-badge--warning');
  });

  it('stays plain text for assistive technologies', () => {
    expect(el('default').hasAttribute('role')).toBe(false);
  });
});

@Component({
  imports: [UiBadge],
  template: `
    <ui-badge id="info" tone="info" size="lg">Shared</ui-badge>
    <ui-badge id="count" tone="danger" [count]="count()" [max]="max()">unread</ui-badge>
    <ui-badge id="dot" tone="success" dot>Online</ui-badge>
  `,
})
class ExtrasHost {
  readonly count = signal<number | null>(5);
  readonly max = signal(99);
}

describe('UiBadge extras', () => {
  let fixture: ComponentFixture<ExtrasHost>;
  const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)!;
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ExtrasHost);
    await render();
  });

  it('has an info tone and a large size', () => {
    expect([...el('info').classList]).toEqual(
      expect.arrayContaining(['ui-badge--info', 'ui-badge--lg']),
    );
    expect(el('info').querySelector('.ui-badge__label--hidden')).toBeNull();
  });

  it('shows a count and keeps the text for screen readers', async () => {
    const badge = el('count');
    expect(badge.classList).toContain('ui-badge--count');
    expect(badge.querySelector('.ui-badge__count')?.textContent).toBe('5');
    expect(badge.querySelector('.ui-badge__label--hidden')?.textContent.trim()).toBe('unread');

    fixture.componentInstance.count.set(120);
    await render();
    expect(badge.querySelector('.ui-badge__count')?.textContent).toBe('99+');
    expect(badge.querySelector('.ui-badge__count')?.getAttribute('dir')).toBe('ltr');

    fixture.componentInstance.max.set(9);
    fixture.componentInstance.count.set(9);
    await render();
    expect(badge.querySelector('.ui-badge__count')?.textContent).toBe('9');

    fixture.componentInstance.count.set(0);
    await render();
    expect(badge.querySelector('.ui-badge__count')?.textContent).toBe('0');

    fixture.componentInstance.count.set(null);
    await render();
    expect(badge.querySelector('.ui-badge__count')).toBeNull();
    expect(badge.classList).not.toContain('ui-badge--count');
  });

  it('shows only a dot and keeps the text for screen readers', () => {
    const badge = el('dot');
    expect(badge.classList).toContain('ui-badge--dot');
    expect(badge.querySelector('.ui-badge__dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(badge.querySelector('.ui-badge__label--hidden')?.textContent.trim()).toBe('Online');
  });
});

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

  it('applies tone, appearance and size', async () => {
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

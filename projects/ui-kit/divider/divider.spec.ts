import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDivider } from './divider';

@Component({
  imports: [UiDivider],
  template: `
    <ui-divider id="plain" />
    <ui-divider id="vertical" orientation="vertical" />
    <ui-divider id="labelled" [label]="label()" />
    <ui-divider id="decorative" decorative />
  `,
})
class Host {
  readonly label = signal('או');
}

describe('UiDivider', () => {
  let fixture: ComponentFixture<Host>;
  const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('is a horizontal separator by default', () => {
    expect(el('plain').getAttribute('role')).toBe('separator');
    expect(el('plain').hasAttribute('aria-orientation')).toBe(false);
    expect(el('plain').classList).toContain('ui-divider--horizontal');
  });

  it('sets aria-orientation when vertical', () => {
    expect(el('vertical').getAttribute('role')).toBe('separator');
    expect(el('vertical').getAttribute('aria-orientation')).toBe('vertical');
    expect(el('vertical').classList).toContain('ui-divider--vertical');
  });

  it('renders the label as readable text without a separator role', () => {
    expect(el('labelled').textContent?.trim()).toBe('או');
    expect(el('labelled').hasAttribute('role')).toBe(false);
    expect(el('labelled').classList).toContain('ui-divider--labelled');

    fixture.componentInstance.label.set('');
    fixture.detectChanges();
    expect(el('labelled').getAttribute('role')).toBe('separator');
    expect(el('labelled').querySelector('.ui-divider__label')).toBeNull();
  });

  it('hides a decorative divider from assistive technologies', () => {
    expect(el('decorative').getAttribute('aria-hidden')).toBe('true');
    expect(el('decorative').hasAttribute('role')).toBe(false);
  });
});

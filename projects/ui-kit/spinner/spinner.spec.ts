import { TestBed } from '@angular/core/testing';
import { UiSpinner } from './spinner';

describe('UiSpinner', () => {
  function render(inputs: Partial<{ size: string; label: string; decorative: boolean }> = {}) {
    const fixture = TestBed.createComponent(UiSpinner);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders as an accessible progressbar with a default label', () => {
    const el = render();
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-label')).toBe('Loading');
    expect(el.classList).toContain('ui-spinner--md');
  });

  it('applies custom label and size', () => {
    const el = render({ label: 'Saving', size: 'lg' });
    expect(el.getAttribute('aria-label')).toBe('Saving');
    expect(el.classList).toContain('ui-spinner--lg');
  });

  it('is hidden from assistive technologies when decorative', () => {
    const el = render({ decorative: true });
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });
});

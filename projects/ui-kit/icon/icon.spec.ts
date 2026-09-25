import { TestBed } from '@angular/core/testing';
import { UiIcon } from './icon';
import { provideUiIcons } from './icon-registry';
import { uiIconCheck, uiIconX } from './icons';

describe('UiIcon', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideUiIcons([uiIconCheck])] });
  });

  function render(inputs: Record<string, unknown>): HTMLElement {
    const fixture = TestBed.createComponent(UiIcon);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders a registered icon by name as decorative', () => {
    const el = render({ icon: 'check' });
    expect(el.querySelector('svg')).not.toBeNull();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.classList).toContain('ui-icon--inherit');
  });

  it('renders an icon definition directly without registration', () => {
    expect(render({ icon: uiIconX }).querySelector('svg')).not.toBeNull();
  });

  it('exposes an accessible name when labelled', () => {
    const el = render({ icon: 'check', label: 'Done', size: 'lg' });
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Done');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    expect(el.classList).toContain('ui-icon--lg');
  });

  it('warns and renders nothing for unknown icons', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const el = render({ icon: 'nope' });
    expect(el.querySelector('svg')).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nope"'));
    warn.mockRestore();
  });

  it('adds the RTL flip class', () => {
    expect(render({ icon: 'check', flipRtl: true }).classList).toContain('ui-icon--flip-rtl');
  });
});

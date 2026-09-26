import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('renders every playground section', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('ui-kit playground');
    const sections = [...el.querySelectorAll('section h2')].map((h) => h.textContent.trim());
    expect(sections).toEqual(
      expect.arrayContaining(['Profile (Signal Forms)', 'Plans', 'Actions']),
    );
    expect(el.querySelector('app-phase-three section')).not.toBeNull();
    expect(el.querySelector('app-phase-six nav[ui-breadcrumbs]')).not.toBeNull();
    expect(el.querySelector('app-phase-seven ui-table-container table[ui-table]')).not.toBeNull();
    expect(el.querySelector('app-phase-seven ui-file-upload')).not.toBeNull();
    expect(el.querySelector('app-phase-eight ui-range-slider')).not.toBeNull();
    expect(el.querySelector('app-phase-eight ui-stepper ui-date-range-picker')).not.toBeNull();
  });

  it('switches the direction and the language together', async () => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.dir = 'rtl';
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toggle = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (b) => b.textContent.trim() === 'LTR',
    )!;
    toggle.click();
    await fixture.whenStable();
    expect(root.dir).toBe('ltr');
    expect(root.lang).toBe('en');
    root.removeAttribute('dir');
    root.removeAttribute('lang');
  });
});

import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('renders the playground', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('ui-kit playground');
    expect(el.querySelectorAll('input[ui-input]').length).toBe(2);
  });
});

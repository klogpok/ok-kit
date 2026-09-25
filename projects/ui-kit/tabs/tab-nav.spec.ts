import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterLink, RouterLinkActive, provideRouter } from '@angular/router';
import { UiTabLink, UiTabNav } from './tab-nav';

@Component({ template: '' })
class Page {}

@Component({
  imports: [UiTabNav, UiTabLink, RouterLink, RouterLinkActive],
  template: `
    <nav ui-tab-nav aria-label="Plan">
      <a ui-tab-link routerLink="/details" routerLinkActive>Details</a>
      <a ui-tab-link routerLink="/history" routerLinkActive>History</a>
      <a ui-tab-link routerLink="/billing" routerLinkActive disabled>Billing</a>
      <a ui-tab-link href="#help" [active]="helpActive()">Help</a>
    </nav>
  `,
})
class Host {
  readonly helpActive = signal(false);
}

describe('UiTabNav', () => {
  let fixture: ComponentFixture<Host>;
  let router: Router;
  const links = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')];
  const current = () => links().map((a) => a.getAttribute('aria-current'));
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'details', component: Page },
          { path: 'history', component: Page },
          { path: 'billing', component: Page },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Host);
    await router.navigateByUrl('/details');
    await settle();
  });

  it('is a labelled nav of links, not a tablist', () => {
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Plan');
    expect(nav.hasAttribute('role')).toBe(false);
    expect(links()[0].classList).toContain('ui-tab-link');
  });

  it('marks the link of the current route', async () => {
    expect(current()).toEqual(['page', null, null, null]);
    expect(links()[0].classList).toContain('ui-tab-link--active');

    await router.navigateByUrl('/history');
    await settle();
    expect(current()).toEqual([null, 'page', null, null]);
  });

  it('blocks navigation from a disabled link', async () => {
    const billing = links()[2];
    expect(billing.getAttribute('aria-disabled')).toBe('true');
    expect(billing.tabIndex).toBe(-1);
    billing.click();
    await settle();
    expect(router.url).toBe('/details');
  });

  it('accepts an explicit active state', () => {
    fixture.componentInstance.helpActive.set(true);
    fixture.detectChanges();
    expect(current()[3]).toBe('page');
  });
});

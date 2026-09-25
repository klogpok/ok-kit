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
      <a ui-tab-link routerLink="/billing" routerLinkActive [disabled]="billingDisabled()">
        Billing
      </a>
      <a ui-tab-link href="#help" [active]="helpActive()" [disabled]="helpDisabled()">Help</a>
    </nav>
  `,
})
class Host {
  readonly helpActive = signal(false);
  readonly billingDisabled = signal(true);
  readonly helpDisabled = signal(false);
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
    const middle = new MouseEvent('auxclick', { button: 1, cancelable: true });
    billing.dispatchEvent(middle);
    expect(middle.defaultPrevented).toBe(true);
  });

  it('removes the href while disabled and restores it when enabled', async () => {
    const billing = links()[2];
    expect(billing.hasAttribute('href')).toBe(false);
    fixture.componentInstance.billingDisabled.set(false);
    await settle();
    expect(billing.getAttribute('href')).toBe('/billing');
  });

  it('keeps the href of a disabled link removed after a navigation', async () => {
    await router.navigateByUrl('/history');
    await settle();
    expect(links()[2].hasAttribute('href')).toBe(false);
    fixture.componentInstance.billingDisabled.set(false);
    await settle();
    expect(links()[2].getAttribute('href')).toBe('/billing');
  });

  it('removes a plain href while disabled', async () => {
    fixture.componentInstance.helpDisabled.set(true);
    await settle();
    expect(links()[3].hasAttribute('href')).toBe(false);
    fixture.componentInstance.helpDisabled.set(false);
    await settle();
    expect(links()[3].getAttribute('href')).toBe('#help');
  });

  it('accepts an explicit active state', () => {
    fixture.componentInstance.helpActive.set(true);
    fixture.detectChanges();
    expect(current()[3]).toBe('page');
  });
});

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterLink, provideRouter } from '@angular/router';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiBreadcrumb, UiBreadcrumbs } from './breadcrumbs';

@Component({ template: '' })
class Page {}

@Component({
  imports: [UiBreadcrumbs, UiBreadcrumb, RouterLink],
  template: `
    <nav ui-breadcrumbs [maxItems]="max()">
      @for (crumb of crumbs(); track crumb.path) {
        <a ui-breadcrumb [routerLink]="crumb.path">{{ crumb.label }}</a>
      }
      <a ui-breadcrumb>Floor 4</a>
    </nav>
    <nav id="named" ui-breadcrumbs aria-label="Plan path">
      <a ui-breadcrumb href="#top">Top</a>
    </nav>
  `,
})
class Host {
  readonly max = signal(4);
  readonly crumbs = signal([
    { path: '/', label: 'Home' },
    { path: '/projects', label: 'Projects' },
    { path: '/projects/tower-b', label: 'Tower B' },
    { path: '/projects/tower-b/plans', label: 'Plans' },
  ]);
}

describe('UiBreadcrumbs', () => {
  let fixture: ComponentFixture<Host>;
  const nav = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('nav')!;
  const links = () => [...nav().querySelectorAll<HTMLAnchorElement>('a[ui-breadcrumb]')];
  const visible = () =>
    links()
      .filter((link) => !link.hidden)
      .map((link) => link.textContent);
  const more = () => nav().querySelector<HTMLButtonElement>('.ui-breadcrumbs__more-button');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideUiLabels(UI_LABELS_EN), provideRouter([{ path: '**', component: Page }])],
    });
    fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => (fixture.nativeElement as HTMLElement).remove());

  it('is a navigation landmark named by the breadcrumbs label or aria-label', () => {
    expect(nav().getAttribute('aria-label')).toBe('Breadcrumbs');
    const named = (fixture.nativeElement as HTMLElement).querySelector('#named')!;
    expect(named.getAttribute('aria-label')).toBe('Plan path');
  });

  it('marks the last link as the current page', () => {
    const current = links().filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual(['Floor 4']);
    expect(links().at(-1)?.classList).toContain('ui-breadcrumb--current');
  });

  it('collapses the middle links after the first one into a menu button', () => {
    expect(visible()).toEqual(['Home', 'Plans', 'Floor 4']);
    const button = more()!;
    expect(button.getAttribute('aria-label')).toBe('Show more');
    // The button sits right after the first link, so the focus order follows the layout.
    expect(links()[0].nextElementSibling?.contains(button)).toBe(true);
  });

  it('shows every link when they fit', async () => {
    fixture.componentInstance.max.set(5);
    await settle();
    expect(visible()).toEqual(['Home', 'Projects', 'Tower B', 'Plans', 'Floor 4']);
    expect(more()).toBeNull();

    fixture.componentInstance.max.set(3);
    await settle();
    expect(visible()).toEqual(['Home', 'Floor 4']);
    expect(more()).not.toBeNull();
  });

  it('follows a collapsed link from the menu', async () => {
    more()!.click();
    await settle();
    const items = [...document.querySelectorAll<HTMLButtonElement>('[ui-menu-item]')];
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Projects', 'Tower B']);

    items[1].click();
    await settle();
    expect(TestBed.inject(Router).url).toBe('/projects/tower-b');
  });

  it('moves the menu button when the first link changes', async () => {
    fixture.componentInstance.crumbs.update((crumbs) => [
      { path: '/start', label: 'Start' },
      ...crumbs.slice(1),
    ]);
    await settle();
    expect(visible()).toEqual(['Start', 'Plans', 'Floor 4']);
    expect(nav().querySelectorAll('.ui-breadcrumbs__more-button')).toHaveLength(1);
    expect(links()[0].nextElementSibling?.contains(more())).toBe(true);
  });
});

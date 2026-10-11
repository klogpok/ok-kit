import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router, RouterLink, provideRouter } from '@angular/router';
import { UiBreadcrumb, UiBreadcrumbs } from '@vplans/ui-kit/breadcrumbs';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiBreadcrumbHarness, UiBreadcrumbsHarness } from './breadcrumbs-harness';
import { UiMenuHarness } from './menu-harness';

@Component({ template: '' })
class Page {}

@Component({
  imports: [UiBreadcrumbs, UiBreadcrumb, RouterLink],
  template: `
    <nav ui-breadcrumbs [maxItems]="max()">
      <a ui-breadcrumb routerLink="/">Home</a>
      <a ui-breadcrumb routerLink="/projects">Projects</a>
      <a ui-breadcrumb routerLink="/projects/tower-b">Tower B</a>
      <a ui-breadcrumb routerLink="/projects/tower-b/plans">Plans</a>
      <a ui-breadcrumb>Floor 4</a>
    </nav>
    <nav ui-breadcrumbs aria-label="Plan path">
      <a ui-breadcrumb href="#top">Top</a>
      <a ui-breadcrumb>Here</a>
    </nav>
  `,
})
class Host {
  readonly max = signal(4);
}

describe('UiBreadcrumbsHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideUiLabels(UI_LABELS_EN), provideRouter([{ path: '**', component: Page }])],
    });
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds trails by label and reads the links, the collapsed ones and the current page', async () => {
    expect(await loader.getAllHarnesses(UiBreadcrumbsHarness)).toHaveLength(2);
    const named = await loader.getHarness(UiBreadcrumbsHarness.with({ label: 'Plan path' }));
    expect(await named.getCurrentText()).toBe('Here');
    expect(await named.hasCollapsedItems()).toBe(false);

    const trail = await loader.getHarness(UiBreadcrumbsHarness.with({ label: 'Breadcrumbs' }));
    const items = await trail.getItems();
    expect(await Promise.all(items.map((item) => item.getText()))).toEqual([
      'Home',
      'Projects',
      'Tower B',
      'Plans',
      'Floor 4',
    ]);
    expect(await items[0].getHref()).toBe('/');
    expect(await items[4].getHref()).toBeNull();
    expect(await items[4].isCurrent()).toBe(true);
    expect(await items[0].isCurrent()).toBe(false);
    expect(await items[1].isCollapsed()).toBe(true);
    expect(await trail.getCurrentText()).toBe('Floor 4');
    expect(await trail.hasCollapsedItems()).toBe(true);
    expect(await trail.getVisibleTexts()).toEqual(['Home', 'Plans', 'Floor 4']);
    expect(await trail.getCollapsedTexts()).toEqual(['Projects', 'Tower B']);
    expect(await trail.getItems({ collapsed: false, current: false })).toHaveLength(2);
    expect(await loader.getAllHarnesses(UiBreadcrumbHarness.with({ text: 'Top' }))).toHaveLength(1);

    host.max.set(5);
    expect(await trail.hasCollapsedItems()).toBe(false);
    expect(await trail.getCollapsedTexts()).toEqual([]);
  });

  it('follows a visible link and a collapsed one from the menu', async () => {
    const router = TestBed.inject(Router);
    const trail = await loader.getHarness(UiBreadcrumbsHarness.with({ label: 'Breadcrumbs' }));
    await (await trail.getItems({ text: 'Plans' }))[0].click();
    expect(router.url).toBe('/projects/tower-b/plans');

    await trail.followCollapsed('Tower B');
    expect(router.url).toBe('/projects/tower-b');
    await expect(trail.followCollapsed('Floor 4')).rejects.toThrow('No collapsed link matches');
    const more = await loader.getHarness(UiMenuHarness.with({ label: 'Show more' }));
    expect(await more.isOpen()).toBe(false);

    const named = await loader.getHarness(UiBreadcrumbsHarness.with({ label: 'Plan path' }));
    await expect(named.followCollapsed('Top')).rejects.toThrow('No collapsed link matches');
  });
});

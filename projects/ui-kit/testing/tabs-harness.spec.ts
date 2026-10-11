import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router, RouterLink, RouterLinkActive, provideRouter } from '@angular/router';
import { UiButton } from '@vplans/ui-kit/button';
import {
  UiTab,
  UiTabContent,
  UiTabGroup,
  UiTabLabel,
  UiTabLink,
  UiTabNav,
} from '@vplans/ui-kit/tabs';
import { UiButtonHarness } from './button-harness';
import { UiTabGroupHarness, UiTabHarness, UiTabNavHarness } from './tabs-harness';

@Component({ template: '' })
class Page {}

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    UiButton,
    UiTab,
    UiTabContent,
    UiTabGroup,
    UiTabLabel,
    UiTabLink,
    UiTabNav,
  ],
  template: `
    <ui-tab-group aria-label="Plan" [(selectedIndex)]="tab">
      <ui-tab label="Details"><button ui-button>Edit details</button></ui-tab>
      <ui-tab label="Files" disabled>Files</ui-tab>
      <ui-tab>
        <ng-template uiTabLabel>History <span>3</span></ng-template>
        <ng-template uiTabContent><button ui-button>Load history</button></ng-template>
      </ui-tab>
    </ui-tab-group>
    <span id="other-label">Settings</span>
    <ui-tab-group aria-labelledby="other-label">
      <ui-tab label="General">General</ui-tab>
    </ui-tab-group>
    <nav ui-tab-nav aria-label="Sections">
      <a ui-tab-link routerLink="/details" routerLinkActive>Details</a>
      <a ui-tab-link routerLink="/history" routerLinkActive>History</a>
      <a ui-tab-link routerLink="/archive" disabled>Archive</a>
    </nav>
  `,
})
class Host {
  readonly tab = signal(0);
}

describe('UiTabGroupHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Page }])],
    });
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds tab groups by label and reads their tabs', async () => {
    expect(await loader.getAllHarnesses(UiTabGroupHarness)).toHaveLength(2);
    const settings = await loader.getHarness(UiTabGroupHarness.with({ label: 'Settings' }));
    expect(await (await settings.getSelectedTab()).getLabel()).toBe('General');

    const plan = await loader.getHarness(UiTabGroupHarness.with({ label: 'Plan' }));
    const tabs = await plan.getTabs();
    expect(await Promise.all(tabs.map((tab) => tab.getLabel()))).toEqual([
      'Details',
      'Files',
      'History 3',
    ]);
    expect(await tabs[0].isSelected()).toBe(true);
    expect(await tabs[1].isDisabled()).toBe(true);
    expect(await plan.getTabs({ disabled: false })).toHaveLength(2);
    expect(await plan.getSelectedLabel()).toBe('Details');
    expect(await loader.getAllHarnesses(UiTabHarness.with({ label: /^History/ }))).toHaveLength(1);
  });

  it('selects tabs and loads harnesses of the selected panel', async () => {
    const plan = await loader.getHarness(UiTabGroupHarness.with({ label: 'Plan' }));
    expect(await (await plan.getHarness(UiButtonHarness)).getText()).toBe('Edit details');

    await plan.selectTab({ label: /^History/ });
    expect(await plan.getSelectedLabel()).toBe('History 3');
    expect(host.tab()).toBe(2);
    expect(await (await plan.getHarness(UiButtonHarness)).getText()).toBe('Load history');

    await (await plan.getTabs({ label: 'Files' }))[0].select();
    expect(await plan.getSelectedLabel()).toBe('History 3');
    await expect(plan.selectTab({ label: 'Costs' })).rejects.toThrow('No tab matches');

    const selected = await plan.getSelectedTab();
    await selected.focus();
    expect(await selected.isFocused()).toBe(true);
  });
});

describe('UiTabNavHarness', () => {
  let loader: HarnessLoader;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Page }])],
    });
    const fixture = TestBed.createComponent(Host);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await TestBed.inject(Router).navigateByUrl('/details');
  });

  it('reads the links and follows one as the user does', async () => {
    const nav = await loader.getHarness(UiTabNavHarness.with({ label: 'Sections' }));
    const links = await nav.getLinks();
    expect(await Promise.all(links.map((link) => link.getText()))).toEqual([
      'Details',
      'History',
      'Archive',
    ]);
    expect(await links[1].getHref()).toBe('/history');
    expect(await links[2].isDisabled()).toBe(true);
    expect(await links[2].getHref()).toBeNull();
    expect(await nav.getActiveText()).toBe('Details');

    await nav.clickLink({ text: 'History' });
    expect(TestBed.inject(Router).url).toBe('/history');
    expect(await nav.getActiveText()).toBe('History');
    expect(await nav.getLinks({ active: false })).toHaveLength(2);

    await nav.clickLink({ text: 'Archive' });
    expect(TestBed.inject(Router).url).toBe('/history');
    await expect(nav.clickLink({ text: 'Costs' })).rejects.toThrow('No tab link matches');
  });
});

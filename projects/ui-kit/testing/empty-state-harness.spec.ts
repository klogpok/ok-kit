import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiButton } from '@vplans/ui-kit/button';
import { UiEmptyState } from '@vplans/ui-kit/empty-state';
import { UiIcon, uiIconInfo } from '@vplans/ui-kit/icon';
import { UiEmptyStateHarness } from './empty-state-harness';

@Component({
  imports: [UiEmptyState, UiButton, UiIcon],
  template: `
    <ui-empty-state title="No plans yet" headingLevel="2">
      <ui-icon [icon]="icon" />
      Plans you create show up here.
      <button uiEmptyStateActions ui-button (click)="created.set(true)">Create a plan</button>
      <a uiEmptyStateActions ui-button variant="secondary" href="/help">Learn more</a>
    </ui-empty-state>
    <ui-empty-state size="sm">Nothing matches the filter.</ui-empty-state>
  `,
})
class Host {
  readonly icon = uiIconInfo;
  readonly created = signal(false);
}

describe('UiEmptyStateHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds empty states by title and description', async () => {
    expect(await loader.getAllHarnesses(UiEmptyStateHarness)).toHaveLength(2);
    expect(
      await loader.getAllHarnesses(UiEmptyStateHarness.with({ title: 'No plans yet' })),
    ).toHaveLength(1);
    expect(
      await loader.getAllHarnesses(UiEmptyStateHarness.with({ description: /filter/ })),
    ).toHaveLength(1);
  });

  it('reads the title, its level, the description and the size', async () => {
    const plans = await loader.getHarness(UiEmptyStateHarness.with({ title: 'No plans yet' }));
    expect(await plans.getDescription()).toBe('Plans you create show up here.');
    expect(await plans.getHeadingLevel()).toBe(2);
    expect(await plans.getSize()).toBe('md');

    const filtered = await loader.getHarness(UiEmptyStateHarness.with({ description: /filter/ }));
    expect(await filtered.getTitle()).toBe('');
    expect(await filtered.getHeadingLevel()).toBeNull();
    expect(await filtered.getSize()).toBe('sm');
    expect(await filtered.getActions()).toEqual([]);
  });

  it('reads and clicks the actions', async () => {
    const plans = await loader.getHarness(UiEmptyStateHarness.with({ title: 'No plans yet' }));
    const actions = await plans.getActions();
    expect(await Promise.all(actions.map((action) => action.getText()))).toEqual([
      'Create a plan',
      'Learn more',
    ]);
    await (await plans.getActions({ text: 'Create a plan' }))[0].click();
    expect(host.created()).toBe(true);
  });
});

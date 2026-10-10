import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiBadge } from '@vplans/ui-kit/badge';
import { UiBadgeHarness } from './badge-harness';

@Component({
  imports: [UiBadge],
  template: `
    <ui-badge tone="primary">Waiting for approval</ui-badge>
    <ui-badge tone="danger" appearance="soft" size="sm" [count]="unread()">unread</ui-badge>
    <ui-badge tone="success" dot>Online</ui-badge>
  `,
})
class Host {
  readonly unread = signal<number | null>(120);
}

describe('UiBadgeHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds badges by text and tone', async () => {
    expect(await loader.getAllHarnesses(UiBadgeHarness)).toHaveLength(3);
    expect(await loader.getAllHarnesses(UiBadgeHarness.with({ text: /^Wait/ }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiBadgeHarness.with({ tone: 'success' }))).toHaveLength(1);
  });

  it('reads the text and the look of a plain badge', async () => {
    const badge = await loader.getHarness(UiBadgeHarness.with({ tone: 'primary' }));
    expect(await badge.getText()).toBe('Waiting for approval');
    expect(await badge.getCount()).toBeNull();
    expect(await badge.isDot()).toBe(false);
    expect(await badge.getAppearance()).toBe('solid');
    expect(await badge.getSize()).toBe('md');
  });

  it('reads the shown count, capped at max, and the text kept for screen readers', async () => {
    const badge = await loader.getHarness(UiBadgeHarness.with({ text: 'unread' }));
    expect(await badge.getCount()).toBe('99+');
    expect(await badge.getTone()).toBe('danger');
    expect(await badge.getAppearance()).toBe('soft');
    expect(await badge.getSize()).toBe('sm');

    host.unread.set(3);
    expect(await badge.getCount()).toBe('3');
    host.unread.set(null);
    expect(await badge.getCount()).toBeNull();
  });

  it('tells a dot badge apart', async () => {
    const dot = await loader.getHarness(UiBadgeHarness.with({ text: 'Online' }));
    expect(await dot.isDot()).toBe(true);
    expect(await dot.getCount()).toBeNull();
  });
});

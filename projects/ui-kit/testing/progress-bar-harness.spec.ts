import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UI_LABELS_HE } from '@vplans/ui-kit/core';
import { UiProgressBar } from '@vplans/ui-kit/progress';
import { UiProgressBarHarness } from './progress-bar-harness';

@Component({
  imports: [UiProgressBar],
  template: `
    <ui-progress-bar label="Uploading plan.pdf" [value]="uploaded()" />
    <ui-progress-bar size="sm" tone="success" />
    <span id="import-title">Importing tasks</span>
    <ui-progress-bar aria-labelledby="import-title" value="7" max="20" tone="warning" />
  `,
})
class Host {
  readonly uploaded = signal<number | null>(40);
}

describe('UiProgressBarHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds progress bars by label, also from aria-labelledby and the default label', async () => {
    expect(await loader.getAllHarnesses(UiProgressBarHarness)).toHaveLength(3);
    expect(
      await loader.getAllHarnesses(UiProgressBarHarness.with({ label: /plan\.pdf/ })),
    ).toHaveLength(1);
    expect(
      await loader.getAllHarnesses(UiProgressBarHarness.with({ label: 'Importing tasks' })),
    ).toHaveLength(1);
    expect(
      await loader.getAllHarnesses(UiProgressBarHarness.with({ label: UI_LABELS_HE.loading })),
    ).toHaveLength(1);
  });

  it('reads the value and max of a determinate bar', async () => {
    const upload = await loader.getHarness(UiProgressBarHarness.with({ label: /plan\.pdf/ }));
    expect(await upload.getValue()).toBe(40);
    expect(await upload.getMax()).toBe(100);
    expect(await upload.isIndeterminate()).toBe(false);
    expect(await upload.getTone()).toBe('primary');
    expect(await upload.getSize()).toBe('md');

    const tasks = await loader.getHarness(UiProgressBarHarness.with({ label: 'Importing tasks' }));
    expect(await tasks.getValue()).toBe(7);
    expect(await tasks.getMax()).toBe(20);
    expect(await tasks.getTone()).toBe('warning');
  });

  it('reads the indeterminate state', async () => {
    const loading = await loader.getHarness(
      UiProgressBarHarness.with({ label: UI_LABELS_HE.loading }),
    );
    expect(await loading.isIndeterminate()).toBe(true);
    expect(await loading.getValue()).toBeNull();
    expect(await loading.getSize()).toBe('sm');
    expect(await loading.getTone()).toBe('success');

    const upload = await loader.getHarness(UiProgressBarHarness.with({ label: /plan\.pdf/ }));
    host.uploaded.set(null);
    expect(await upload.isIndeterminate()).toBe(true);
  });
});

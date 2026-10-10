import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiToast, UiToastDismissReason } from '@vplans/ui-kit/toast';
import { UiToastHarness } from './toast-harness';

@Component({ template: '' })
class Host {
  readonly toast = inject(UiToast);
}

describe('UiToastHarness', () => {
  let fixture: ComponentFixture<Host>;
  let loader: HarnessLoader;
  let toast: UiToast;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    toast = fixture.componentInstance.toast;
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  });

  afterEach(() => toast.dismissAll());

  it('filters by message, title and tone', async () => {
    toast.success('Plan sent', { title: 'Done' });
    toast.error('Upload failed');
    expect(await loader.getAllHarnesses(UiToastHarness)).toHaveLength(2);
    expect(await loader.getAllHarnesses(UiToastHarness.with({ message: /sent/ }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiToastHarness.with({ title: 'Done' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiToastHarness.with({ tone: 'danger' }))).toHaveLength(1);
  });

  it('reads a toast', async () => {
    toast.success('Plan sent', { title: 'Done', action: 'Undo' });
    toast.info('Saved', { dismissible: false });
    const [sent, saved] = await loader.getAllHarnesses(UiToastHarness);
    expect(await sent.getMessage()).toBe('Plan sent');
    expect(await sent.getTitle()).toBe('Done');
    expect(await sent.getTone()).toBe('success');
    expect(await sent.getActionText()).toBe('Undo');
    expect(await sent.isDismissible()).toBe(true);

    expect(await saved.getTitle()).toBe('');
    expect(await saved.getTone()).toBe('info');
    expect(await saved.getActionText()).toBe('');
    expect(await saved.isDismissible()).toBe(false);
    await expect(saved.clickAction()).rejects.toThrow(/no action/);
    await expect(saved.dismiss()).rejects.toThrow(/no close button/);
  });

  it('presses the action and dismisses a toast', async () => {
    const reasons: UiToastDismissReason[] = [];
    const deleted = toast.show({ message: 'Plan deleted', action: 'Undo' });
    deleted.afterDismissed.subscribe((reason) => reasons.push(reason));
    let undone = false;
    deleted.onAction.subscribe(() => (undone = true));
    toast.show('Copied').afterDismissed.subscribe((reason) => reasons.push(reason));

    await (await loader.getHarness(UiToastHarness.with({ message: 'Plan deleted' }))).clickAction();
    expect(undone).toBe(true);
    await (await loader.getHarness(UiToastHarness.with({ message: 'Copied' }))).dismiss();
    expect(reasons).toEqual(['action', 'close']);
    expect(await loader.getAllHarnesses(UiToastHarness)).toEqual([]);
  });

  it('says so when the element has no tone class', async () => {
    const bare = TestbedHarnessEnvironment.loader(TestBed.createComponent(BareToast));
    await expect((await bare.getHarness(UiToastHarness)).getTone()).rejects.toThrow(
      'no tone class',
    );
  });
});

@Component({ template: '<div class="ui-toast">Not a toast</div>' })
class BareToast {}

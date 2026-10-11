import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiAlert } from '@vplans/ui-kit/alert';
import { UiButton } from '@vplans/ui-kit/button';
import { UiAlertHarness } from './alert-harness';

@Component({
  imports: [UiAlert, UiButton],
  template: `
    <ui-alert>The plan is shared with the team.</ui-alert>
    @if (shown()) {
      <ui-alert
        tone="warning"
        title="The plan is not signed"
        live="polite"
        dismissible
        (dismissed)="shown.set(false)"
      >
        Send it to the owner before the deadline.
        <button uiAlertActions ui-button size="sm" (click)="sent.set(true)">Send</button>
      </ui-alert>
    }
    <ui-alert tone="danger" live="assertive">Saving failed.</ui-alert>
  `,
})
class Host {
  readonly shown = signal(true);
  readonly sent = signal(false);
}

describe('UiAlertHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds alerts by text, title and tone', async () => {
    expect(await loader.getAllHarnesses(UiAlertHarness)).toHaveLength(3);
    expect(await loader.getAllHarnesses(UiAlertHarness.with({ text: /^Send/ }))).toHaveLength(1);
    expect(
      await loader.getAllHarnesses(UiAlertHarness.with({ title: 'The plan is not signed' })),
    ).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiAlertHarness.with({ tone: 'danger' }))).toHaveLength(1);
  });

  it('reads the tone, title, text and how it is announced', async () => {
    const info = await loader.getHarness(UiAlertHarness.with({ tone: 'info' }));
    expect(await info.getText()).toBe('The plan is shared with the team.');
    expect(await info.getTitle()).toBe('');
    expect(await info.getLive()).toBe('off');
    expect(await info.isDismissible()).toBe(false);

    const warning = await loader.getHarness(UiAlertHarness.with({ tone: 'warning' }));
    expect(await warning.getTitle()).toBe('The plan is not signed');
    expect(await warning.getText()).toBe('Send it to the owner before the deadline.');
    expect(await warning.getLive()).toBe('polite');
    expect(await warning.isDismissible()).toBe(true);

    const danger = await loader.getHarness(UiAlertHarness.with({ tone: 'danger' }));
    expect(await danger.getLive()).toBe('assertive');
  });

  it('clicks an action without counting the close button', async () => {
    const warning = await loader.getHarness(UiAlertHarness.with({ tone: 'warning' }));
    const actions = await warning.getActions();
    expect(actions).toHaveLength(1);
    await (await warning.getActions({ text: 'Send' }))[0].click();
    expect(host.sent()).toBe(true);
    expect(await (await loader.getHarness(UiAlertHarness)).getActions()).toEqual([]);
  });

  it('dismisses a dismissible alert and refuses the others', async () => {
    const info = await loader.getHarness(UiAlertHarness.with({ tone: 'info' }));
    await expect(info.dismiss()).rejects.toThrow('not dismissible');

    await (await loader.getHarness(UiAlertHarness.with({ tone: 'warning' }))).dismiss();
    expect(host.shown()).toBe(false);
    expect(await loader.getAllHarnesses(UiAlertHarness)).toHaveLength(2);
  });

  it('says so when the element has no tone class', async () => {
    const bare = TestbedHarnessEnvironment.loader(TestBed.createComponent(BareAlert));
    await expect((await bare.getHarness(UiAlertHarness)).getTone()).rejects.toThrow(
      'no tone class',
    );
  });
});

@Component({ template: '<div class="ui-alert">Not a ui-alert</div>' })
class BareAlert {}

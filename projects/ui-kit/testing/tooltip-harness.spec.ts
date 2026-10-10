import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiTooltip } from '@vplans/ui-kit/tooltip';
import { UiTooltipHarness } from './tooltip-harness';

@Component({
  imports: [UiButton, UiIconButton, UiTooltip],
  template: `
    <button ui-button uiTooltip="Send the plan to the owner" uiTooltipPosition="bottom">
      Send
    </button>
    <button ui-icon-button label="Delete" uiTooltip="Delete the plan">x</button>
    <button ui-button uiTooltip="Not shown" uiTooltipDisabled>Archive</button>
  `,
})
class Host {}

describe('UiTooltipHarness', () => {
  let fixture: ComponentFixture<Host>;
  let loader: HarnessLoader;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => fixture.destroy());

  it('filters by trigger text and label', async () => {
    expect(await loader.getAllHarnesses(UiTooltipHarness)).toHaveLength(3);
    const send = await loader.getHarness(UiTooltipHarness.with({ text: 'Send' }));
    expect(await send.getText()).toBe('Send');
    expect(await send.getLabel()).toBeNull();
    const remove = await loader.getHarness(UiTooltipHarness.with({ label: 'Delete' }));
    expect(await remove.getLabel()).toBe('Delete');
  });

  it('shows and hides the tooltip and reads its text', async () => {
    const send = await loader.getHarness(UiTooltipHarness.with({ text: 'Send' }));
    expect(await send.isOpen()).toBe(false);
    expect(await send.getTooltipText()).toBe('');
    expect(await send.getPosition()).toBeNull();

    await send.show();
    await send.show();
    expect(await send.isOpen()).toBe(true);
    expect(await send.getTooltipText()).toBe('Send the plan to the owner');
    expect(await send.getPosition()).toBe('bottom');

    await send.hide();
    await send.hide();
    expect(await send.isOpen()).toBe(false);

    await send.show();
    expect(await send.isOpen()).toBe(true);
  });

  it('reads only the tooltip of its own trigger', async () => {
    const send = await loader.getHarness(UiTooltipHarness.with({ text: 'Send' }));
    const remove = await loader.getHarness(UiTooltipHarness.with({ label: 'Delete' }));
    await remove.show();
    expect(await send.isOpen()).toBe(false);
    expect(await remove.getTooltipText()).toBe('Delete the plan');
    expect(await remove.getPosition()).toBe('top');
  });

  it('does not show a disabled tooltip', async () => {
    const archive = await loader.getHarness(UiTooltipHarness.with({ text: 'Archive' }));
    await archive.show();
    expect(await archive.isOpen()).toBe(false);
  });
});

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiButtonHarness } from './button-harness';

@Component({
  imports: [UiButton, UiIconButton],
  template: `
    <button ui-button (click)="clicks.set(clicks() + 1)">Save</button>
    <button ui-button variant="danger" size="sm" [disabled]="true" (click)="clicks.set(-1)">
      Delete
    </button>
    <button ui-button [loading]="true">Sending</button>
    <button ui-icon-button label="Close"><span aria-hidden="true">×</span></button>
    <a ui-button variant="secondary" size="lg" href="/orders">Orders</a>
  `,
})
class Host {
  readonly clicks = signal(0);
}

describe('UiButtonHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds buttons, icon buttons and links', async () => {
    expect(await loader.getAllHarnesses(UiButtonHarness)).toHaveLength(5);
  });

  it('filters by text, label, variant and disabled state', async () => {
    expect(await (await loader.getHarness(UiButtonHarness.with({ text: 'Save' }))).getText()).toBe(
      'Save',
    );
    expect(await loader.getAllHarnesses(UiButtonHarness.with({ text: /^S/ }))).toHaveLength(2);
    expect(await loader.getAllHarnesses(UiButtonHarness.with({ label: 'Close' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(UiButtonHarness.with({ variant: 'danger' }))).toHaveLength(
      1,
    );
    expect(await loader.getAllHarnesses(UiButtonHarness.with({ disabled: true }))).toHaveLength(1);
  });

  it('clicks, and a disabled button ignores the click', async () => {
    await (await loader.getHarness(UiButtonHarness.with({ text: 'Save' }))).click();
    await (await loader.getHarness(UiButtonHarness.with({ text: 'Delete' }))).click();
    expect(host.clicks()).toBe(1);
  });

  it('reads the variant, size and states', async () => {
    const save = await loader.getHarness(UiButtonHarness.with({ text: 'Save' }));
    expect(await save.getVariant()).toBe('primary');
    expect(await save.getSize()).toBe('md');
    expect(await save.isDisabled()).toBe(false);
    expect(await save.isLoading()).toBe(false);
    expect(await save.getLabel()).toBeNull();

    const remove = await loader.getHarness(UiButtonHarness.with({ text: 'Delete' }));
    expect(await remove.getVariant()).toBe('danger');
    expect(await remove.getSize()).toBe('sm');
    expect(await remove.isDisabled()).toBe(true);

    const sending = await loader.getHarness(UiButtonHarness.with({ text: 'Sending' }));
    expect(await sending.isLoading()).toBe(true);
    expect(await sending.isDisabled()).toBe(false);
  });

  it('tells icon buttons and links apart', async () => {
    const close = await loader.getHarness(UiButtonHarness.with({ label: 'Close' }));
    expect(await close.isIconButton()).toBe(true);
    expect(await close.getVariant()).toBe('ghost');
    expect(await close.isLink()).toBe(false);

    const orders = await loader.getHarness(UiButtonHarness.with({ text: 'Orders' }));
    expect(await orders.isLink()).toBe(true);
    expect(await orders.isIconButton()).toBe(false);
    expect(await orders.getSize()).toBe('lg');
  });

  it('moves focus', async () => {
    const save = await loader.getHarness(UiButtonHarness.with({ text: 'Save' }));
    await save.focus();
    expect(await save.isFocused()).toBe(true);
    await save.blur();
    expect(await save.isFocused()).toBe(false);
  });
});

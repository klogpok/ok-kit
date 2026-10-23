import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiInput } from '@vplans/ui-kit/input';
import { UiPopoverPosition, UiPopoverTrigger } from '@vplans/ui-kit/popover';
import { UiButtonHarness } from './button-harness';
import { UiInputHarness } from './input-harness';
import { UiPopoverHarness } from './popover-harness';

@Component({
  imports: [UiButton, UiIconButton, UiInput, UiPopoverTrigger],
  template: `
    <button ui-button [uiPopoverTriggerFor]="filters" uiPopoverPosition="top">Filters</button>
    <button
      ui-icon-button
      label="Plan details"
      [uiPopoverTriggerFor]="details"
      [uiPopoverPosition]="position()"
    >
      i
    </button>
    <ng-template #filters let-close="close">
      <p>Show plans</p>
      <input ui-input aria-label="Owner" />
      <button ui-button (click)="applied.set(true); close()">Apply</button>
    </ng-template>
    <ng-template #details>Tower A, floor 3</ng-template>
  `,
})
class Host {
  readonly applied = signal(false);
  readonly position = signal<UiPopoverPosition>('bottom');
}

describe('UiPopoverHarness', () => {
  let fixture: ComponentFixture<Host>;
  let loader: HarnessLoader;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => fixture.destroy());

  it('filters by trigger text and label', async () => {
    expect(await loader.getAllHarnesses(UiPopoverHarness)).toHaveLength(2);
    const filters = await loader.getHarness(UiPopoverHarness.with({ text: 'Filters' }));
    expect(await filters.getText()).toBe('Filters');
    expect(await filters.getLabel()).toBeNull();
    const details = await loader.getHarness(UiPopoverHarness.with({ label: 'Plan details' }));
    expect(await details.getLabel()).toBe('Plan details');
  });

  it('opens and closes the popover and reads its content', async () => {
    const details = await loader.getHarness(UiPopoverHarness.with({ label: 'Plan details' }));
    expect(await details.isOpen()).toBe(false);
    expect(await details.getContentText()).toBe('');
    expect(await details.getPosition()).toBeNull();

    await details.open();
    await details.open();
    expect(await details.isOpen()).toBe(true);
    expect(await details.getContentText()).toBe('Tower A, floor 3');
    expect(await details.getPosition()).toBe('bottom');

    await details.close();
    await details.close();
    expect(await details.isOpen()).toBe(false);
    expect(await details.isFocused()).toBe(true);
  });

  it('reads the corner the popover flipped to', async () => {
    // A 400×300 viewport; the trigger touches its top, so there is no room above it.
    const root = document.documentElement;
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(400);
    vi.spyOn(root, 'clientHeight', 'get').mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('ui-popover-trigger')) {
        return DOMRect.fromRect({ x: 200, y: 0, width: 80, height: 30 });
      }
      if (this.classList.contains('cdk-overlay-pane')) {
        return DOMRect.fromRect({ width: 120, height: 60 });
      }
      return DOMRect.fromRect();
    });
    try {
      fixture.componentInstance.position.set('corner-top-end');
      const details = await loader.getHarness(UiPopoverHarness.with({ label: 'Plan details' }));
      await details.open();
      expect(await details.getPosition()).toBe('corner-bottom-end');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('loads harnesses inside the open popover', async () => {
    const filters = await loader.getHarness(UiPopoverHarness.with({ text: 'Filters' }));
    await expect(filters.getHarness(UiButtonHarness)).rejects.toThrow(/closed/);

    await filters.open();
    expect(await filters.getPosition()).toBe('top');
    await (await filters.getHarness(UiInputHarness.with({ label: 'Owner' }))).setValue('Dana');
    await (await filters.getHarness(UiButtonHarness.with({ text: 'Apply' }))).click();
    expect(fixture.componentInstance.applied()).toBe(true);
    expect(await filters.isOpen()).toBe(false);
  });
});

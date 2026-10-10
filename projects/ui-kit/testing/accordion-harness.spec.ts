import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiAccordion, UiAccordionContent, UiAccordionItem } from '@vplans/ui-kit/accordion';
import { UiButton } from '@vplans/ui-kit/button';
import { UiAccordionHarness, UiAccordionItemHarness } from './accordion-harness';
import { UiButtonHarness } from './button-harness';

@Component({
  imports: [UiAccordion, UiAccordionItem, UiAccordionContent, UiButton],
  template: `
    <ui-accordion>
      <ui-accordion-item label="Details" [(expanded)]="details">
        <button ui-button>Edit details</button>
      </ui-accordion-item>
      <ui-accordion-item label="Blocked" disabled>Blocked body</ui-accordion-item>
      <ui-accordion-item label="History">
        <ng-template uiAccordionContent><button ui-button>Load history</button></ng-template>
      </ui-accordion-item>
    </ui-accordion>
    <ui-accordion-item label="Standalone">Alone</ui-accordion-item>
  `,
})
class Host {
  readonly details = signal(true);
}

describe('UiAccordionHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('reads the items and filters them by label, expanded and disabled state', async () => {
    const accordion = await loader.getHarness(UiAccordionHarness);
    const items = await accordion.getItems();
    expect(await Promise.all(items.map((item) => item.getLabel()))).toEqual([
      'Details',
      'Blocked',
      'History',
    ]);
    expect(await items[0].isExpanded()).toBe(true);
    expect(await items[1].isDisabled()).toBe(true);
    expect(await items[2].isDisabled()).toBe(false);
    expect(await accordion.getItems({ expanded: false })).toHaveLength(2);
    expect(await accordion.getItems({ disabled: true })).toHaveLength(1);
    expect(await accordion.getExpandedLabels()).toEqual(['Details']);

    expect(await loader.getAllHarnesses(UiAccordionItemHarness)).toHaveLength(4);
    const alone = await loader.getHarness(UiAccordionItemHarness.with({ label: 'Standalone' }));
    expect(await alone.isExpanded()).toBe(false);
  });

  it('expands and collapses items as the user does', async () => {
    const accordion = await loader.getHarness(UiAccordionHarness);
    const details = await accordion.getItem({ label: 'Details' });
    await details.collapse();
    expect(await details.isExpanded()).toBe(false);
    expect(host.details()).toBe(false);
    await details.collapse();
    expect(await details.isExpanded()).toBe(false);

    await accordion.expand({ label: 'History' });
    expect(await accordion.getExpandedLabels()).toEqual(['History']);
    await (await accordion.getItem({ label: 'History' })).toggle();
    expect(await accordion.getExpandedLabels()).toEqual([]);

    const blocked = await accordion.getItem({ label: 'Blocked' });
    await blocked.expand();
    expect(await blocked.isExpanded()).toBe(false);
    await expect(accordion.expand({ label: 'Plans' })).rejects.toThrow('No accordion item matches');
  });

  it('focuses the header and loads harnesses of the panel content', async () => {
    const history = await loader.getHarness(UiAccordionItemHarness.with({ label: 'History' }));
    await history.focus();
    expect(await history.isFocused()).toBe(true);

    expect(await history.getAllHarnesses(UiButtonHarness)).toHaveLength(0);
    await history.expand();
    const load = await history.getHarness(UiButtonHarness);
    expect(await load.getText()).toBe('Load history');
  });
});

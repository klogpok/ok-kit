import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiTab, UiTabContent, UiTabGroup, UiTabLabel } from './tabs';

let lazyCreated = 0;

// The CDK key managers read the legacy keyCode.
const KEY_CODES: Record<string, number> = { ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35 };

@Component({ selector: 'ui-test-lazy', template: 'Lazy content' })
class LazyContent {
  constructor() {
    lazyCreated++;
  }
}

@Component({
  imports: [UiTabGroup, UiTab, UiTabLabel, UiTabContent, LazyContent],
  template: `
    <div [attr.dir]="dir()">
      <ui-tab-group [(selectedIndex)]="index" [activation]="activation()" aria-label="Plan">
        <ui-tab label="Details">Details panel</ui-tab>
        <ui-tab label="Disabled" disabled>Never shown</ui-tab>
        <ui-tab>
          <ng-template uiTabLabel><b>Docs</b> 3</ng-template>
          <ng-template uiTabContent><ui-test-lazy /></ng-template>
        </ui-tab>
        <ui-tab label="History">History panel</ui-tab>
      </ui-tab-group>
    </div>
  `,
})
class Host {
  readonly index = signal(0);
  readonly activation = signal<'automatic' | 'manual'>('automatic');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

describe('UiTabGroup', () => {
  let fixture: ComponentFixture<Host>;
  let root: HTMLElement;
  const tabs = () => [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panels = () => [...root.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  const key = async (target: HTMLElement, name: string) => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: name, keyCode: KEY_CODES[name], bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    lazyCreated = 0;
    fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => root.remove());

  it('renders a tablist with linked tabs and panels', () => {
    expect(root.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('Plan');
    expect(root.querySelector('ui-tab-group')!.hasAttribute('aria-label')).toBe(false);
    expect(tabs().map((t) => t.textContent!.trim())).toEqual([
      'Details',
      'Disabled',
      'Docs 3',
      'History',
    ]);
    tabs().forEach((tab, i) => {
      const panel = panels()[i];
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    });
  });

  it('marks only the selected tab and shows only its panel', () => {
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(panels().map((p) => p.hidden)).toEqual([false, true, true, true]);
    expect(panels()[0].textContent).toContain('Details panel');
    expect(panels()[3].textContent).not.toContain('History panel');
  });

  it('selects on click and updates the model', async () => {
    tabs()[3].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.index()).toBe(3);
    expect(tabs()[3].getAttribute('aria-selected')).toBe('true');
    expect(panels()[3].textContent).toContain('History panel');
  });

  it('does not select a disabled tab', () => {
    expect(tabs()[1].disabled).toBe(true);
    fixture.componentInstance.index.set(1);
    fixture.detectChanges();
    expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('moves an out of range index to the last tab in the model', () => {
    fixture.componentInstance.index.set(9);
    fixture.detectChanges();
    expect(tabs()[3].getAttribute('aria-selected')).toBe('true');
    expect(fixture.componentInstance.index()).toBe(3);
  });

  it('moves with arrow keys, skips disabled tabs and wraps', async () => {
    tabs()[0].focus();
    await key(tabs()[0], 'ArrowRight');
    expect(fixture.componentInstance.index()).toBe(2);
    expect(document.activeElement).toBe(tabs()[2]);

    await key(tabs()[2], 'End');
    expect(fixture.componentInstance.index()).toBe(3);

    await key(tabs()[3], 'ArrowRight');
    expect(fixture.componentInstance.index()).toBe(0);

    await key(tabs()[0], 'ArrowLeft');
    expect(fixture.componentInstance.index()).toBe(3);

    await key(tabs()[3], 'Home');
    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('mirrors arrow keys in RTL', async () => {
    fixture.componentInstance.dir.set('rtl');
    fixture.detectChanges();
    tabs()[0].focus();
    await key(tabs()[0], 'ArrowLeft');
    expect(fixture.componentInstance.index()).toBe(2);
  });

  it('only moves focus with manual activation', async () => {
    fixture.componentInstance.activation.set('manual');
    fixture.detectChanges();
    tabs()[0].focus();
    await key(tabs()[0], 'ArrowRight');
    expect(document.activeElement).toBe(tabs()[2]);
    expect(fixture.componentInstance.index()).toBe(0);
  });

  it('creates lazy content only when its tab is selected', async () => {
    expect(lazyCreated).toBe(0);
    tabs()[2].click();
    fixture.detectChanges();
    expect(lazyCreated).toBe(1);
    expect(panels()[2].textContent).toContain('Lazy content');
  });
});

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiAccordion, UiAccordionContent, UiAccordionItem } from './accordion';

@Component({
  selector: 'ui-test-lazy',
  template: 'lazy body',
})
class LazyBody {
  static created = 0;
  constructor() {
    LazyBody.created++;
  }
}

@Component({
  imports: [UiAccordion, UiAccordionItem, UiAccordionContent, LazyBody],
  template: `
    <ui-accordion #acc="uiAccordion" [multi]="multi()">
      <ui-accordion-item
        label="Details"
        [(expanded)]="first"
        (opened)="openedCount = openedCount + 1"
      >
        Details body
      </ui-accordion-item>
      <ui-accordion-item label="Blocked" disabled>Blocked body</ui-accordion-item>
      <ui-accordion-item label="History" headingLevel="2">
        <ng-template uiAccordionContent><ui-test-lazy /></ng-template>
      </ui-accordion-item>
    </ui-accordion>
  `,
})
class Host {
  readonly multi = signal(false);
  readonly first = signal(true);
  openedCount = 0;
}

describe('UiAccordion', () => {
  let fixture: ComponentFixture<Host>;
  const root = () => fixture.nativeElement as HTMLElement;
  const triggers = () => [
    ...root().querySelectorAll<HTMLButtonElement>('.ui-accordion-item__trigger'),
  ];
  const items = () => [...root().querySelectorAll<HTMLElement>('ui-accordion-item')];
  const expanded = () => triggers().map((t) => t.getAttribute('aria-expanded'));
  const key = (target: HTMLElement, key: string, keyCode: number) => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, keyCode, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    LazyBody.created = 0;
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders headers with the APG structure', () => {
    const [first, , third] = triggers();
    const heading = first.parentElement!;
    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('3');
    expect(third.parentElement!.getAttribute('aria-level')).toBe('2');
    expect(first.textContent).toContain('Details');

    const panel = root().querySelector(`#${first.getAttribute('aria-controls')}`)!;
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-labelledby')).toBe(first.id);
  });

  it('reflects expanded state and supports two-way binding', async () => {
    expect(expanded()).toEqual(['true', 'false', 'false']);
    expect(items()[0].classList).toContain('ui-accordion-item--expanded');

    triggers()[0].click();
    fixture.detectChanges();
    expect(expanded()[0]).toBe('false');
    expect(fixture.componentInstance.first()).toBe(false);

    fixture.componentInstance.first.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(expanded()[0]).toBe('true');
  });

  it('keeps one item open unless multi is set', () => {
    triggers()[2].click();
    fixture.detectChanges();
    expect(expanded()).toEqual(['false', 'false', 'true']);

    fixture.componentInstance.multi.set(true);
    fixture.detectChanges();
    triggers()[0].click();
    fixture.detectChanges();
    expect(expanded()).toEqual(['true', 'false', 'true']);
  });

  it('emits opened', () => {
    const before = fixture.componentInstance.openedCount;
    triggers()[0].click();
    triggers()[0].click();
    expect(fixture.componentInstance.openedCount).toBe(before + 1);
  });

  it('disables items', () => {
    const blocked = triggers()[1];
    expect(blocked.disabled).toBe(true);
    expect(items()[1].classList).toContain('ui-accordion-item--disabled');
  });

  it('creates lazy content on first open and keeps it', () => {
    expect(LazyBody.created).toBe(0);
    expect(root().querySelector('ui-test-lazy')).toBeNull();

    triggers()[2].click();
    fixture.detectChanges();
    expect(root().querySelector('ui-test-lazy')).not.toBeNull();

    triggers()[0].click();
    fixture.detectChanges();
    expect(expanded()[2]).toBe('false');
    expect(root().querySelector('ui-test-lazy')).not.toBeNull();
    expect(LazyBody.created).toBe(1);
  });

  it('moves focus between headers with arrows, Home and End, skipping disabled', () => {
    const [first, , third] = triggers();
    first.focus();
    key(first, 'ArrowDown', 40);
    expect(document.activeElement).toBe(third);
    key(third, 'ArrowDown', 40);
    expect(document.activeElement).toBe(first);
    key(first, 'End', 35);
    expect(document.activeElement).toBe(third);
    key(third, 'Home', 36);
    expect(document.activeElement).toBe(first);
    key(first, 'ArrowUp', 38);
    expect(document.activeElement).toBe(third);
  });

  it('exposes openAll and closeAll', () => {
    const acc = fixture.debugElement.children[0].references['acc'] as UiAccordion;
    fixture.componentInstance.multi.set(true);
    fixture.detectChanges();
    acc.openAll();
    fixture.detectChanges();
    expect(expanded()).toEqual(['true', 'false', 'true']);
    acc.closeAll();
    fixture.detectChanges();
    expect(expanded()).toEqual(['false', 'false', 'false']);
  });
});

@Component({
  imports: [UiAccordion, UiAccordionItem],
  template: `
    <ui-accordion>
      <div><ui-accordion-item id="a" label="A" /></div>
      <ui-accordion-item id="b" label="B" [expanded]="true">
        <ui-accordion>
          <ui-accordion-item id="nested" label="Nested" />
        </ui-accordion>
      </ui-accordion-item>
      <section><ui-accordion-item id="c" label="C" /></section>
    </ui-accordion>
  `,
})
class WrappedHost {}

describe('UiAccordion with wrapped and nested items', () => {
  it('moves between its own items, also inside wrappers, and skips nested accordions', () => {
    const fixture = TestBed.createComponent(WrappedHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const trigger = (id: string) =>
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(`#${id} button`)!;
    const press = (target: HTMLElement) =>
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }),
      );

    trigger('a').focus();
    press(trigger('a'));
    expect(document.activeElement).toBe(trigger('b'));
    press(trigger('b'));
    expect(document.activeElement).toBe(trigger('c'));
    (fixture.nativeElement as HTMLElement).remove();
  });
});

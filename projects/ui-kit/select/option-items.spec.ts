import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { UiMultiSelect } from './multi-select';
import { UiOptionItem } from './option-items';
import { UiSelect } from './select';

// The CDK key managers read the legacy keyCode.
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Enter: 13,
  Escape: 27,
  Home: 36,
  End: 35,
  PageDown: 34,
  PageUp: 33,
  ' ': 32,
};

function keydown(target: HTMLElement, key: string): KeyboardEvent {
  const keyCode = KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0);
  const event = new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** The viewport renders its window in an animation frame. */
async function frame(fixture: ComponentFixture<unknown>): Promise<void> {
  await settle(fixture);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle(fixture);
}

// jsdom has no Element.scrollTo, which the viewport calls to bring an option into view.
beforeAll(() => {
  Element.prototype.scrollTo = () => undefined;
});

afterAll(() => {
  delete (Element.prototype as Partial<Element>).scrollTo;
});

const options = () => [...document.querySelectorAll<HTMLElement>('ui-option')];
const viewport = () => document.querySelector('cdk-virtual-scroll-viewport');

/** `count` apartments; every tenth one is disabled. */
function apartments(count: number): UiOptionItem<number>[] {
  return Array.from({ length: count }, (_, i) => ({
    value: i + 1,
    label: `Apartment ${i + 1}`,
    disabled: i % 10 === 9,
  }));
}

const SHORT: UiOptionItem<string>[] = [
  { value: 'dana', label: 'Dana', description: 'Coordinator' },
  { value: 'david', label: 'David', disabled: true },
  { value: 'yael', label: 'Yael' },
];

@Component({
  imports: [UiSelect, ReactiveFormsModule],
  template: `
    <ui-select
      aria-label="Apartment"
      [formControl]="control"
      [items]="items()"
      [searchable]="searchable()"
      [virtualThreshold]="threshold()"
    />
  `,
})
class SelectHost {
  readonly control = new FormControl<unknown>(null);
  readonly items = signal<readonly UiOptionItem[]>(apartments(1000));
  readonly searchable = signal(false);
  readonly threshold = signal(100);
}

@Component({
  imports: [UiMultiSelect],
  template: `
    <ui-multi-select
      aria-label="Apartments"
      selectAll
      [searchable]="searchable()"
      [items]="items()"
      [(value)]="value"
    />
  `,
})
class MultiHost {
  readonly items = signal(apartments(300));
  readonly value = signal<readonly number[]>([]);
  readonly searchable = signal(false);
}

@Component({
  imports: [UiSelect, FormsModule],
  template: `<ui-select aria-label="Apartment" [items]="items" [(ngModel)]="value" />`,
})
class NgModelHost {
  readonly items = apartments(300);
  value: number | null = 42;
}

describe('UiSelect with items', () => {
  let fixture: ComponentFixture<SelectHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLElement>('.ui-select__control')!;
  const open = async () => {
    control().click();
    await settle(fixture);
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(SelectHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    root.remove();
    vi.restoreAllMocks();
  });

  describe('below the threshold', () => {
    beforeEach(async () => {
      fixture.componentInstance.items.set(SHORT);
      await settle(fixture);
    });

    it('renders every item as an option, without a viewport', async () => {
      await open();
      expect(viewport()).toBeNull();
      expect(
        options().map((o) => o.querySelector('.ui-option__label')!.textContent!.trim()),
      ).toEqual(['Dana', 'David', 'Yael']);
      expect(options()[0].querySelector('.ui-option__description')!.textContent).toBe(
        'Coordinator',
      );
      expect(options()[1].getAttribute('aria-disabled')).toBe('true');
    });

    it('selects an item on click and reports it to the form', async () => {
      await open();
      options()[2].click();
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toBe('yael');
      expect(control().textContent!.trim()).toBe('Yael');
    });

    it('labels the value from the items without opening the list', async () => {
      fixture.componentInstance.control.setValue('dana');
      await settle(fixture);
      expect(control().textContent!.trim()).toBe('Dana');
    });

    it('moves past disabled items with the keyboard', async () => {
      control().focus();
      keydown(control(), 'ArrowDown');
      await settle(fixture);
      keydown(control(), 'ArrowDown');
      await settle(fixture);
      const active = document.getElementById(control().getAttribute('aria-activedescendant')!);
      expect(active).toBe(options()[2]);
      expect(active!.classList).toContain('ui-option--active');
      expect(options()[0].classList).not.toContain('ui-option--active');
    });

    it('turns on the viewport at a lower virtualThreshold', async () => {
      fixture.componentInstance.threshold.set(3);
      await settle(fixture);
      await open();
      expect(viewport()).not.toBeNull();
    });
  });

  describe('above the threshold', () => {
    it('renders only a window of the options in a viewport', async () => {
      await open();
      await frame(fixture);
      expect(viewport()).not.toBeNull();
      expect(options().length).toBeGreaterThan(0);
      expect(options().length).toBeLessThan(100);
      // Assistive technologies get the position in the whole list.
      expect(options()[0].getAttribute('aria-setsize')).toBe('1000');
      expect(options()[0].getAttribute('aria-posinset')).toBe('1');
    });

    it('points aria-activedescendant at a rendered option', async () => {
      keydown(control(), 'ArrowDown');
      await frame(fixture);
      const active = document.getElementById(control().getAttribute('aria-activedescendant')!);
      expect(active).toBe(options()[0]);
      expect(active!.classList).toContain('ui-option--active');
    });

    it('moves to options that are not rendered and selects them', async () => {
      const scroll = vi.spyOn(CdkVirtualScrollViewport.prototype, 'scrollToOffset');
      keydown(control(), 'ArrowDown');
      await settle(fixture);
      keydown(control(), 'End');
      await settle(fixture);
      expect(scroll).toHaveBeenCalled();
      expect(scroll.mock.lastCall![0]).toBeGreaterThan(0);
      // The last option is not rendered here (jsdom does not scroll), so nothing is active in the DOM.
      expect(control().hasAttribute('aria-activedescendant')).toBe(false);

      keydown(control(), 'Enter');
      await settle(fixture);
      // 1000 is disabled, like every tenth one.
      expect(fixture.componentInstance.control.value).toBe(999);
      expect(control().textContent!.trim()).toBe('Apartment 999');
    });

    it('opens a closed list at the last item with End', async () => {
      const scroll = vi.spyOn(CdkVirtualScrollViewport.prototype, 'scrollToOffset');
      keydown(control(), 'End');
      await frame(fixture);
      expect(scroll).toHaveBeenCalled();
      expect(scroll.mock.lastCall![0]).toBeGreaterThan(0);
      keydown(control(), 'Enter');
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toBe(999);
    });

    it('scrolls again once it has measured a taller option', async () => {
      // Options with a description are taller than the default size of the viewport.
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ width: 200, height: 44 }),
      );
      // A laid-out viewport, as in the browser.
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
      vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(100_000);
      const scroll = vi.spyOn(CdkVirtualScrollViewport.prototype, 'scrollToOffset');
      keydown(control(), 'End');
      await frame(fixture);
      await frame(fixture);
      // 999 is the last enabled item, at index 998: its end meets the end of the 300px viewport.
      expect(scroll.mock.lastCall![0]).toBe(999 * 44 - 300);
    });

    it('skips disabled items that are not rendered', async () => {
      keydown(control(), 'ArrowDown');
      await settle(fixture);
      for (let i = 0; i < 9; i++) keydown(control(), 'ArrowDown');
      keydown(control(), 'Enter');
      await settle(fixture);
      // Apartment 10 is disabled.
      expect(fixture.componentInstance.control.value).toBe(11);
    });

    it('opens at the selected item', async () => {
      const scroll = vi.spyOn(CdkVirtualScrollViewport.prototype, 'scrollToOffset');
      fixture.componentInstance.control.setValue(501);
      await settle(fixture);
      await open();
      expect(scroll).toHaveBeenCalled();
      // The first arrow activates the selected item, the second moves on.
      keydown(control(), 'ArrowDown');
      keydown(control(), 'ArrowDown');
      keydown(control(), 'Enter');
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toBe(502);
    });

    it('filters all items with the search, not only the rendered ones', async () => {
      fixture.componentInstance.searchable.set(true);
      await settle(fixture);
      const input = control() as HTMLInputElement;
      input.value = 'Apartment 99';
      input.dispatchEvent(new Event('input'));
      await frame(fixture);
      // 99 and 990–999.
      const labels = options().map((o) =>
        o.querySelector('.ui-option__label')!.textContent!.trim(),
      );
      expect(labels[0]).toBe('Apartment 99');
      expect(options()[0].getAttribute('aria-setsize')).toBe('11');
      keydown(input, 'Enter');
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toBe(99);
    });

    it('jumps with typeahead to an option that is not rendered', async () => {
      fixture.componentInstance.items.set([
        ...apartments(999),
        { value: 'zion', label: 'Zion tower' },
      ]);
      await settle(fixture);
      vi.useFakeTimers();
      try {
        keydown(control(), 'ArrowDown');
        fixture.detectChanges();
        keydown(control(), 'z');
        vi.advanceTimersByTime(250);
        fixture.detectChanges();
      } finally {
        vi.useRealTimers();
      }
      keydown(control(), 'Enter');
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toBe('zion');
    });

    it('moves a page up from an option that is not rendered', async () => {
      keydown(control(), 'ArrowDown');
      await settle(fixture);
      keydown(control(), 'End');
      keydown(control(), 'PageUp');
      keydown(control(), 'Enter');
      await settle(fixture);
      // From 999 (1000 is disabled) ten options up.
      expect(fixture.componentInstance.control.value).toBe(989);
    });

    it('marks only the active one of two items with the same value', async () => {
      fixture.componentInstance.items.set([
        { value: 1, label: 'Apartment 1' },
        { value: 1, label: 'Apartment 1 (copy)' },
        ...apartments(200).slice(1),
      ]);
      await settle(fixture);
      keydown(control(), 'ArrowDown');
      await settle(fixture);
      keydown(control(), 'ArrowDown');
      await frame(fixture);
      const active = options().filter((option) => option.classList.contains('ui-option--active'));
      expect(active).toEqual([options()[1]]);
      expect(control().getAttribute('aria-activedescendant')).toBe(options()[1].id);
    });

    it('drops the active option when the items change', async () => {
      keydown(control(), 'ArrowDown');
      await settle(fixture);
      fixture.componentInstance.items.set(apartments(200).map((item) => ({ ...item })));
      await settle(fixture);
      keydown(control(), 'Enter');
      await settle(fixture);
      expect(fixture.componentInstance.control.value).toBe(1);
    });
  });
});

describe('UiSelect with items and ngModel', () => {
  it('shows the model value and writes the chosen item back', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const control = root.querySelector<HTMLElement>('.ui-select__control')!;
    expect(control.textContent!.trim()).toBe('Apartment 42');

    keydown(control, 'ArrowDown');
    await settle(fixture);
    keydown(control, 'ArrowDown');
    keydown(control, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value).toBe(43);
    root.remove();
  });
});

describe('UiMultiSelect with items', () => {
  let fixture: ComponentFixture<MultiHost>;
  let root: HTMLElement;
  const control = () => root.querySelector<HTMLElement>('.ui-select__control')!;

  beforeEach(async () => {
    fixture = TestBed.createComponent(MultiHost);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('keeps "select all" above the viewport and selects every enabled item', async () => {
    control().click();
    await frame(fixture);
    const all = document.querySelector<HTMLElement>('.ui-select__all')!;
    expect(all.closest('cdk-virtual-scroll-viewport')).toBeNull();
    // "Select all" opens the set that the items continue.
    expect(all.getAttribute('aria-posinset')).toBe('1');
    expect(all.getAttribute('aria-setsize')).toBe('301');
    expect(options()[1].getAttribute('aria-posinset')).toBe('2');
    expect(options()[1].getAttribute('aria-setsize')).toBe('301');
    all.click();
    await settle(fixture);
    expect(fixture.componentInstance.value().length).toBe(270);
  });

  it('toggles items that are not rendered with the keyboard', async () => {
    keydown(control(), 'ArrowDown');
    await settle(fixture);
    keydown(control(), 'End');
    keydown(control(), 'Enter');
    await settle(fixture);
    // 300 is disabled, like every tenth one.
    expect(fixture.componentInstance.value()).toEqual([299]);
  });

  it('opens a closed list at the last item with End and toggles it', async () => {
    fixture.componentInstance.searchable.set(true);
    fixture.componentInstance.value.set([3, 120]);
    await settle(fixture);
    keydown(control(), 'End');
    await frame(fixture);
    keydown(control(), 'Enter');
    await settle(fixture);
    // 300 is disabled, like every tenth one.
    expect(fixture.componentInstance.value()).toEqual([3, 120, 299]);
  });

  it('lists the labels of the selected items in the trigger', async () => {
    fixture.componentInstance.value.set([250, 3]);
    await settle(fixture);
    expect(control().textContent!.trim()).toBe('Apartment 3, Apartment 250');
  });
});

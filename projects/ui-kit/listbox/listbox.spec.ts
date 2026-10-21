import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  input,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { UI_LABELS, ɵUiDropdownPanel as UiDropdownPanel } from '@vplans/ui-kit/core';
import { UiListboxMode, injectListbox, provideUiListbox } from './listbox-controller';
import { UiListbox } from './listbox';
import { UiOption } from './option';
import { UiOptionItem } from './option-items';

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
  Tab: 9,
  ' ': 32,
};

function keydown(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const keyCode = KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0);
  const event = new KeyboardEvent('keydown', {
    key,
    keyCode,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

const SELECT_ALL = 'all';

/** A field on the listbox controller, as the kit's fields use it. */
@Component({
  selector: 'ui-test-field',
  imports: [CdkOverlayOrigin, UiDropdownPanel, UiListbox, UiOption],
  providers: [provideUiListbox()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin">
      <input
        class="control"
        role="combobox"
        [attr.aria-expanded]="listbox.shown()"
        [attr.aria-controls]="listbox.shown() ? listbox.panelId() : null"
        [attr.aria-activedescendant]="listbox.shown() ? listbox.activeId() : null"
        (click)="listbox.open({ activate: false })"
        (keydown)="onKeydown($event)"
      />
    </div>
    <ng-template [uiDropdownPanel]="origin" [open]="listbox.shown()" (closed)="listbox.close()">
      <ui-listbox>
        @if (selectAll()) {
          <ui-option uiListboxLeading #leading [value]="selectAllValue">All</ui-option>
        }
        <ng-content />
      </ui-listbox>
    </ng-template>
  `,
})
class TestField {
  readonly mode = input<UiListboxMode>('trigger');
  readonly items = input<readonly UiOptionItem<string>[] | null>(null);
  readonly virtualThreshold = input(100);
  readonly filterText = input('');
  readonly activateOnOpen = input(true);
  readonly openAt = input<string | null>(null);
  readonly showEmpty = input(true);
  readonly selectAll = input(false);
  readonly multiple = input(false);
  readonly locked = input(false);
  readonly creatable = input(false);
  /** The "Select all" leading action. */
  readonly allAction = input(false);
  readonly value = model<readonly string[]>([]);
  /** Keys the listbox left to the field. */
  readonly unhandled: string[] = [];
  readonly events: string[] = [];
  protected readonly selectAllValue = SELECT_ALL;
  /** Text typed into the control. */
  private readonly query = signal('');

  private readonly content = contentChildren<UiOption<string>>(UiOption, { descendants: true });
  private readonly leading = viewChildren<UiOption<string>>('leading');

  readonly listbox = injectListbox<string>({
    mode: this.mode,
    id: () => 'fruit',
    ariaLabel: () => 'Fruit',
    contentOptions: this.content,
    leadingOptions: this.leading,
    items: this.items,
    virtualThreshold: this.virtualThreshold,
    filterText: () => this.query() || this.filterText(),
    createAction: {
      available: this.creatable,
      selected: this.value,
      create: (text) => {
        this.events.push(`create ${text}`);
        this.value.set([...this.value(), text]);
        this.query.set('');
      },
    },
    selectAllAction: {
      available: this.allAction,
      selectAll: (values, on) => {
        this.events.push(`${on ? 'select' : 'deselect'} ${values.join(',')}`);
        const current = this.value();
        this.value.set(
          on
            ? [...current, ...values.filter((value) => !current.includes(value))]
            : current.filter((value) => !values.includes(value)),
        );
      },
    },
    activateOnOpen: this.activateOnOpen,
    openAt: () => this.openAt(),
    showEmpty: this.showEmpty,
    locked: this.locked,
    displayWith: () => (value) => `#${value}`,
    alwaysShown: (option) => option.value() === SELECT_ALL,
    isSelected: (value) => this.value().includes(value as string),
    select: (value) => {
      this.value.set([...this.value(), value as string]);
      if (!this.multiple()) this.listbox.close();
    },
    opened: () => this.events.push('opened'),
    closed: () => this.events.push('closed'),
  });

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.listbox.handleKeydown(event)) this.unhandled.push(event.key);
  }

  /** Typing in a searchable field: the list opens at the first option the search shows. */
  search(text: string): void {
    this.query.set(text);
    this.listbox.open();
    this.listbox.activateFirst();
  }
}

@Component({
  imports: [TestField, UiOption],
  template: `
    <ui-test-field
      [mode]="mode()"
      [activateOnOpen]="activateOnOpen()"
      [openAt]="openAt()"
      [showEmpty]="showEmpty()"
      [selectAll]="selectAll()"
      [multiple]="selectAll() || allAction()"
      [locked]="locked()"
      [creatable]="creatable()"
      [allAction]="allAction()"
      [items]="items()"
      [virtualThreshold]="virtualThreshold()"
      [filterText]="filterText()"
      [(value)]="value"
    >
      @for (fruit of fruits(); track fruit) {
        <ui-option [value]="fruit" [disabled]="fruit === 'Cherry'">{{ fruit }}</ui-option>
      }
    </ui-test-field>
  `,
})
class Host {
  readonly mode = signal<UiListboxMode>('trigger');
  readonly activateOnOpen = signal(true);
  readonly openAt = signal<string | null>(null);
  readonly showEmpty = signal(true);
  readonly selectAll = signal(false);
  readonly locked = signal(false);
  readonly creatable = signal(false);
  readonly allAction = signal(false);
  readonly items = signal<readonly UiOptionItem<string>[] | null>(null);
  readonly virtualThreshold = signal(100);
  readonly filterText = signal('');
  readonly fruits = signal(['Apple', 'Banana', 'Cherry', 'Date']);
  readonly value = signal<readonly string[]>([]);
}

describe('UiListboxController', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let field: TestField;

  const control = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.control')!;
  const panel = () => document.querySelector<HTMLElement>('ui-listbox');
  const activeLabel = () => {
    const id = control().getAttribute('aria-activedescendant');
    return id ? (document.getElementById(id)?.textContent ?? '').trim() : null;
  };
  const press = async (key: string, init?: KeyboardEventInit) => {
    const event = keydown(control(), key, init);
    await settle(fixture);
    return event;
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await settle(fixture);
    field = fixture.debugElement.children[0].componentInstance as TestField;
  });

  afterEach(() => fixture.destroy());

  describe('trigger mode', () => {
    it('opens with ArrowDown at the first option and moves past disabled ones', async () => {
      const event = await press('ArrowDown');
      expect(event.defaultPrevented).toBe(true);
      expect(panel()).not.toBeNull();
      expect(control().getAttribute('aria-controls')).toBe('fruit-listbox');
      expect(panel()!.id).toBe('fruit-listbox');
      expect(activeLabel()).toBe('Apple');
      await press('ArrowDown');
      await press('ArrowDown');
      expect(activeLabel()).toBe('Date');
    });

    it('opens with ArrowUp, Enter and Space at the selected option', async () => {
      host.value.set(['Banana']);
      await settle(fixture);
      for (const key of ['ArrowUp', 'Enter', ' ']) {
        await press(key);
        expect(activeLabel()).toBe('Banana');
        await press('Escape');
        expect(panel()).toBeNull();
      }
    });

    it('opens with Home and End at the first and last option', async () => {
      await press('End');
      expect(activeLabel()).toBe('Date');
      await press('Home');
      expect(activeLabel()).toBe('Apple');
    });

    it('opens at the option a letter starts (typeahead)', async () => {
      await press('d');
      await new Promise((resolve) => setTimeout(resolve, 250));
      await settle(fixture);
      expect(activeLabel()).toBe('Date');
    });

    it('starts ArrowDown and ArrowUp at the ends of a list opened with a click', async () => {
      control().click();
      await settle(fixture);
      expect(activeLabel()).toBeNull();
      await press('ArrowUp');
      expect(activeLabel()).toBe('Date');
      await press('Escape');
      control().click();
      await settle(fixture);
      await press('ArrowDown');
      expect(activeLabel()).toBe('Apple');
    });

    it('starts at the selected option of a list opened with a click', async () => {
      host.value.set(['Banana']);
      await settle(fixture);
      control().click();
      await settle(fixture);
      expect(activeLabel()).toBeNull();
      await press('ArrowUp');
      expect(activeLabel()).toBe('Banana');
    });

    it('selects with Enter and Space and closes with Escape, Alt+ArrowUp and Tab', async () => {
      await press('ArrowDown');
      await press('Enter');
      expect(host.value()).toEqual(['Apple']);
      expect(panel()).toBeNull();
      await press('ArrowDown');
      await press('ArrowDown');
      await press(' ');
      expect(host.value()).toEqual(['Apple', 'Banana']);

      await press('ArrowDown');
      const outer = vi.fn();
      document.body.addEventListener('keydown', outer);
      const escape = await press('Escape');
      document.body.removeEventListener('keydown', outer);
      expect(escape.defaultPrevented).toBe(true);
      expect(outer).not.toHaveBeenCalled();
      expect(panel()).toBeNull();

      await press('ArrowDown');
      await press('ArrowUp', { altKey: true });
      expect(panel()).toBeNull();

      await press('ArrowDown');
      const tab = await press('Tab');
      expect(tab.defaultPrevented).toBe(false);
      expect(panel()).toBeNull();
      expect(field.events).toEqual(Array.from({ length: 5 }, () => ['opened', 'closed']).flat());
    });
  });

  describe('searchable mode', () => {
    beforeEach(async () => {
      host.mode.set('searchable');
      await settle(fixture);
    });

    it('leaves Space, letters and Home/End of an open list to the text', async () => {
      await press('ArrowDown');
      expect(activeLabel()).toBe('Apple');
      for (const key of [' ', 'b', 'Home', 'End']) {
        const event = await press(key);
        expect(event.defaultPrevented).toBe(false);
      }
      expect(field.unhandled).toEqual([' ', 'b', 'Home', 'End']);
      expect(activeLabel()).toBe('Apple');
    });

    it('opens with Enter, but leaves Space and letters of a closed list to the text', async () => {
      await press(' ');
      await press('a');
      expect(panel()).toBeNull();
      await press('Enter');
      expect(activeLabel()).toBe('Apple');
      await press('PageDown');
      expect(activeLabel()).toBe('Date');
    });
  });

  describe('free text mode', () => {
    beforeEach(async () => {
      host.mode.set('freeText');
      host.activateOnOpen.set(false);
      await settle(fixture);
    });

    it('opens with ArrowDown at the first option and with ArrowUp at the last', async () => {
      await press('ArrowDown');
      expect(activeLabel()).toBe('Apple');
      await press('Escape');
      await press('ArrowUp');
      expect(activeLabel()).toBe('Date');
    });

    it('opens with Alt+ArrowDown without an active option; ArrowUp then starts at the end', async () => {
      await press('ArrowDown', { altKey: true });
      expect(panel()).not.toBeNull();
      expect(activeLabel()).toBeNull();
      await press('ArrowUp');
      expect(activeLabel()).toBe('Date');
    });

    it('makes no option active with ArrowDown or ArrowUp while locked', async () => {
      host.locked.set(true);
      await settle(fixture);
      for (const key of ['ArrowDown', 'ArrowUp']) {
        await press(key);
        expect(panel()).toBeNull();
        expect(field.listbox.active()).toBeNull();
      }
    });

    it('leaves Enter without an active option to the field', async () => {
      const closed = await press('Enter');
      expect(closed.defaultPrevented).toBe(false);
      await press('ArrowDown', { altKey: true });
      const open = await press('Enter');
      expect(open.defaultPrevented).toBe(false);
      expect(field.unhandled).toEqual(['Enter', 'Enter']);
      await press('ArrowDown');
      const pick = await press('Enter');
      expect(pick.defaultPrevented).toBe(true);
      expect(host.value()).toEqual(['Apple']);
    });

    it('leaves Escape, Home, End and letters to the field', async () => {
      await press('Escape');
      await press('ArrowDown');
      await press('Home');
      await press('x');
      expect(field.unhandled).toEqual(['Escape', 'Home', 'x']);
      expect(activeLabel()).toBe('Apple');
    });

    it('activates the openAt option when it opens, with activation on', async () => {
      host.activateOnOpen.set(true);
      host.openAt.set('Banana');
      await settle(fixture);
      await press('ArrowDown');
      expect(activeLabel()).toBe('Banana');
    });

    it('is not shown without options unless showEmpty, and acts as closed', async () => {
      host.showEmpty.set(false);
      host.fruits.set([]);
      await settle(fixture);
      await press('ArrowDown');
      expect(field.listbox.isOpen()).toBe(true);
      expect(panel()).toBeNull();
      expect(control().getAttribute('aria-expanded')).toBe('false');
      await press('Escape');
      expect(field.unhandled).toEqual(['Escape']);
    });
  });

  describe('items', () => {
    const fruits = (count: number): UiOptionItem<string>[] =>
      Array.from({ length: count }, (_, i) => ({ value: `f${i + 1}`, label: `Fruit ${i + 1}` }));
    /** `count` apartments `a1`, `a2`, …; every tenth one is disabled. */
    const apartments = (count: number): UiOptionItem<string>[] =>
      Array.from({ length: count }, (_, i) => ({
        value: `a${i + 1}`,
        label: `Apartment ${i + 1}`,
        disabled: i % 10 === 9,
      }));
    const options = () => [...(panel()?.querySelectorAll<HTMLElement>('ui-option') ?? [])];
    const viewport = () => panel()?.querySelector('cdk-virtual-scroll-viewport') ?? null;
    const activeOption = () =>
      document.getElementById(control().getAttribute('aria-activedescendant') ?? '');
    /** The viewport renders its window in an animation frame. */
    const frame = async () => {
      await settle(fixture);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await settle(fixture);
    };

    beforeAll(() => {
      // jsdom has no Element.scrollTo, which the viewport calls.
      Element.prototype.scrollTo = () => undefined;
    });

    afterAll(() => {
      delete (Element.prototype as Partial<Element>).scrollTo;
    });

    afterEach(() => vi.restoreAllMocks());

    it('renders the items and moves through them with the keyboard', async () => {
      host.items.set(fruits(3));
      await settle(fixture);
      await press('ArrowDown');
      expect(panel()!.querySelectorAll('ui-option').length).toBe(3);
      expect(panel()!.querySelector('cdk-virtual-scroll-viewport')).toBeNull();
      await press('End');
      expect(activeLabel()).toBe('Fruit 3');
      expect(panel()!.querySelectorAll('ui-option')[2].getAttribute('aria-posinset')).toBe('3');
      await press('Enter');
      expect(host.value()).toEqual(['f3']);
    });

    it('reaches items outside the virtual scroll window', async () => {
      host.items.set(fruits(500));
      await settle(fixture);
      const scroll = vi.spyOn(CdkVirtualScrollViewport.prototype, 'scrollToOffset');
      await press('End');
      // The viewport renders its window in an animation frame.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await settle(fixture);
      expect(panel()!.querySelector('cdk-virtual-scroll-viewport')).not.toBeNull();
      expect(panel()!.querySelectorAll('ui-option').length).toBeLessThan(500);
      // jsdom does not scroll, so the last option is not rendered; the viewport was asked to.
      expect(scroll.mock.lastCall![0]).toBeGreaterThan(0);
      await press('Enter');
      expect(host.value()).toEqual(['f500']);
      scroll.mockRestore();
    });

    describe('below the virtual threshold', () => {
      const SHORT: UiOptionItem<string>[] = [
        { value: 'dana', label: 'Dana', description: 'Coordinator' },
        { value: 'david', label: 'David', disabled: true },
        { value: 'yael', label: 'Yael' },
      ];

      beforeEach(async () => {
        host.items.set(SHORT);
        await settle(fixture);
      });

      it('renders the label, description and disabled state of every item', async () => {
        control().click();
        await settle(fixture);
        expect(viewport()).toBeNull();
        expect(
          options().map((o) => (o.querySelector('.ui-option__label')!.textContent ?? '').trim()),
        ).toEqual(['Dana', 'David', 'Yael']);
        expect(options()[0].querySelector('.ui-option__description')!.textContent).toBe(
          'Coordinator',
        );
        expect(options()[1].getAttribute('aria-disabled')).toBe('true');
      });

      it('moves past disabled items with the keyboard', async () => {
        await press('ArrowDown');
        await press('ArrowDown');
        expect(activeOption()).toBe(options()[2]);
        expect(activeOption()!.classList).toContain('ui-option--active');
        expect(options()[0].classList).not.toContain('ui-option--active');
      });

      it('turns on the viewport at a lower virtualThreshold', async () => {
        host.virtualThreshold.set(3);
        await settle(fixture);
        control().click();
        await settle(fixture);
        expect(viewport()).not.toBeNull();
      });
    });

    describe('above the virtual threshold', () => {
      beforeEach(async () => {
        host.items.set(apartments(1000));
        await settle(fixture);
      });

      it('renders only a window of the options in a viewport', async () => {
        control().click();
        await frame();
        expect(viewport()).not.toBeNull();
        expect(options().length).toBeGreaterThan(0);
        expect(options().length).toBeLessThan(100);
        // Assistive technologies get the position in the whole list.
        expect(options()[0].getAttribute('aria-setsize')).toBe('1000');
        expect(options()[0].getAttribute('aria-posinset')).toBe('1');
      });

      it('points aria-activedescendant at a rendered option', async () => {
        keydown(control(), 'ArrowDown');
        await frame();
        expect(activeOption()).toBe(options()[0]);
        expect(activeOption()!.classList).toContain('ui-option--active');
      });

      it('moves to options that are not rendered and selects them', async () => {
        const scroll = vi.spyOn(CdkVirtualScrollViewport.prototype, 'scrollToOffset');
        await press('ArrowDown');
        await press('End');
        expect(scroll).toHaveBeenCalled();
        expect(scroll.mock.lastCall![0]).toBeGreaterThan(0);
        // The last option is not rendered here (jsdom does not scroll), so nothing is active in the DOM.
        expect(control().hasAttribute('aria-activedescendant')).toBe(false);
        await press('Enter');
        // a1000 is disabled, like every tenth one.
        expect(host.value()).toEqual(['a999']);
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
        await frame();
        await frame();
        // a999 is the last enabled item, at index 998: its end meets the end of the 300px viewport.
        expect(scroll.mock.lastCall![0]).toBe(999 * 44 - 300);
      });

      it('skips disabled items that are not rendered', async () => {
        await press('ArrowDown');
        for (let i = 0; i < 9; i++) keydown(control(), 'ArrowDown');
        await press('Enter');
        // Apartment 10 is disabled.
        expect(host.value()).toEqual(['a11']);
      });

      it('opens at the selected item', async () => {
        const scroll = vi.spyOn(CdkVirtualScrollViewport.prototype, 'scrollToOffset');
        host.value.set(['a501']);
        await settle(fixture);
        control().click();
        await settle(fixture);
        expect(scroll).toHaveBeenCalled();
        // The first arrow activates the selected item, the second moves on.
        keydown(control(), 'ArrowDown');
        keydown(control(), 'ArrowDown');
        await press('Enter');
        expect(host.value()).toEqual(['a501', 'a502']);
      });

      it('filters all items with the search, not only the rendered ones', async () => {
        host.filterText.set('Apartment 99');
        await settle(fixture);
        keydown(control(), 'ArrowDown');
        await frame();
        // 99 and 990–999.
        expect((options()[0].querySelector('.ui-option__label')!.textContent ?? '').trim()).toBe(
          'Apartment 99',
        );
        expect(options()[0].getAttribute('aria-setsize')).toBe('11');
        await press('Enter');
        expect(host.value()).toEqual(['a99']);
      });

      it('jumps with typeahead to an option that is not rendered', async () => {
        host.items.set([...apartments(999), { value: 'zion', label: 'Zion tower' }]);
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
        await press('Enter');
        expect(host.value()).toEqual(['zion']);
      });

      it('moves a page up from an option that is not rendered', async () => {
        await press('ArrowDown');
        keydown(control(), 'End');
        keydown(control(), 'PageUp');
        await press('Enter');
        // From a999 (a1000 is disabled) ten options up.
        expect(host.value()).toEqual(['a989']);
      });

      it('marks only the active one of two items with the same value', async () => {
        host.items.set([
          { value: 'a1', label: 'Apartment 1' },
          { value: 'a1', label: 'Apartment 1 (copy)' },
          ...apartments(200).slice(1),
        ]);
        await settle(fixture);
        await press('ArrowDown');
        keydown(control(), 'ArrowDown');
        await frame();
        const active = options().filter((option) => option.classList.contains('ui-option--active'));
        expect(active).toEqual([options()[1]]);
        expect(control().getAttribute('aria-activedescendant')).toBe(options()[1].id);
      });

      it('keeps the active option when the items are replaced by copies', async () => {
        await press('ArrowDown');
        host.items.set(apartments(200).map((item) => ({ ...item })));
        await settle(fixture);
        await press('Enter');
        expect(host.value()).toEqual(['a1']);
      });

      it('keeps the active option when the items are recomputed with the same values', async () => {
        await press('ArrowDown');
        keydown(control(), 'ArrowDown');
        await frame();
        host.items.set(apartments(1000).map((item) => ({ ...item })));
        await frame();
        await press('Enter');
        expect(host.value()).toEqual(['a2']);
      });

      it('shows the new label and state of a kept option', async () => {
        await press('ArrowDown');
        keydown(control(), 'ArrowDown');
        await frame();
        host.items.set(
          apartments(1000).map((item) =>
            item.value === 'a2'
              ? { ...item, label: 'Apartment 2 (sold)' }
              : { ...item, disabled: true },
          ),
        );
        await frame();
        expect((activeOption()!.querySelector('.ui-option__label')!.textContent ?? '').trim()).toBe(
          'Apartment 2 (sold)',
        );
        expect(options()[0].getAttribute('aria-disabled')).toBe('true');
      });

      it('keeps the active one of two items with the same value', async () => {
        const items = (): UiOptionItem<string>[] => [
          { value: 'a1', label: 'Apartment 1' },
          { value: 'a1', label: 'Apartment 1 (copy)' },
          ...apartments(200).slice(1),
        ];
        host.items.set(items());
        await settle(fixture);
        await press('ArrowDown');
        keydown(control(), 'ArrowDown');
        await frame();
        host.items.set(items());
        await frame();
        expect(control().getAttribute('aria-activedescendant')).toBe(options()[1].id);
      });

      it('starts at the first option when the active value is gone', async () => {
        await press('ArrowDown');
        keydown(control(), 'ArrowDown');
        await frame();
        host.items.set(apartments(1000).filter((item) => item.value !== 'a2'));
        await frame();
        await press('Enter');
        expect(host.value()).toEqual(['a1']);
      });
    });
  });

  it('lists leading options first, and the search never hides an always shown one', async () => {
    host.selectAll.set(true);
    await settle(fixture);
    await press('ArrowDown');
    expect(activeLabel()).toBe('All');
    await press('Enter');
    expect(host.value()).toEqual([SELECT_ALL]);
    expect(panel()).not.toBeNull();
    await press('End');
    await press('ArrowDown');
    expect(activeLabel()).toBe('Date');
  });

  it('stays closed and picks nothing while locked, and closes when it becomes locked', async () => {
    await press('ArrowDown');
    host.locked.set(true);
    await settle(fixture);
    expect(panel()).toBeNull();
    await press('ArrowDown');
    expect(panel()).toBeNull();
    field.listbox.selectOption('Apple');
    expect(host.value()).toEqual([]);
  });

  it('activates an option by value and labels values from the list or displayWith', async () => {
    await press('ArrowDown', { altKey: true });
    host.mode.set('freeText');
    await settle(fixture);
    expect(field.listbox.activateValue('Cherry')).toBe(false);
    expect(field.listbox.activateValue('Date')).toBe(true);
    await settle(fixture);
    expect(activeLabel()).toBe('Date');
    field.listbox.clearActive();
    await settle(fixture);
    expect(activeLabel()).toBeNull();
    expect(field.listbox.labelFor('Banana')).toBe('Banana');
    expect(field.listbox.labelFor('Kiwi')).toBe('#Kiwi');
  });

  it('selects an option on a click and shows "no options" for an empty list', async () => {
    control().click();
    await settle(fixture);
    (panel()!.querySelectorAll('ui-option')[1] as HTMLElement).click();
    await settle(fixture);
    expect(host.value()).toEqual(['Banana']);
    host.fruits.set([]);
    await settle(fixture);
    control().click();
    await settle(fixture);
    expect(panel()!.querySelector('.ui-listbox__empty')).not.toBeNull();
  });

  describe('leading actions', () => {
    const labels = () => TestBed.inject(UI_LABELS)();
    const actions = () => panel()?.querySelector<HTMLElement>('.ui-listbox__actions') ?? null;
    const labelOf = (option: Element) =>
      (option.querySelector('.ui-option__label')!.textContent ?? '').trim();

    describe('"Add «…»"', () => {
      const create = () => actions()?.querySelector<HTMLElement>('.ui-listbox__create') ?? null;

      beforeEach(async () => {
        host.mode.set('searchable');
        host.creatable.set(true);
        await settle(fixture);
      });

      it('adds the trimmed search text with Enter typed right after it', () => {
        field.search('  Kiwi ');
        const enter = keydown(control(), 'Enter');
        expect(enter.defaultPrevented).toBe(true);
        expect(field.events).toContain('create Kiwi');
        expect(host.value()).toEqual(['Kiwi']);
      });

      it('comes first, with the create label and an id from the listbox', async () => {
        field.search('Kiwi');
        await settle(fixture);
        expect(create()).not.toBeNull();
        expect(panel()!.querySelector('ui-option')).toBe(create());
        expect(labelOf(create()!)).toBe(labels().create('Kiwi'));
        expect(create()!.id).toBe('fruit-listbox-create');
        expect(control().getAttribute('aria-activedescendant')).toBe('fruit-listbox-create');
      });

      it('is not shown for the label of an option or of a selected value, ignoring case', async () => {
        host.value.set(['Kiwi']);
        await settle(fixture);
        // The selected value is labelled by displayWith.
        for (const text of [' banana ', '#KIWI', '   ']) {
          field.search(text);
          await settle(fixture);
          expect(create()).toBeNull();
        }
        field.search('Kiwis');
        await settle(fixture);
        expect(create()).not.toBeNull();
        host.creatable.set(false);
        await settle(fixture);
        expect(create()).toBeNull();
      });

      it('is passed over by activateFirst while the search shows another option', async () => {
        field.search('an');
        await settle(fixture);
        expect(labelOf(create()!)).toBe(labels().create('an'));
        expect(activeLabel()).toBe('Banana');
        await press('ArrowUp');
        expect(control().getAttribute('aria-activedescendant')).toBe('fruit-listbox-create');
        expect(create()!.classList).toContain('ui-option--active');
        await press('Enter');
        expect(host.value()).toEqual(['an']);
      });

      it('keeps the "no options" row away and is never hidden by the search', async () => {
        field.search('Kiwi');
        await settle(fixture);
        expect(create()!.hidden).toBe(false);
        expect(panel()!.querySelector('.ui-listbox__empty')).toBeNull();
        create()!.click();
        await settle(fixture);
        expect(host.value()).toEqual(['Kiwi']);
        expect(field.events).toContain('create Kiwi');
      });
    });

    describe('"Select all"', () => {
      const selectAll = () =>
        actions()?.querySelector<HTMLElement>('.ui-listbox__select-all') ?? null;

      beforeEach(async () => {
        host.allAction.set(true);
        await settle(fixture);
      });

      it('comes first and selects the enabled options, then deselects them', async () => {
        await press('ArrowDown');
        expect(panel()!.querySelector('ui-option')).toBe(selectAll());
        expect(labelOf(selectAll()!)).toBe(labels().selectAll);
        expect(selectAll()!.id).toBe('fruit-listbox-select-all');
        expect(control().getAttribute('aria-activedescendant')).toBe('fruit-listbox-select-all');
        await press('Enter');
        // Cherry is disabled.
        expect(field.events).toContain('select Apple,Banana,Date');
        expect(host.value()).toEqual(['Apple', 'Banana', 'Date']);
        expect(selectAll()!.getAttribute('aria-selected')).toBe('true');
        await press('Enter');
        expect(field.events).toContain('deselect Apple,Banana,Date');
        expect(host.value()).toEqual([]);
        expect(selectAll()!.getAttribute('aria-selected')).toBe('false');
      });

      it('is partly checked while some of its options are selected', async () => {
        host.value.set(['Banana']);
        await settle(fixture);
        control().click();
        await settle(fixture);
        expect(selectAll()!.getAttribute('aria-selected')).toBe('false');
        expect(selectAll()!.classList).toContain('ui-option--selected');
        selectAll()!.click();
        await settle(fixture);
        expect(field.events).toContain('select Apple,Banana,Date');
        expect(host.value()).toEqual(['Banana', 'Apple', 'Date']);
        expect(selectAll()!.getAttribute('aria-selected')).toBe('true');
      });

      it('acts on the options the search shows and is hidden without one', async () => {
        host.mode.set('searchable');
        await settle(fixture);
        field.search('an');
        await settle(fixture);
        expect(selectAll()!.hidden).toBe(false);
        expect(selectAll()!.classList).not.toContain('ui-option--disabled');
        expect(control().getAttribute('aria-activedescendant')).toBe('fruit-listbox-select-all');
        await press('Enter');
        expect(field.events).toContain('select Banana');
        // Cherry is shown but disabled.
        field.search('Cherry');
        await settle(fixture);
        expect(selectAll()).toBeNull();
        field.search('');
        host.allAction.set(false);
        await settle(fixture);
        expect(selectAll()).toBeNull();
      });
    });
  });
});

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
import { ɵUiDropdownPanel as UiDropdownPanel } from '@vplans/ui-kit/core';
import { UiListboxMode, injectListbox, provideUiListbox } from './listbox';
import { UiListboxPanel } from './listbox-panel';
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
  imports: [CdkOverlayOrigin, UiDropdownPanel, UiListboxPanel, UiOption],
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
      <ui-listbox aria-label="Fruit">
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
  readonly activateOnOpen = input(true);
  readonly openAt = input<string | null>(null);
  readonly showEmpty = input(true);
  readonly selectAll = input(false);
  readonly multiple = input(false);
  readonly locked = input(false);
  readonly value = model<readonly string[]>([]);
  /** Keys the listbox left to the field. */
  readonly unhandled: string[] = [];
  readonly events: string[] = [];
  protected readonly selectAllValue = SELECT_ALL;

  private readonly content = contentChildren<UiOption<string>>(UiOption, { descendants: true });
  private readonly leading = viewChildren<UiOption<string>>('leading');

  readonly listbox = injectListbox<string>({
    mode: this.mode,
    id: () => 'fruit',
    contentOptions: this.content,
    leadingOptions: this.leading,
    items: this.items,
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
      [multiple]="selectAll()"
      [locked]="locked()"
      [items]="items()"
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
  readonly items = signal<readonly UiOptionItem<string>[] | null>(null);
  readonly fruits = signal(['Apple', 'Banana', 'Cherry', 'Date']);
  readonly value = signal<readonly string[]>([]);
}

describe('UiListbox', () => {
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

    beforeAll(() => {
      // jsdom has no Element.scrollTo, which the viewport calls.
      Element.prototype.scrollTo = () => undefined;
    });

    afterAll(() => {
      delete (Element.prototype as Partial<Element>).scrollTo;
    });

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
});

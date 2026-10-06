import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Router, RouterLink, provideRouter } from '@angular/router';
import {
  UiMenu,
  UiMenuGroup,
  UiMenuItem,
  UiMenuItemCheckbox,
  UiMenuItemRadio,
  UiMenuTrigger,
} from './menu';

// The CDK key managers read the legacy keyCode.
const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  ArrowLeft: 37,
  ArrowRight: 39,
  Enter: 13,
  Escape: 27,
  Home: 36,
  End: 35,
};

@Component({
  imports: [UiMenu, UiMenuItem, UiMenuTrigger],
  template: `
    <div id="box" [attr.dir]="dir()">
      <button
        id="trigger"
        [uiMenuTriggerFor]="menu"
        (menuOpened)="events.push('opened')"
        (menuClosed)="events.push('closed')"
      >
        Actions
      </button>
    </div>
    <ng-template #menu>
      <ui-menu>
        <button ui-menu-item (triggered)="events.push('edit')">Edit</button>
        <button ui-menu-item disabled (triggered)="events.push('locked')">Locked</button>
        <button ui-menu-item [uiMenuTriggerFor]="more">More</button>
        <button ui-menu-item danger (triggered)="events.push('delete')">Delete</button>
      </ui-menu>
    </ng-template>
    <ng-template #more>
      <ui-menu>
        <button ui-menu-item (triggered)="events.push('archive')">Archive</button>
      </ui-menu>
    </ng-template>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly events: string[] = [];
}

describe('UiMenu', () => {
  let fixture: ComponentFixture<Host>;
  const trigger = () => document.querySelector<HTMLButtonElement>('#trigger')!;
  const menus = () => [...document.querySelectorAll<HTMLElement>('ui-menu')];
  const items = (menu = 0) => [
    ...menus()[menu].querySelectorAll<HTMLButtonElement>('[ui-menu-item]'),
  ];
  const item = (label: string) =>
    [...document.querySelectorAll<HTMLButtonElement>('[ui-menu-item]')].find(
      (el) => el.textContent?.trim() === label,
    )!;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const key = async (target: Element, key: string) => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        keyCode: KEY_CODES[key],
        bubbles: true,
        cancelable: true,
      }),
    );
    await settle();
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  afterEach(() => fixture.destroy());

  it('marks the trigger as a menu button', async () => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(menus()).toHaveLength(0);

    trigger().click();
    await settle();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(menus()).toHaveLength(1);
    expect(menus()[0].getAttribute('role')).toBe('menu');
    expect(trigger().getAttribute('aria-controls')).toBe(menus()[0].id);
    expect(fixture.componentInstance.events).toEqual(['opened']);
  });

  it('renders menu items with roles and states', async () => {
    trigger().click();
    await settle();
    const [edit, locked, more, remove] = items();
    expect(edit.getAttribute('role')).toBe('menuitem');
    expect(edit.getAttribute('type')).toBe('button');
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    expect(locked.hasAttribute('disabled')).toBe(false);
    expect(more.getAttribute('aria-haspopup')).toBe('menu');
    expect(more.querySelector('.ui-menu-item__submenu')).not.toBeNull();
    expect(edit.querySelector('.ui-menu-item__submenu')).toBeNull();
    expect(remove.classList).toContain('ui-menu-item--danger');
  });

  it('emits triggered and closes the menu', async () => {
    trigger().click();
    await settle();
    item('Edit').click();
    await settle();
    expect(fixture.componentInstance.events).toEqual(['opened', 'edit', 'closed']);
    expect(menus()).toHaveLength(0);
  });

  it('ignores disabled items', async () => {
    trigger().click();
    await settle();
    item('Locked').click();
    await settle();
    expect(fixture.componentInstance.events).not.toContain('locked');
    expect(menus()).toHaveLength(1);
  });

  it('opens from the keyboard and moves focus between items', async () => {
    trigger().focus();
    await key(trigger(), 'ArrowDown');
    expect(document.activeElement).toBe(item('Edit'));

    await key(item('Edit'), 'ArrowDown');
    expect(document.activeElement).toBe(item('Locked'));
    await key(item('Locked'), 'End');
    expect(document.activeElement).toBe(item('Delete'));
    await key(item('Delete'), 'Home');
    expect(document.activeElement).toBe(item('Edit'));

    await key(item('Edit'), 'Escape');
    expect(menus()).toHaveLength(0);
    expect(document.activeElement).toBe(trigger());
  });

  it('opens submenus with Arrow Right in LTR', async () => {
    trigger().click();
    await settle();
    item('More').focus();
    await key(item('More'), 'ArrowRight');
    expect(menus()).toHaveLength(2);
    expect(document.activeElement).toBe(item('Archive'));

    await key(item('Archive'), 'ArrowLeft');
    expect(menus()).toHaveLength(1);
    expect(document.activeElement).toBe(item('More'));
  });

  it('mirrors submenu keys after a runtime switch to RTL', async () => {
    fixture.componentInstance.dir.set('rtl');
    await settle();
    trigger().click();
    await settle();
    item('More').focus();
    await key(item('More'), 'ArrowRight');
    expect(menus()).toHaveLength(1);
    await key(item('More'), 'ArrowLeft');
    expect(menus()).toHaveLength(2);
    expect(menus()[0].closest('[dir]')?.getAttribute('dir')).toBe('rtl');
  });
});

@Component({ template: '' })
class Page {}

@Component({
  imports: [
    UiMenu,
    UiMenuItem,
    UiMenuTrigger,
    UiMenuGroup,
    UiMenuItemCheckbox,
    UiMenuItemRadio,
    RouterLink,
  ],
  template: `
    <button id="more" uiMenuPosition="top-end" [uiMenuTriggerFor]="menu">More</button>
    <ng-template #menu>
      <ui-menu>
        <a ui-menu-item routerLink="/history">History</a>
        <a ui-menu-item href="#locked" disabled>Locked link</a>
        <button
          ui-menu-item-checkbox
          [checked]="archived()"
          (triggered)="archived.set(!archived())"
        >
          Show archived
        </button>
        <ui-menu-group label="Sort by">
          <button ui-menu-item-radio [checked]="sort() === 'name'" (triggered)="sort.set('name')">
            Name
          </button>
          <button ui-menu-item-radio [checked]="sort() === 'date'" (triggered)="sort.set('date')">
            Date
          </button>
        </ui-menu-group>
      </ui-menu>
    </ng-template>
  `,
})
class ExtrasHost {
  readonly archived = signal(false);
  readonly sort = signal<'name' | 'date'>('name');
  readonly trigger = viewChild.required(CdkMenuTrigger);
}

describe('UiMenu links, groups and selectable items', () => {
  let fixture: ComponentFixture<ExtrasHost>;
  const open = async () => {
    document.querySelector<HTMLButtonElement>('#more')!.click();
    await settle();
  };
  const find = (label: string) =>
    [...document.querySelectorAll<HTMLElement>('.ui-menu-item')].find(
      (el) => el.textContent?.trim() === label,
    )!;
  const menus = () => document.querySelectorAll('ui-menu');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const press = async (target: Element, key: string, keyCode: number) => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true }),
    );
    await settle();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', component: Page }])],
    });
    fixture = TestBed.createComponent(ExtrasHost);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('takes a position preset', () => {
    const [first] = fixture.componentInstance.trigger().menuPosition;
    expect(first).toEqual(
      expect.objectContaining({
        originY: 'top',
        overlayY: 'bottom',
        originX: 'end',
        overlayX: 'end',
      }),
    );
  });

  it('follows a link item and closes the menu after the click', async () => {
    vi.useFakeTimers();
    try {
      await open();
      const link = find('History');
      expect(link.getAttribute('role')).toBe('menuitem');
      expect(link.hasAttribute('type')).toBe(false);
      link.click();
      // Still in the page while the click follows the link.
      expect(link.isConnected).toBe(true);
      await vi.runAllTimersAsync();
      await settle();
      expect(TestBed.inject(Router).url).toBe('/history');
      expect(menus()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('follows a link item with Space', async () => {
    await open();
    const link = find('History');
    const click = vi.fn();
    link.addEventListener('click', click);
    await press(link, ' ', 32);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('does not follow a disabled link', async () => {
    await open();
    const locked = find('Locked link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    locked.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(locked.getAttribute('aria-disabled')).toBe('true');
  });

  it('labels a group and toggles a checkbox item', async () => {
    await open();
    const group = document.querySelector('ui-menu-group')!;
    expect(group.getAttribute('role')).toBe('group');
    const labelId = group.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelId)?.textContent).toBe('Sort by');

    const archived = find('Show archived');
    expect(archived.getAttribute('role')).toBe('menuitemcheckbox');
    expect(archived.getAttribute('aria-checked')).toBe('false');
    // Space toggles and keeps the menu open.
    archived.focus();
    await press(archived, ' ', 32);
    expect(fixture.componentInstance.archived()).toBe(true);
    expect(archived.getAttribute('aria-checked')).toBe('true');
    expect(menus()).toHaveLength(1);
  });

  it('checks one radio item of a group', async () => {
    await open();
    const [name, date] = [find('Name'), find('Date')];
    expect(name.getAttribute('role')).toBe('menuitemradio');
    expect(name.getAttribute('aria-checked')).toBe('true');
    date.focus();
    await press(date, ' ', 32);
    expect(fixture.componentInstance.sort()).toBe('date');
    expect(date.getAttribute('aria-checked')).toBe('true');
    expect(name.getAttribute('aria-checked')).toBe('false');
  });
});

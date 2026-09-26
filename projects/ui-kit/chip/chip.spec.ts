import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { UiChip, UiChipSet, UiFilterChip } from './chip';

const KEY_CODES: Record<string, number> = {
  ArrowLeft: 37,
  ArrowRight: 39,
  Home: 36,
  End: 35,
  Delete: 46,
  Backspace: 8,
};

/** The CDK key managers read `keyCode`. */
function keydown(target: Element, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, keyCode: KEY_CODES[key], bubbles: true, cancelable: true }),
  );
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [UiChip, UiChipSet],
  template: `
    <div [attr.dir]="dir()">
      <ui-chip-set aria-label="Cities">
        @for (city of cities(); track city) {
          <ui-chip removable [disabled]="city === lockedCity()" (removed)="remove(city)">
            {{ city }}
          </ui-chip>
        }
        <ui-chip>Read only</ui-chip>
      </ui-chip-set>
    </div>
    <ui-chip id="alone" removable>Alone</ui-chip>
  `,
})
class ChipsHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly cities = signal(['Haifa', 'Eilat', 'Acre']);
  readonly lockedCity = signal<string | null>(null);
  readonly removed: string[] = [];
  remove(city: string): void {
    this.removed.push(city);
    this.cities.update((cities) => cities.filter((c) => c !== city));
  }
}

describe('UiChip and UiChipSet', () => {
  let fixture: ComponentFixture<ChipsHost>;
  let host: ChipsHost;
  let root: HTMLElement;
  let announce: ReturnType<typeof vi.spyOn>;
  const set = () => root.querySelector('ui-chip-set')!;
  const removeButtons = () => [...set().querySelectorAll<HTMLButtonElement>('.ui-chip__remove')];

  beforeEach(async () => {
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    fixture = TestBed.createComponent(ChipsHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('is a named list of list items', () => {
    expect(set().getAttribute('role')).toBe('list');
    expect(set().getAttribute('aria-label')).toBe('Cities');
    const chips = [...set().querySelectorAll('ui-chip')];
    expect(chips.every((chip) => chip.getAttribute('role') === 'listitem')).toBe(true);
    expect(root.querySelector('#alone')!.hasAttribute('role')).toBe(false);
    expect(chips[3].querySelector('button')).toBeNull();
  });

  it('labels the remove button with the chip text', () => {
    expect(removeButtons()[0].getAttribute('aria-label')).toBe('הסרת Haifa');
  });

  it('removes a chip with its button or Delete and announces it', async () => {
    removeButtons()[1].click();
    await settle(fixture);
    expect(host.removed).toEqual(['Eilat']);
    expect(announce).toHaveBeenCalledWith('Eilat הוסר', 'polite');

    keydown(removeButtons()[0], 'Delete');
    await settle(fixture);
    expect(host.removed).toEqual(['Eilat', 'Haifa']);
  });

  it('does not remove a disabled chip', async () => {
    host.lockedCity.set('Haifa');
    await settle(fixture);
    expect(removeButtons()[0].disabled).toBe(true);
    removeButtons()[0].click();
    await settle(fixture);
    expect(host.removed).toEqual([]);
  });

  it('is one tab stop and moves between chips with the arrow keys', async () => {
    expect(removeButtons().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    expect(root.querySelector<HTMLElement>('#alone .ui-chip__remove')!.tabIndex).toBe(0);

    removeButtons()[0].focus();
    keydown(removeButtons()[0], 'ArrowRight');
    await settle(fixture);
    expect(document.activeElement).toBe(removeButtons()[1]);
    expect(removeButtons().map((b) => b.tabIndex)).toEqual([-1, 0, -1]);

    keydown(removeButtons()[1], 'End');
    await settle(fixture);
    expect(document.activeElement).toBe(removeButtons()[2]);
    keydown(removeButtons()[2], 'Home');
    await settle(fixture);
    expect(document.activeElement).toBe(removeButtons()[0]);
  });

  it('mirrors the arrow keys in RTL', async () => {
    host.dir.set('rtl');
    await settle(fixture);
    removeButtons()[0].focus();
    keydown(removeButtons()[0], 'ArrowLeft');
    await settle(fixture);
    expect(document.activeElement).toBe(removeButtons()[1]);
  });

  it('makes a clicked chip the tab stop', async () => {
    removeButtons()[2].focus();
    removeButtons()[2].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await settle(fixture);
    expect(removeButtons().map((b) => b.tabIndex)).toEqual([-1, -1, 0]);
  });

  it('moves focus to the next chip when the focused one is removed', async () => {
    removeButtons()[0].focus();
    keydown(removeButtons()[0], 'Backspace');
    await settle(fixture);
    await settle(fixture);
    expect(document.activeElement?.closest('ui-chip')?.textContent).toContain('Eilat');

    // The last one: focus goes to the one before.
    keydown(document.activeElement!, 'End');
    keydown(document.activeElement!, 'Delete');
    await settle(fixture);
    await settle(fixture);
    expect(document.activeElement?.closest('ui-chip')?.textContent).toContain('Eilat');
  });
});

@Component({
  imports: [UiFilterChip, UiChipSet],
  template: `
    <ui-chip-set aria-label="Status">
      <button ui-filter-chip [(selected)]="open">Open</button>
      <button ui-filter-chip [selected]="true">Signed</button>
      <button ui-filter-chip disabled>Archived</button>
    </ui-chip-set>
  `,
})
class FilterHost {
  readonly open = signal(false);
}

describe('UiFilterChip', () => {
  it('toggles aria-pressed in a group with one tab stop', async () => {
    const fixture = TestBed.createComponent(FilterHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const [open, signed, archived] = [...root.querySelectorAll<HTMLButtonElement>('button')];
    expect(root.querySelector('ui-chip-set')!.getAttribute('role')).toBe('group');
    expect(open.type).toBe('button');
    expect(open.getAttribute('aria-pressed')).toBe('false');
    expect(signed.getAttribute('aria-pressed')).toBe('true');
    expect(signed.querySelector('ui-icon')).not.toBeNull();
    expect([open.tabIndex, signed.tabIndex, archived.tabIndex]).toEqual([0, -1, -1]);
    expect(archived.disabled).toBe(true);

    open.click();
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(open.getAttribute('aria-pressed')).toBe('true');
    expect(open.classList).toContain('ui-filter-chip--selected');
  });
});

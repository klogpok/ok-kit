import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { MockInstance } from 'vitest';
import {
  UiChip,
  UiChipAppearance,
  UiChipDefaults,
  UiChipSet,
  UiChipSize,
  UiFilterChip,
  provideUiChip,
} from './chip';

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
  let announce: MockInstance<LiveAnnouncer['announce']>;
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

  it('shows the check mark in place of its icon while selected', async () => {
    const fixture = TestBed.createComponent(FilterIconHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const chip = root.querySelector<HTMLButtonElement>('button')!;
    const icon = chip.querySelector<HTMLElement>('.ui-chip__icon')!;
    expect(icon.querySelector('[uiChipIcon]')).not.toBeNull();
    expect(icon.hidden).toBe(false);
    expect(chip.querySelector('.ui-chip__check')).toBeNull();

    chip.click();
    await settle(fixture);
    expect(icon.hidden).toBe(true);
    expect(chip.querySelector('.ui-chip__check')).not.toBeNull();
  });
});

@Component({
  imports: [UiFilterChip],
  template: `<button ui-filter-chip><span uiChipIcon>★</span>Starred</button>`,
})
class FilterIconHost {}

@Component({
  imports: [UiChip, UiFilterChip, UiChipSet],
  template: `
    <ui-chip-set [appearance]="setAppearance()" [size]="setSize()">
      <ui-chip id="own" [appearance]="chipAppearance()" [size]="chipSize()">Own</ui-chip>
      <button ui-filter-chip id="filter" [appearance]="chipAppearance()" [size]="chipSize()">
        Filter
      </button>
    </ui-chip-set>
    <ui-chip id="alone">Alone</ui-chip>
    <ui-chip id="toned" tone="success">Toned</ui-chip>
  `,
})
class LookHost {
  readonly setAppearance = signal<UiChipAppearance | undefined>(undefined);
  readonly setSize = signal<UiChipSize | undefined>(undefined);
  readonly chipAppearance = signal<UiChipAppearance | undefined>(undefined);
  readonly chipSize = signal<UiChipSize | undefined>(undefined);
}

describe('chip appearance and size', () => {
  async function render(defaults?: UiChipDefaults) {
    if (defaults) TestBed.configureTestingModule({ providers: [provideUiChip(defaults)] });
    const fixture = TestBed.createComponent(LookHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const classes = (id: string) => root.querySelector(`#${id}`)!.classList;
    return { fixture, host: fixture.componentInstance, classes };
  }

  it('defaults to outline and md', async () => {
    const { classes } = await render();
    for (const id of ['own', 'filter', 'alone']) {
      expect(classes(id)).toContain('ui-chip--outline');
      expect(classes(id)).toContain('ui-chip--md');
    }
  });

  it('takes the app default from provideUiChip()', async () => {
    const { classes } = await render({ appearance: 'soft', size: 'sm' });
    expect(classes('own')).toContain('ui-chip--soft');
    expect(classes('own')).toContain('ui-chip--sm');
    expect(classes('alone')).toContain('ui-chip--soft');
    expect(classes('alone')).toContain('ui-chip--sm');
  });

  it('prefers the set input over the provider, and the chip input over the set', async () => {
    const { fixture, host, classes } = await render({ appearance: 'soft', size: 'sm' });
    host.setAppearance.set('outline');
    host.setSize.set('md');
    await settle(fixture);
    for (const id of ['own', 'filter']) {
      expect(classes(id)).toContain('ui-chip--outline');
      expect(classes(id)).toContain('ui-chip--md');
    }
    expect(classes('alone')).toContain('ui-chip--soft');

    host.chipAppearance.set('soft');
    host.chipSize.set('sm');
    await settle(fixture);
    for (const id of ['own', 'filter']) {
      expect(classes(id)).toContain('ui-chip--soft');
      expect(classes(id)).toContain('ui-chip--sm');
      expect(classes(id)).not.toContain('ui-chip--outline');
    }
  });

  it('keeps its base classes next to the appearance', async () => {
    const { classes } = await render();
    expect(classes('own')).toContain('ui-chip');
    expect(classes('filter')).toContain('ui-filter-chip');
  });

  it('marks a toned chip with its tone', async () => {
    const { classes } = await render();
    expect(classes('toned')).toContain('ui-chip--toned');
    expect(classes('toned')).toContain('ui-chip--success');
    expect(classes('alone')).not.toContain('ui-chip--toned');
  });
});

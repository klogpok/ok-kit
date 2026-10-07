import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { Observable, Subject } from 'rxjs';
import { UiTree, UiTreeNodeDef } from './tree';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

interface Unit {
  id: string;
  name: string;
  children?: Unit[];
}

const UNITS: Unit[] = [
  {
    id: 'north',
    name: 'North',
    children: [
      { id: 'haifa', name: 'Haifa' },
      { id: 'akko', name: 'Akko' },
    ],
  },
  { id: 'center', name: 'Center', children: [{ id: 'tel-aviv', name: 'Tel Aviv' }] },
  { id: 'south', name: 'South' },
];

const atLeastOne: ValidatorFn = (control) =>
  (control.value as unknown[]).length > 0 ? null : { atLeastOne: 'Pick one' };

const nameOf = (unit: Unit): string => unit.name;

function press(target: Element, key: string): KeyboardEvent {
  const keyCode = key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;
  const event = new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function items(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')];
}

function labels(root: HTMLElement): string[] {
  return items(root).map((item) =>
    (item.querySelector('.ui-tree__label')?.textContent ?? '').trim(),
  );
}

@Component({
  imports: [UiTree],
  template: `
    <div [attr.dir]="dir()">
      <ui-tree [data]="data()" [displayWith]="nameOf" [(expanded)]="expanded" aria-label="Units" />
    </div>
  `,
})
class BasicHost {
  readonly data = signal(UNITS);
  readonly expanded = signal<string[]>([]);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly nameOf = nameOf;
  readonly tree = viewChild.required(UiTree);
}

describe('UiTree', () => {
  let fixture: ComponentFixture<BasicHost>;
  let host: BasicHost;
  let root: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(BasicHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('renders the root nodes as a named tree, collapsed', () => {
    const tree = root.querySelector('[role="tree"]')!;
    expect(tree.getAttribute('aria-label')).toBe('Units');
    expect(labels(root)).toEqual(['North', 'Center', 'South']);
    const [north, , south] = items(root);
    expect(north.getAttribute('aria-expanded')).toBe('false');
    expect(north.getAttribute('aria-level')).toBe('1');
    expect(north.getAttribute('aria-setsize')).toBe('3');
    expect(north.getAttribute('aria-posinset')).toBe('1');
    expect(south.hasAttribute('aria-expanded')).toBe(false);
  });

  it('expands and collapses a branch with its chevron and reports the expanded keys', async () => {
    const chevron = items(root)[0].querySelector<HTMLElement>('.ui-tree__toggle')!;
    chevron.click();
    await settle(fixture);
    expect(labels(root)).toEqual(['North', 'Haifa', 'Akko', 'Center', 'South']);
    const haifa = items(root)[1];
    expect(haifa.getAttribute('aria-level')).toBe('2');
    expect(haifa.getAttribute('aria-setsize')).toBe('2');
    expect(items(root)[0].getAttribute('aria-expanded')).toBe('true');
    expect(host.expanded()).toEqual(['north']);
    chevron.click();
    await settle(fixture);
    expect(labels(root)).toEqual(['North', 'Center', 'South']);
    expect(host.expanded()).toEqual([]);
  });

  it('expands the branches whose keys are bound to expanded', async () => {
    host.expanded.set(['center']);
    await settle(fixture);
    expect(labels(root)).toEqual(['North', 'Center', 'Tel Aviv', 'South']);
  });

  describe('keyboard', () => {
    function focused(): string {
      return (document.activeElement?.querySelector('.ui-tree__label')?.textContent ?? '').trim();
    }

    beforeEach(() => {
      items(root)[0].focus();
    });

    it('makes only the first node a tab stop', () => {
      expect(items(root).map((item) => item.tabIndex)).toEqual([0, -1, -1]);
    });

    it('moves with the up and down arrows, Home and End', async () => {
      press(document.activeElement!, 'ArrowDown');
      await settle(fixture);
      expect(focused()).toBe('Center');
      press(document.activeElement!, 'End');
      await settle(fixture);
      expect(focused()).toBe('South');
      press(document.activeElement!, 'ArrowUp');
      await settle(fixture);
      expect(focused()).toBe('Center');
      press(document.activeElement!, 'Home');
      await settle(fixture);
      expect(focused()).toBe('North');
    });

    it('expands with the right arrow, enters the branch, and goes back up with the left arrow', async () => {
      press(document.activeElement!, 'ArrowRight');
      await settle(fixture);
      expect(host.expanded()).toEqual(['north']);
      press(document.activeElement!, 'ArrowRight');
      await settle(fixture);
      expect(focused()).toBe('Haifa');
      press(document.activeElement!, 'ArrowLeft');
      await settle(fixture);
      expect(focused()).toBe('North');
      press(document.activeElement!, 'ArrowLeft');
      await settle(fixture);
      expect(host.expanded()).toEqual([]);
    });

    it('swaps the left and right arrows in RTL, also after a switch at runtime', async () => {
      host.dir.set('rtl');
      await settle(fixture);
      const event = press(document.activeElement!, 'ArrowLeft');
      await settle(fixture);
      expect(event.defaultPrevented).toBe(true);
      expect(host.expanded()).toEqual(['north']);
      press(document.activeElement!, 'ArrowRight');
      await settle(fixture);
      expect(host.expanded()).toEqual([]);
    });

    it('expands every sibling branch with *', async () => {
      press(document.activeElement!, '*');
      await settle(fixture);
      expect(host.expanded()).toEqual(['north', 'center']);
    });

    it('moves to the next node whose text starts with the typed letters', async () => {
      vi.useFakeTimers();
      try {
        press(document.activeElement!, 's');
        vi.advanceTimersByTime(300);
        await settle(fixture);
        expect(focused()).toBe('South');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});

@Component({
  imports: [UiTree, ReactiveFormsModule],
  template: `
    <ui-tree
      selection="single"
      [formControl]="control"
      [data]="data"
      [displayWith]="nameOf"
      [disabledWith]="isAkko"
      [expanded]="['north']"
      [readonly]="readonly()"
      aria-label="Units"
    />
  `,
})
class SingleHost {
  readonly data = UNITS;
  readonly nameOf = nameOf;
  readonly isAkko = (unit: Unit): boolean => unit.id === 'akko';
  readonly control = new FormControl<string | null>('haifa');
  readonly readonly = signal(false);
}

describe('UiTree with single selection', () => {
  let fixture: ComponentFixture<SingleHost>;
  let host: SingleHost;
  let root: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(SingleHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  function item(name: string): HTMLElement {
    return items(root).find((node) => node.textContent?.trim() === name)!;
  }

  it('marks the selected node from the control', async () => {
    expect(root.querySelector('[role="tree"]')!.hasAttribute('aria-multiselectable')).toBe(false);
    expect(item('Haifa').getAttribute('aria-selected')).toBe('true');
    expect(item('North').getAttribute('aria-selected')).toBe('false');
    host.control.setValue('south');
    await settle(fixture);
    expect(item('Haifa').getAttribute('aria-selected')).toBe('false');
    expect(item('South').getAttribute('aria-selected')).toBe('true');
  });

  it('selects any node on click, branches too, without expanding it', async () => {
    item('Center').click();
    await settle(fixture);
    expect(host.control.value).toBe('center');
    expect(host.control.dirty).toBe(true);
    expect(labels(root)).not.toContain('Tel Aviv');
  });

  it('selects with Enter and Space but not by moving focus', async () => {
    item('North').focus();
    press(document.activeElement!, 'ArrowDown');
    await settle(fixture);
    expect(host.control.value).toBe('haifa');
    item('North').focus();
    press(document.activeElement!, 'Enter');
    await settle(fixture);
    expect(host.control.value).toBe('north');
    item('South').focus();
    press(document.activeElement!, ' ');
    await settle(fixture);
    expect(host.control.value).toBe('south');
  });

  it('keeps a disabled node focusable but not selectable', async () => {
    const akko = item('Akko');
    expect(akko.getAttribute('aria-disabled')).toBe('true');
    item('Haifa').focus();
    press(document.activeElement!, 'ArrowDown');
    await settle(fixture);
    expect(document.activeElement).toBe(akko);
    akko.click();
    press(document.activeElement!, 'Enter');
    await settle(fixture);
    expect(host.control.value).toBe('haifa');
  });

  it('does not change the value while readonly or disabled', async () => {
    host.readonly.set(true);
    await settle(fixture);
    item('South').click();
    await settle(fixture);
    expect(host.control.value).toBe('haifa');
    host.readonly.set(false);
    host.control.disable();
    await settle(fixture);
    expect(root.querySelector('[role="tree"]')!.getAttribute('aria-disabled')).toBe('true');
    item('South').click();
    await settle(fixture);
    expect(host.control.value).toBe('haifa');
  });

  it('marks the control touched when focus leaves the tree', async () => {
    item('North').focus();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    await settle(fixture);
    expect(host.control.touched).toBe(true);
    outside.remove();
  });
});

@Component({
  imports: [UiTree, ReactiveFormsModule],
  template: `
    <ui-tree
      selection="multiple"
      [formControl]="control"
      [data]="data"
      [displayWith]="nameOf"
      [disabledWith]="disabledWith()"
      [(expanded)]="expanded"
      aria-label="Units"
    />
  `,
})
class MultipleHost {
  readonly data = UNITS;
  readonly nameOf = nameOf;
  readonly disabledWith = signal<(unit: Unit) => boolean>(() => false);
  readonly expanded = signal<string[]>(['north']);
  readonly control = new FormControl<string[]>([], { nonNullable: true });
}

describe('UiTree with multiple selection', () => {
  let fixture: ComponentFixture<MultipleHost>;
  let host: MultipleHost;
  let root: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(MultipleHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  function item(name: string): HTMLElement {
    return items(root).find((node) => node.textContent?.trim() === name)!;
  }

  function checks(): Record<string, string | null> {
    const entries = items(root).map((node): [string, string | null] => [
      (node.textContent ?? '').trim(),
      node.getAttribute('aria-checked'),
    ]);
    return Object.fromEntries(entries);
  }

  async function click(name: string): Promise<void> {
    item(name).click();
    await settle(fixture);
  }

  it('is a multiselectable tree whose nodes carry aria-checked instead of aria-selected', () => {
    expect(root.querySelector('[role="tree"]')!.getAttribute('aria-multiselectable')).toBe('true');
    expect(checks()).toEqual({
      North: 'false',
      Haifa: 'false',
      Akko: 'false',
      Center: 'false',
      South: 'false',
    });
    expect(item('North').hasAttribute('aria-selected')).toBe(false);
  });

  it('checks a leaf; its branch is partially checked and stays out of the value', async () => {
    await click('Haifa');
    expect(host.control.value).toEqual(['haifa']);
    expect(host.control.dirty).toBe(true);
    expect(checks()).toMatchObject({ North: 'mixed', Haifa: 'true', Akko: 'false' });
  });

  it('checks the branch once every child is checked', async () => {
    await click('Haifa');
    await click('Akko');
    expect(host.control.value).toEqual(['haifa', 'north', 'akko']);
    expect(checks()).toMatchObject({ North: 'true' });
    await click('Akko');
    expect(host.control.value).toEqual(['haifa']);
    expect(checks()).toMatchObject({ North: 'mixed' });
  });

  it('checks and unchecks a whole branch, collapsed descendants included', async () => {
    await click('Center');
    expect(host.control.value).toEqual(['center', 'tel-aviv']);
    host.expanded.set(['center']);
    await settle(fixture);
    expect(checks()).toMatchObject({ Center: 'true', 'Tel Aviv': 'true' });
    await click('Center');
    expect(host.control.value).toEqual([]);
  });

  it('checks a partially checked branch fully', async () => {
    await click('Haifa');
    await click('North');
    expect(host.control.value).toEqual(['haifa', 'north', 'akko']);
  });

  it('leaves disabled nodes alone, so their branch stays partially checked', async () => {
    host.disabledWith.set((unit) => unit.id === 'akko');
    await settle(fixture);
    await click('Akko');
    expect(host.control.value).toEqual([]);
    await click('North');
    expect(host.control.value).toEqual(['haifa']);
    expect(checks()).toMatchObject({ North: 'mixed', Haifa: 'true', Akko: 'false' });
    await click('North');
    expect(host.control.value).toEqual([]);
  });

  it('keeps keys that match no loaded node', async () => {
    host.control.setValue(['elsewhere']);
    await settle(fixture);
    await click('South');
    expect(host.control.value).toEqual(['elsewhere', 'south']);
  });

  it('checks the descendants of a branch key written to the control, without marking it dirty', async () => {
    host.control.setValue(['north']);
    await settle(fixture);
    expect(host.control.value).toEqual(['north', 'haifa', 'akko']);
    expect(host.control.dirty).toBe(false);
    expect(checks()).toMatchObject({ North: 'true', Haifa: 'true', Akko: 'true' });
  });

  it('adds a branch whose children were all written to the control', async () => {
    host.control.setValue(['haifa', 'akko']);
    await settle(fixture);
    expect(host.control.value).toEqual(['haifa', 'akko', 'north']);
    expect(host.control.dirty).toBe(false);
  });

  it('toggles the focused node with Space', async () => {
    item('South').focus();
    press(document.activeElement!, ' ');
    await settle(fixture);
    expect(host.control.value).toEqual(['south']);
  });
});

interface Folder {
  id: string;
  name: string;
  lazy?: boolean;
  children?: Folder[];
}

const FOLDERS: Folder[] = [
  { id: 'plans', name: 'Plans', lazy: true },
  { id: 'archive', name: 'Archive', lazy: true },
  { id: 'notes', name: 'Notes', children: [{ id: 'todo', name: 'Todo' }] },
];

@Component({
  imports: [UiTree, ReactiveFormsModule],
  template: `
    <ui-tree
      [selection]="selection()"
      [formControl]="control"
      [data]="data"
      [displayWith]="nameOf"
      [hasChildrenWith]="isLazy"
      [loadChildren]="load"
      [(expanded)]="expanded"
      aria-label="Folders"
    />
  `,
})
class LazyHost {
  readonly data = FOLDERS;
  readonly nameOf = (folder: Folder): string => folder.name;
  readonly isLazy = (folder: Folder): boolean => !!folder.lazy;
  readonly selection = signal<'none' | 'multiple'>('none');
  readonly expanded = signal<string[]>([]);
  readonly control = new FormControl<string[]>([], { nonNullable: true });
  readonly requests: { folder: Folder; result: Subject<Folder[]> }[] = [];
  promised = false;
  readonly load = (folder: Folder): Observable<Folder[]> | Promise<Folder[]> => {
    if (this.promised) return Promise.resolve([{ id: folder.id + '-1', name: 'Inside' }]);
    const result = new Subject<Folder[]>();
    this.requests.push({ folder, result });
    return result;
  };
  readonly tree = viewChild.required(UiTree);
}

describe('UiTree with lazy branches', () => {
  let fixture: ComponentFixture<LazyHost>;
  let host: LazyHost;
  let root: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(LazyHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  function item(name: string): HTMLElement {
    return items(root).find(
      (node) => node.querySelector('.ui-tree__label')?.textContent?.trim() === name,
    )!;
  }

  async function expand(...keys: string[]): Promise<void> {
    host.expanded.set(keys);
    await settle(fixture);
  }

  async function respond(index: number, children: Folder[]): Promise<void> {
    host.requests[index].result.next(children);
    host.requests[index].result.complete();
    await settle(fixture);
  }

  it('shows a lazy branch as expandable before its children are known', () => {
    expect(item('Plans').getAttribute('aria-expanded')).toBe('false');
    expect(host.requests).toHaveLength(0);
  });

  it('loads the children on the first expand, busy until they arrive, and only once', async () => {
    await expand('plans');
    expect(host.requests.map((request) => request.folder.id)).toEqual(['plans']);
    expect(item('Plans').getAttribute('aria-busy')).toBe('true');
    expect(item('Plans').querySelector('ui-spinner')).not.toBeNull();
    await respond(0, [{ id: 'q1', name: 'Q1' }]);
    expect(labels(root)).toEqual(['Plans', 'Q1', 'Archive', 'Notes']);
    expect(item('Plans').hasAttribute('aria-busy')).toBe(false);
    expect(item('Q1').getAttribute('aria-level')).toBe('2');
    await expand();
    await expand('plans');
    expect(host.requests).toHaveLength(1);
    expect(labels(root)).toContain('Q1');
  });

  it('turns a lazy branch without children into a leaf', async () => {
    await expand('plans');
    await respond(0, []);
    expect(item('Plans').hasAttribute('aria-expanded')).toBe(false);
  });

  it('shows an error with a retry button when loading fails', async () => {
    await expand('plans');
    host.requests[0].result.error(new Error('offline'));
    await settle(fixture);
    const retry = item('Plans').querySelector<HTMLButtonElement>('.ui-tree__retry')!;
    expect(item('Plans').querySelector('.ui-tree__error')).not.toBeNull();
    retry.click();
    await settle(fixture);
    expect(host.requests).toHaveLength(2);
    await respond(1, [{ id: 'q1', name: 'Q1' }]);
    expect(labels(root)).toContain('Q1');
    expect(item('Plans').querySelector('.ui-tree__error')).toBeNull();
  });

  it('loads again when a branch that failed is expanded again', async () => {
    await expand('plans');
    host.requests[0].result.error(new Error('offline'));
    await settle(fixture);
    await expand();
    expect(item('Plans').querySelector('.ui-tree__error')).toBeNull();
    await expand('plans');
    expect(host.requests).toHaveLength(2);
  });

  it('accepts a promise', async () => {
    host.promised = true;
    await expand('archive');
    await settle(fixture);
    expect(labels(root)).toContain('Inside');
  });

  it('adds children loaded under a checked branch to the value, without marking it dirty', async () => {
    host.selection.set('multiple');
    await settle(fixture);
    item('Plans').click();
    await settle(fixture);
    expect(host.control.value).toEqual(['plans']);
    host.control.markAsPristine();
    await expand('plans');
    await respond(0, [
      { id: 'q1', name: 'Q1' },
      { id: 'q2', name: 'Q2' },
    ]);
    expect(host.control.value).toEqual(['plans', 'q1', 'q2']);
    expect(host.control.dirty).toBe(false);
    expect(item('Q1').getAttribute('aria-checked')).toBe('true');
  });

  it('expands every loaded branch with expandAll() without loading, and collapses all', async () => {
    host.tree().expandAll();
    await settle(fixture);
    expect(host.expanded()).toEqual(['notes']);
    expect(host.requests).toHaveLength(0);
    host.tree().collapseAll();
    await settle(fixture);
    expect(host.expanded()).toEqual([]);
  });
});

@Component({
  imports: [UiTree, UiTreeNodeDef],
  template: `
    <ui-tree [data]="data()" [displayWith]="nameOf" [loading]="loading()" aria-label="Units">
      <ng-template
        uiTreeNode
        [uiTreeNodeOf]="data()"
        let-unit
        let-level="level"
        let-expanded="expanded"
      >
        <b class="custom">{{ unit.name }} / {{ level }} / {{ expanded }}</b>
      </ng-template>
    </ui-tree>
  `,
})
class ContentHost {
  readonly data = signal<Unit[]>(UNITS);
  readonly nameOf = nameOf;
  readonly loading = signal(false);
}

@Component({
  imports: [UiTree],
  template:
    '<ui-tree [data]="[]" aria-label="Units"><span uiTreeEmpty>Nothing here</span></ui-tree>',
})
class EmptyHost {}

describe('UiTree content', () => {
  let fixture: ComponentFixture<ContentHost>;
  let host: ContentHost;
  let root: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ContentHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
  });

  it('renders nodes with the uiTreeNode template, keeping the text for type-ahead', () => {
    const north = items(root)[0];
    expect(north.querySelector('.custom')!.textContent).toBe('North / 0 / false');
    expect(north.querySelector('.ui-tree__label')!.textContent?.trim()).toBe('North / 0 / false');
  });

  it('shows skeleton rows instead of the tree while loading', async () => {
    host.loading.set(true);
    await settle(fixture);
    expect(root.querySelector('[role="tree"]')).toBeNull();
    const busy = root.querySelector('.ui-tree__loading')!;
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(busy.getAttribute('aria-label')).toBe('Units');
    expect(busy.querySelectorAll('ui-skeleton').length).toBeGreaterThan(0);
  });

  it('shows the empty text when there are no nodes', async () => {
    host.data.set([]);
    await settle(fixture);
    expect(root.querySelector('[role="tree"]')).toBeNull();
    expect(root.querySelector('.ui-tree__empty')!.textContent?.trim()).toBe('אין פריטים');
  });

  it('shows the projected empty text instead', async () => {
    const empty = TestBed.createComponent(EmptyHost);
    await settle(empty);
    const element = empty.nativeElement as HTMLElement;
    expect(element.querySelector('.ui-tree__empty')!.textContent?.trim()).toBe('Nothing here');
  });
});

@Component({
  imports: [UiTree, UiFormField, ReactiveFormsModule, FormsModule],
  template: `
    <form [formGroup]="form">
      <ui-form-field label="Units" hint="Pick the units to show">
        <ui-tree
          formControlName="units"
          selection="multiple"
          [data]="data"
          [displayWith]="nameOf"
        />
      </ui-form-field>
    </form>
    <ui-tree
      selection="single"
      [(ngModel)]="picked"
      [data]="data"
      [displayWith]="nameOf"
      aria-label="Pick"
    />
  `,
})
class FormsHost {
  readonly data = UNITS;
  readonly nameOf = nameOf;
  readonly form = new FormGroup({
    units: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [Validators.required, atLeastOne],
    }),
  });
  readonly picked = signal<string | null>('south');
}

describe('UiTree in forms', () => {
  let fixture: ComponentFixture<FormsHost>;
  let host: FormsHost;
  let root: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(FormsHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  function trees(): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('[role="tree"]')];
  }

  it('is labelled, described and marked required by the form field', () => {
    const tree = trees()[0];
    const label = root.querySelector('label.ui-form-field__label')!;
    expect(tree.getAttribute('aria-labelledby')).toBe(label.id);
    expect(tree.getAttribute('aria-describedby')).toBe(
      root.querySelector('.ui-form-field__hint')!.id,
    );
    expect(tree.getAttribute('aria-required')).toBe('true');
  });

  it('shows the error only once the control is touched and invalid', async () => {
    const tree = trees()[0];
    expect(tree.hasAttribute('aria-invalid')).toBe(false);
    host.form.controls.units.markAsTouched();
    await settle(fixture);
    expect(tree.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('.ui-form-field__error')!.textContent).toContain('Pick one');
  });

  it('writes formControlName both ways', async () => {
    host.form.controls.units.setValue(['south']);
    await settle(fixture);
    const south = items(trees()[0]).find((node) => node.textContent?.trim() === 'South')!;
    expect(south.getAttribute('aria-checked')).toBe('true');
    items(trees()[0])[0].click();
    await settle(fixture);
    expect(host.form.controls.units.value).toEqual(['south', 'north', 'haifa', 'akko']);
  });

  it('writes ngModel both ways', async () => {
    const tree = trees()[1];
    const south = items(tree).find((node) => node.textContent?.trim() === 'South')!;
    expect(south.getAttribute('aria-selected')).toBe('true');
    items(tree)[0].click();
    await settle(fixture);
    expect(host.picked()).toBe('north');
  });
});

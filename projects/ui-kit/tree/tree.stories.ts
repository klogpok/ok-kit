import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { press, until } from '../.storybook/play';
import { UiBadge } from '@vplans/ui-kit/badge';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiTree, UiTreeNodeDef } from './tree';

interface Unit {
  id: string;
  name: string;
  children?: Unit[];
}

const UNITS: Unit[] = [
  {
    id: 'north',
    name: 'מחוז צפון',
    children: [
      {
        id: 'haifa',
        name: 'חיפה',
        children: [
          { id: 'carmel', name: 'כרמל' },
          { id: 'hadar', name: 'הדר' },
        ],
      },
      { id: 'akko', name: 'עכו' },
    ],
  },
  {
    id: 'center',
    name: 'מחוז מרכז',
    children: [
      { id: 'tel-aviv', name: 'תל אביב' },
      { id: 'holon', name: 'חולון' },
      { id: 'rishon', name: 'ראשון לציון' },
    ],
  },
  {
    id: 'south',
    name: 'מחוז דרום',
    children: [
      { id: 'beer-sheva', name: 'באר שבע' },
      { id: 'eilat', name: 'אילת' },
    ],
  },
  { id: 'hq', name: 'מטה' },
];

interface Folder {
  id: string;
  name: string;
  count: number;
  lazy?: boolean;
  fails?: boolean;
  children?: Folder[];
}

const FOLDERS: Folder[] = [
  { id: 'plans', name: 'תוכניות', count: 12, lazy: true },
  { id: 'permits', name: 'היתרים', count: 4, lazy: true, fails: true },
  {
    id: 'contracts',
    name: 'חוזים',
    count: 3,
    children: [
      { id: 'signed', name: 'חתומים', count: 2 },
      { id: 'drafts', name: 'טיוטות', count: 1 },
    ],
  },
];

const nameOf = (item: { name: string }): string => item.name;
const isLazy = (folder: Folder): boolean => !!folder.lazy;
/** Children "from a server": a short delay, and the permits folder always fails. */
const loadFolder = (folder: Folder): Promise<Folder[]> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (folder.fails) reject(new Error('offline'));
      else
        resolve([
          { id: `${folder.id}-2025`, name: '2025', count: 7 },
          { id: `${folder.id}-2026`, name: '2026', count: 5 },
        ]);
    }, 300);
  });

const meta: Meta<UiTree<Unit, string>> = {
  title: 'Data display/Tree',
  component: UiTree,
  decorators: [moduleMetadata({ imports: [UiTreeNodeDef, UiFormField, UiError, UiIcon, UiBadge] })],
};

export default meta;
type Story = StoryObj<UiTree<Unit, string>>;

/** Without selection: a click on a branch, or the arrow keys, expand it. */
export const Default: Story = {
  render: () => ({
    props: { units: UNITS, nameOf },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          [data]="units"
          [displayWith]="nameOf"
          [expanded]="['north', 'haifa']"
          aria-label="יחידות"
        />
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree [data]="units" [displayWith]="nameOf" [(expanded)]="expanded" aria-label="יחידות" />`,
      },
    },
  },
};

/** One selected node; the value is its key. Moving focus with the arrows keeps the selection. */
export const Single: Story = {
  render: () => ({
    props: { units: UNITS, nameOf, unit: 'holon' },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          selection="single"
          [(value)]="unit"
          [data]="units"
          [displayWith]="nameOf"
          [expanded]="['center']"
          aria-label="יחידה"
        />
        <p>{{ unit ?? 'ללא בחירה' }}</p>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree selection="single" formControlName="unit" [data]="units" [displayWith]="nameOf" aria-label="יחידה" />`,
      },
    },
  },
};

/**
 * Tri-state checkboxes: a branch is checked when everything under it is. The value holds the key
 * of every checked node, branches included, and never a partially checked one.
 */
export const Multiple: Story = {
  render: () => ({
    props: { units: UNITS, nameOf, checked: ['carmel', 'tel-aviv', 'south'] },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          selection="multiple"
          [(value)]="checked"
          [data]="units"
          [displayWith]="nameOf"
          [expanded]="['north', 'haifa', 'center']"
          aria-label="יחידות לסינון"
        />
        <p>{{ checked.join(', ') }}</p>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree selection="multiple" formControlName="units" [data]="units" [displayWith]="nameOf" aria-label="יחידות לסינון" />`,
      },
    },
  },
};

/** A disabled node can be focused but not checked; its branch stays partially checked. */
export const DisabledNodes: Story = {
  render: () => ({
    props: { units: UNITS, nameOf, isAkko: (unit: Unit) => unit.id === 'akko' },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          selection="multiple"
          [value]="['haifa']"
          [data]="units"
          [displayWith]="nameOf"
          [disabledWith]="isAkko"
          [expanded]="['north']"
          aria-label="יחידות"
        />
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree selection="multiple" [data]="units" [displayWith]="nameOf" [disabledWith]="isLocked" aria-label="יחידות" />`,
      },
    },
  },
};

export const Disabled: Story = {
  render: () => ({
    props: { units: UNITS, nameOf },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          selection="multiple"
          disabled
          [value]="['carmel']"
          [data]="units"
          [displayWith]="nameOf"
          [expanded]="['north', 'haifa']"
          aria-label="יחידות"
        />
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree selection="multiple" disabled [data]="units" [displayWith]="nameOf" aria-label="יחידות" />`,
      },
    },
  },
};

/** Readonly: the nodes still expand and take focus, but the selection does not change. */
export const Readonly: Story = {
  render: () => ({
    props: { units: UNITS, nameOf },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          selection="single"
          readonly
          value="holon"
          [data]="units"
          [displayWith]="nameOf"
          [expanded]="['center']"
          aria-label="יחידה"
        />
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree selection="single" readonly formControlName="unit" [data]="units" [displayWith]="nameOf" aria-label="יחידה" />`,
      },
    },
  },
};

/** In a form field: labelled by the field, with its hint and error. */
export const Invalid: Story = {
  render: () => ({
    props: { units: UNITS, nameOf },
    template: `
      <div style="max-inline-size:20rem">
        <ui-form-field label="יחידות" hint="יחידות שיוצגו בדוח" required>
          <ui-tree selection="multiple" invalid required [data]="units" [displayWith]="nameOf" />
          <ui-error>יש לבחור לפחות יחידה אחת</ui-error>
        </ui-form-field>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-form-field label="יחידות" hint="יחידות שיוצגו בדוח">
  <ui-tree selection="multiple" formControlName="units" [data]="units" [displayWith]="nameOf" />
</ui-form-field>`,
      },
    },
  },
};

/** `uiTreeNode` replaces the text of each node; the chevron and the indent stay. */
export const CustomNode: Story = {
  render: () => ({
    props: { folders: FOLDERS },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree [data]="folders" [expanded]="['contracts']" aria-label="מסמכים">
          <ng-template uiTreeNode [uiTreeNodeOf]="folders" let-folder>
            <ui-icon icon="file" />
            <span style="flex:1">{{ folder.name }}</span>
            <ui-badge appearance="soft" size="sm" [count]="folder.count" />
          </ng-template>
        </ui-tree>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree [data]="folders" aria-label="מסמכים">
  <ng-template uiTreeNode [uiTreeNodeOf]="folders" let-folder>
    <ui-icon icon="file" /> {{ folder.name }}
    <ui-badge appearance="soft" size="sm" [count]="folder.count" />
  </ng-template>
</ui-tree>`,
      },
    },
  },
};

/** Lazy branches load their children on the first expand. */
export const Lazy: Story = {
  render: () => ({
    props: { folders: FOLDERS, nameOf, isLazy, loadFolder },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          [data]="folders"
          [displayWith]="nameOf"
          [hasChildrenWith]="isLazy"
          [loadChildren]="loadFolder"
          aria-label="מסמכים"
        />
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-tree
  [data]="folders"
  [displayWith]="nameOf"
  [hasChildrenWith]="hasChildren"
  [loadChildren]="loadChildren"
  aria-label="מסמכים"
/>`,
      },
    },
  },
};

export const LazyExpanded: Story = {
  ...Lazy,
  play: async ({ canvasElement }) => {
    const plans = canvasElement.querySelector<HTMLElement>('.ui-tree__node .ui-tree__toggle')!;
    plans.click();
    const loaded = () =>
      [...canvasElement.querySelectorAll('.ui-tree__label')].some(
        (label) => label.textContent?.trim() === '2025',
      );
    await until(loaded, 'the children did not load');
    await expect(loaded()).toBe(true);
  },
};

/** A branch whose children are loading is busy and shows a spinner instead of its chevron. */
export const LazyLoading: Story = {
  render: () => ({
    props: {
      folders: FOLDERS,
      nameOf,
      isLazy,
      // Never resolves, so the loading state stays for the snapshot.
      pending: () => new Promise<Folder[]>(() => undefined),
    },
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree
          [data]="folders"
          [displayWith]="nameOf"
          [hasChildrenWith]="isLazy"
          [loadChildren]="pending"
          aria-label="מסמכים"
        />
      </div>`,
  }),
  parameters: Lazy.parameters,
  play: async ({ canvasElement }) => {
    const plans = canvasElement.querySelector<HTMLElement>('.ui-tree__node .ui-tree__toggle')!;
    plans.click();
    const busy = () => !!canvasElement.querySelector('.ui-tree__node[aria-busy="true"]');
    await until(busy, 'the branch is not loading');
    await expect(busy()).toBe(true);
  },
};

/** A failed load shows an error and a retry button in the node. */
export const LoadError: Story = {
  ...Lazy,
  play: async ({ canvasElement }) => {
    const permits = canvasElement.querySelectorAll<HTMLElement>(
      '.ui-tree__node .ui-tree__toggle',
    )[1];
    permits.click();
    const failed = () => !!canvasElement.querySelector('.ui-tree__retry');
    await until(failed, 'the load did not fail');
    await expect(failed()).toBe(true);
  },
};

/** Skeleton rows while the data loads. */
export const Loading: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree loading aria-label="יחידות" />
      </div>`,
  }),
};

export const Empty: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:20rem">
        <ui-tree [data]="[]" aria-label="יחידות" />
      </div>`,
  }),
};

/** The keyboard: arrows, Home / End, letters to jump by text, `*` to expand all siblings. */
export const KeyboardFocus: Story = {
  ...Multiple,
  play: async ({ canvasElement }) => {
    const first = canvasElement.querySelector<HTMLElement>('.ui-tree__node')!;
    first.focus();
    press('ArrowDown');
    const focused = () => document.activeElement?.textContent?.trim() === 'חיפה';
    await until(focused, 'focus did not move to the second node');
    await expect(focused()).toBe(true);
  },
};

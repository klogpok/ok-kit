import { Component, computed, input, signal } from '@angular/core';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiBadge, UiBadgeTone } from '@vplans/ui-kit/badge';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiPagination } from '@vplans/ui-kit/pagination';
import { UiExpandableRow, UiRowDetail, UiRowToggle } from './expandable-row';
import { UiSticky, UiTableContainer } from './sticky';
import { UiTableSelectAll, UiTableSelectRow, UiTableSelection } from './selection';
import { UiSort, UiSortHeader, UiSortState, uiSortData } from './sort';
import { UiTable, UiTableDensity, UiTableMessage, UiTableSkeleton } from './table';
import { UiTableViewport } from './viewport';

interface Plan {
  id: number;
  name: string;
  owner: string;
  units: number;
  status: { text: string; tone: UiBadgeTone };
}

const STATUSES = [
  { text: 'ממתין לאישור מתאם', tone: 'primary' },
  { text: 'ממתין לחתימה', tone: 'warning' },
  { text: 'לא הוגדר לו"ז', tone: 'neutral' },
] as const;
const OWNERS = ['דנה כהן', 'יוסי לוי', 'מיכל אברהם', 'אבי מזרחי'];

const PLANS: Plan[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `תוכנית ${i + 1}`,
  owner: OWNERS[i % OWNERS.length],
  units: ((i * 7) % 23) + 1,
  status: STATUSES[i % STATUSES.length],
}));

/** A plans table wired the way an app would do it: sort, page, loading and empty states. */
@Component({
  selector: 'ui-story-plans-table',
  imports: [
    UiTable,
    UiSort,
    UiSortHeader,
    UiTableMessage,
    UiTableSkeleton,
    UiBadge,
    UiIcon,
    UiIconButton,
    UiPagination,
  ],
  template: `
    <div style="display:grid;gap:16px">
      <table ui-table uiSort [(sort)]="sort" [loading]="loading()" [density]="density()">
        <caption class="ui-visually-hidden">
          תוכניות
        </caption>
        <thead>
          <tr>
            <th scope="col" ui-sort-header="name">שם</th>
            <th scope="col" ui-sort-header="owner">בעלים</th>
            <th scope="col" ui-sort-header="units" class="ui-table-numeric">יחידות</th>
            <th scope="col">סטטוס</th>
            <th scope="col"><span class="ui-visually-hidden">פעולות</span></th>
          </tr>
        </thead>
        <tbody>
          @if (loading() && !rows().length) {
            @for (row of [1, 2, 3, 4, 5]; track row) {
              <tr ui-table-skeleton></tr>
            }
          } @else {
            @for (plan of page(); track plan.id) {
              <tr>
                <td>{{ plan.name }}</td>
                <td>{{ plan.owner }}</td>
                <td class="ui-table-numeric">{{ plan.units }}</td>
                <td>
                  <ui-badge [tone]="plan.status.tone">{{ plan.status.text }}</ui-badge>
                </td>
                <td class="ui-table-numeric">
                  <button ui-icon-button size="sm" [label]="'עריכת ' + plan.name">
                    <ui-icon icon="edit" />
                  </button>
                </td>
              </tr>
            } @empty {
              <tr ui-table-message>
                אין תוכניות להצגה
              </tr>
            }
          }
        </tbody>
      </table>
      @if (rows().length) {
        <ui-pagination
          [length]="rows().length"
          [(pageIndex)]="pageIndex"
          [(pageSize)]="pageSize"
          [pageSizeOptions]="[5, 10, 25]"
        />
      }
    </div>
  `,
})
class PlansTable {
  readonly data = input<Plan[]>(PLANS);
  readonly loading = input(false);
  readonly density = input<UiTableDensity>('default');

  readonly sort = signal<UiSortState | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly rows = computed(() => uiSortData(this.data(), this.sort(), undefined, 'he'));
  readonly page = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });
}

/** Row selection with a bulk action bar. */
@Component({
  selector: 'ui-story-selection-table',
  imports: [UiTable, UiTableSelection, UiTableSelectAll, UiTableSelectRow, UiBadge, UiButton],
  template: `
    <div style="display:grid;gap:12px">
      <div style="display:flex;align-items:center;gap:12px;min-block-size:32px">
        <span>נבחרו {{ selected().length }} תוכניות</span>
        @if (selected().length) {
          <button ui-button size="sm" variant="secondary" (click)="selected.set([])">
            ניקוי הבחירה
          </button>
        }
      </div>
      <table ui-table [(uiTableSelection)]="selected">
        <caption class="ui-visually-hidden">
          תוכניות
        </caption>
        <thead>
          <tr>
            <th ui-table-select-all></th>
            <th scope="col">שם</th>
            <th scope="col">בעלים</th>
            <th scope="col">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          @for (plan of rows; track plan.id) {
            <tr>
              <td [ui-table-select-row]="plan" [label]="'בחירת ' + plan.name"></td>
              <td>{{ plan.name }}</td>
              <td>{{ plan.owner }}</td>
              <td>
                <ui-badge [tone]="plan.status.tone">{{ plan.status.text }}</ui-badge>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
class SelectionTable {
  readonly rows = PLANS.slice(0, 6);
  readonly selected = signal<readonly Plan[]>([PLANS[1], PLANS[2]]);
}

/** Rows that open a detail row. */
@Component({
  selector: 'ui-story-expandable-table',
  imports: [UiTable, UiExpandableRow, UiRowToggle, UiRowDetail, UiBadge],
  template: `
    <table ui-table>
      <caption class="ui-visually-hidden">
        תוכניות
      </caption>
      <thead>
        <tr>
          <th scope="col"><span class="ui-visually-hidden">פרטים</span></th>
          <th scope="col">שם</th>
          <th scope="col">בעלים</th>
          <th scope="col">סטטוס</th>
        </tr>
      </thead>
      <tbody>
        @for (plan of rows; track plan.id) {
          <tr uiExpandableRow #row="uiExpandableRow" [expanded]="plan.id === 2">
            <td ui-row-toggle [label]="'פרטי ' + plan.name"></td>
            <td>{{ plan.name }}</td>
            <td>{{ plan.owner }}</td>
            <td>
              <ui-badge [tone]="plan.status.tone">{{ plan.status.text }}</ui-badge>
            </td>
          </tr>
          <tr [ui-row-detail]="row">
            <dl style="display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:0">
              <dt>יחידות</dt>
              <dd style="margin:0">{{ plan.units }}</dd>
              <dt>עודכן</dt>
              <dd style="margin:0">לפני {{ plan.id + 1 }} ימים</dd>
            </dl>
          </tr>
        }
      </tbody>
    </table>
  `,
})
class ExpandableTable {
  readonly rows = PLANS.slice(0, 4);
}

/** A wide table in a scrolling container with sticky columns on both sides. */
@Component({
  selector: 'ui-story-wide-table',
  imports: [
    UiTable,
    UiTableContainer,
    UiSticky,
    UiTableSelection,
    UiTableSelectAll,
    UiTableSelectRow,
    UiBadge,
    UiIcon,
    UiIconButton,
  ],
  template: `
    <ui-table-container style="max-block-size:22rem;max-inline-size:40rem">
      <table ui-table stickyHeader [(uiTableSelection)]="selected">
        <caption class="ui-visually-hidden">
          יחידות
        </caption>
        <thead>
          <tr>
            <th ui-table-select-all uiSticky></th>
            <th scope="col" uiSticky>שם</th>
            @for (column of columns; track column) {
              <th scope="col" class="ui-table-numeric">{{ column }}</th>
            }
            <th scope="col">סטטוס</th>
            <th scope="col" uiSticky="end"><span class="ui-visually-hidden">פעולות</span></th>
          </tr>
        </thead>
        <tbody>
          @for (plan of rows; track plan.id) {
            <tr>
              <td [ui-table-select-row]="plan" uiSticky [label]="'בחירת ' + plan.name"></td>
              <td uiSticky style="white-space:nowrap">{{ plan.name }}</td>
              @for (column of columns; track column) {
                <td class="ui-table-numeric">{{ plan.units * ($index + 2) }}</td>
              }
              <td style="white-space:nowrap">
                <ui-badge [tone]="plan.status.tone">{{ plan.status.text }}</ui-badge>
              </td>
              <td uiSticky="end">
                <button ui-icon-button size="sm" [label]="'עריכת ' + plan.name">
                  <ui-icon icon="edit" />
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </ui-table-container>
  `,
})
class WideTable {
  readonly columns = ['קומה 1', 'קומה 2', 'קומה 3', 'קומה 4', 'קומה 5', 'קומה 6'];
  readonly rows = PLANS.slice(0, 12);
  readonly selected = signal<readonly Plan[]>([PLANS[0]]);
}

interface Unit {
  id: number;
  building: string;
  floor: number;
  area: number;
  status: (typeof STATUSES)[number];
}

const UNITS: Unit[] = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  building: `בניין ${String.fromCharCode(1488 + (i % 6))}`,
  floor: (i % 30) + 1,
  area: 40 + ((i * 7) % 90),
  status: STATUSES[i % STATUSES.length],
}));

/** 10,000 rows in a virtual scroll viewport. */
@Component({
  selector: 'ui-story-virtual-table',
  imports: [
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    UiTable,
    UiTableViewport,
    UiBadge,
  ],
  template: `
    <cdk-virtual-scroll-viewport uiTableViewport itemSize="48" style="block-size: 24rem">
      <table ui-table stickyHeader>
        <caption class="ui-visually-hidden">
          יחידות
        </caption>
        <thead>
          <tr>
            <th scope="col">יחידה</th>
            <th scope="col">בניין</th>
            <th scope="col" class="ui-table-numeric">קומה</th>
            <th scope="col" class="ui-table-numeric">שטח (מ"ר)</th>
            <th scope="col">סטטוס</th>
          </tr>
        </thead>
        <tbody>
          <tr *cdkVirtualFor="let unit of units; trackBy: trackId">
            <td>יחידה {{ unit.id }}</td>
            <td>{{ unit.building }}</td>
            <td class="ui-table-numeric">{{ unit.floor }}</td>
            <td class="ui-table-numeric">{{ unit.area }}</td>
            <td>
              <ui-badge [tone]="unit.status.tone">{{ unit.status.text }}</ui-badge>
            </td>
          </tr>
        </tbody>
      </table>
    </cdk-virtual-scroll-viewport>
  `,
})
class VirtualTable {
  readonly units = UNITS;
  readonly trackId = (_index: number, unit: Unit) => unit.id;
}

interface TableArgs {
  isLoading: boolean;
  rowDensity: UiTableDensity;
}

const meta: Meta<TableArgs> = {
  title: 'Data display/Table',
  component: UiTable,
  decorators: [
    moduleMetadata({
      imports: [
        PlansTable,
        SelectionTable,
        ExpandableTable,
        WideTable,
        VirtualTable,
        UiTable,
        UiSort,
        UiSortHeader,
        UiTableMessage,
        UiTableSkeleton,
      ],
    }),
  ],
  argTypes: { rowDensity: { control: 'inline-radio', options: ['default', 'compact'] } },
};

export default meta;
type Story = StoryObj<TableArgs>;

/** VPlans plans list: sortable columns, status pills, row actions and pagination. */
// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Plans: Story = {
  args: { isLoading: false, rowDensity: 'default' },
  render: (args) => ({
    props: args,
    template: `<ui-story-plans-table dir="rtl" lang="he" [loading]="isLoading" [density]="rowDensity" />`,
  }),
};

export const Compact: Story = { ...Plans, args: { ...Plans.args, rowDensity: 'compact' } };

/** Reloading with rows on screen: the table is `aria-busy` and a line pulses under the header. */
export const Reloading: Story = { ...Plans, args: { ...Plans.args, isLoading: true } };

/** First load: skeleton rows. */
export const FirstLoad: Story = {
  render: () => ({
    template: `<ui-story-plans-table dir="rtl" lang="he" [data]="[]" [loading]="true" />`,
  }),
};

export const Empty: Story = {
  render: () => ({
    template: `<ui-story-plans-table dir="rtl" lang="he" [data]="[]" />`,
  }),
};

/** The header stays visible while the container scrolls. */
export const StickyHeader: Story = {
  render: () => ({
    template: `
      <div style="max-block-size:16rem;overflow:auto" tabindex="0" role="region" aria-label="Units">
        <table ui-table stickyHeader>
          <thead><tr><th scope="col">Unit</th><th scope="col" class="ui-table-numeric">Area (m²)</th></tr></thead>
          <tbody>
            @for (row of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; track row) {
              <tr><td>Unit {{ row }}</td><td class="ui-table-numeric">{{ 40 + row * 3 }}</td></tr>
            }
          </tbody>
        </table>
      </div>`,
  }),
};

/**
 * Row selection: the header checkbox is mixed while some rows are selected. Shift+click selects
 * a range.
 */
export const Selection: Story = {
  render: () => ({ template: `<ui-story-selection-table dir="rtl" lang="he" />` }),
};

/** Expandable rows: the button reports `aria-expanded` and controls the detail row below. */
export const ExpandableRows: Story = {
  render: () => ({ template: `<ui-story-expandable-table dir="rtl" lang="he" />` }),
};

/**
 * A wide table in `ui-table-container`: the selection and name columns stick to the start, the
 * actions to the end, and a shadow marks the side with more content. The scrolling area is a
 * focusable region named by the caption.
 */
export const WideWithStickyColumns: Story = {
  render: () => ({ template: `<ui-story-wide-table dir="rtl" lang="he" />` }),
};

/**
 * Thousands of rows: `cdk-virtual-scroll-viewport[uiTableViewport]` renders only the rows in
 * view. The table reports the whole row count and each row its position to screen readers.
 */
export const VirtualRows: Story = {
  render: () => ({ template: `<ui-story-virtual-table dir="rtl" lang="he" />` }),
  parameters: {
    docs: {
      source: {
        code: `<cdk-virtual-scroll-viewport uiTableViewport itemSize="48" style="block-size: 24rem">
  <table ui-table stickyHeader>
    <caption class="ui-visually-hidden">יחידות</caption>
    <thead>...</thead>
    <tbody>
      <tr *cdkVirtualFor="let unit of units; trackBy: trackId">...</tr>
    </tbody>
  </table>
</cdk-virtual-scroll-viewport>`,
      },
    },
  },
};

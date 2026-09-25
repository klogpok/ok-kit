import { Component, computed, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiBadge, UiBadgeTone } from '@vplans/ui-kit/badge';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiPagination } from '@vplans/ui-kit/pagination';
import { UiSort, UiSortHeader, UiSortState, uiSortData } from './sort';
import { UiTable, UiTableDensity, UiTableMessage, UiTableSkeleton } from './table';

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

interface TableArgs {
  isLoading: boolean;
  rowDensity: UiTableDensity;
}

const meta: Meta<TableArgs> = {
  title: 'Data display/Table',
  component: UiTable,
  decorators: [
    moduleMetadata({
      imports: [PlansTable, UiTable, UiSort, UiSortHeader, UiTableMessage, UiTableSkeleton],
    }),
  ],
  argTypes: { rowDensity: { control: 'inline-radio', options: ['default', 'compact'] } },
  args: { isLoading: false, rowDensity: 'default' },
  render: (args) => ({
    props: args,
    template: `<ui-story-plans-table dir="rtl" lang="he" [loading]="isLoading" [density]="rowDensity" />`,
  }),
};

export default meta;
type Story = StoryObj<TableArgs>;

/** VPlans plans list: sortable columns, status pills, row actions and pagination. */
export const Plans: Story = {};

export const Compact: Story = { args: { rowDensity: 'compact' } };

/** Reloading with rows on screen: the table is `aria-busy` and a line pulses under the header. */
export const Reloading: Story = { args: { isLoading: true } };

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
    props: { rows: Array.from({ length: 30 }, (_, i) => i + 1) },
    template: `
      <div style="max-block-size:16rem;overflow:auto" tabindex="0" role="region" aria-label="Units">
        <table ui-table stickyHeader>
          <thead><tr><th scope="col">Unit</th><th scope="col" class="ui-table-numeric">Area (m²)</th></tr></thead>
          <tbody>
            @for (row of rows; track row) {
              <tr><td>Unit {{ row }}</td><td class="ui-table-numeric">{{ 40 + row * 3 }}</td></tr>
            }
          </tbody>
        </table>
      </div>`,
  }),
};

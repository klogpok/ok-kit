import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiPagination } from './pagination';

interface PaginationArgs {
  total: number;
  index: number;
  size: number;
  siblings: number;
  firstLast: boolean;
  isDisabled: boolean;
}

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<PaginationArgs> = {
  title: 'Navigation/Pagination',
  component: UiPagination,
  argTypes: {
    total: { control: { type: 'number', min: 0 } },
    index: { control: { type: 'number', min: 0 } },
    size: { control: 'inline-radio', options: [10, 25, 50] },
    siblings: { control: { type: 'number', min: 0, max: 3 } },
  },
  args: { total: 237, index: 0, size: 10, siblings: 1, firstLast: true, isDisabled: false },
  render: (args) => ({
    props: args,
    template: `
      <ui-pagination
        [length]="total"
        [(pageIndex)]="index"
        [(pageSize)]="size"
        [pageSizeOptions]="[10, 25, 50]"
        [siblingCount]="siblings"
        [showFirstLast]="firstLast"
        [disabled]="isDisabled"
      />`,
  }),
};

export default meta;
type Story = StoryObj<PaginationArgs>;

export const Default: Story = {};

export const MiddlePage: Story = { args: { index: 11 } };

export const FewPages: Story = { args: { total: 42 } };

export const Empty: Story = { args: { total: 0 } };

export const Disabled: Story = { args: { index: 3, isDisabled: true } };

/** Without the page size select and the first/last buttons. */
export const Compact: Story = {
  render: () => ({
    props: { index: 4 },
    template: `<ui-pagination [length]="120" [(pageIndex)]="index" [showFirstLast]="false" />`,
  }),
};

/** The kit defaults to Hebrew texts; chevrons point the other way in RTL. */
export const Hebrew: Story = {
  render: () => ({
    props: { index: 2, size: 25 },
    template: `
      <div dir="rtl" lang="he">
        <ui-pagination [length]="480" [(pageIndex)]="index" [(pageSize)]="size" [pageSizeOptions]="[25, 50, 100]" />
      </div>`,
  }),
};

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
};

export default meta;
type Story = StoryObj<PaginationArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
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

export const MiddlePage: Story = { ...Default, args: { ...Default.args, index: 11 } };

export const FewPages: Story = { ...Default, args: { ...Default.args, total: 42 } };

export const Empty: Story = { ...Default, args: { ...Default.args, total: 0 } };

export const Disabled: Story = {
  ...Default,
  args: { ...Default.args, index: 3, isDisabled: true },
};

/** Without the page size select and the first/last buttons. */
export const Compact: Story = {
  args: { index: 4 },
  render: (args) => ({
    props: args,
    template: `<ui-pagination [length]="120" [(pageIndex)]="index" [showFirstLast]="false" />`,
  }),
};

/** The kit defaults to Hebrew texts; chevrons point the other way in RTL. */
export const Hebrew: Story = {
  args: { index: 2, size: 25 },
  render: (args) => ({
    props: args,
    template: `
      <div dir="rtl" lang="he">
        <ui-pagination [length]="480" [(pageIndex)]="index" [(pageSize)]="size" [pageSizeOptions]="[25, 50, 100]" />
      </div>`,
  }),
};

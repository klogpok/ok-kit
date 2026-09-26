import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCard } from '@vplans/ui-kit/card';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiTable, UiTableMessage } from '@vplans/ui-kit/table';
import { UiEmptyState } from './empty-state';

type EmptyStateArgs = UiEmptyState & { text: string };

const meta: Meta<EmptyStateArgs> = {
  title: 'Feedback/Empty state',
  component: UiEmptyState,
  decorators: [moduleMetadata({ imports: [UiButton, UiCard, UiIcon, UiTable, UiTableMessage] })],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
};

export default meta;
type Story = StoryObj<EmptyStateArgs>;

export const Default: Story = {
  args: {
    title: 'No plans yet',
    text: 'Plans you create or that are shared with you show up here.',
    size: 'md',
    headingLevel: 2,
  },
  render: ({ text, ...args }) => ({
    props: args,
    template: `
      <ui-empty-state [title]="title" [size]="size" [headingLevel]="headingLevel">
        <ui-icon icon="file" />
        ${text}
        <button uiEmptyStateActions ui-button><ui-icon icon="plus" /> Create a plan</button>
      </ui-empty-state>`,
  }),
};

export const Small: Story = {
  render: () => ({
    template: `
      <ui-card style="max-width:24rem">
        <ui-empty-state size="sm" title="No comments">
          <ui-icon icon="bell" />
          Comments from the coordinator appear here.
        </ui-empty-state>
      </ui-card>`,
  }),
};

export const InTable: Story = {
  render: () => ({
    template: `
      <table ui-table>
        <caption class="ui-visually-hidden">Plans</caption>
        <thead>
          <tr><th scope="col">Name</th><th scope="col">Owner</th><th scope="col">Status</th></tr>
        </thead>
        <tbody>
          <tr ui-table-message>
            <ui-empty-state size="sm" title="No plans match the filter" headingLevel="4">
              <ui-icon icon="search" />
              Try another name or clear the filter.
              <button uiEmptyStateActions ui-button size="sm" variant="secondary">Clear filter</button>
            </ui-empty-state>
          </tr>
        </tbody>
      </table>`,
  }),
};

export const WithIllustration: Story = {
  render: () => ({
    template: `
      <ui-empty-state title="Nothing to sign">
        <svg uiEmptyStateMedia width="120" height="80" viewBox="0 0 120 80" aria-hidden="true">
          <rect x="20" y="10" width="80" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5" />
          <path d="M40 40h40M40 52h24" stroke="currentColor" stroke-width="2" opacity="0.5" />
        </svg>
        All plans are signed. New plans that need your signature show up here.
      </ui-empty-state>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he">
        <ui-empty-state title="אין תוכניות עדיין">
          <ui-icon icon="file" />
          תוכניות שיצרת או ששותפו איתך יופיעו כאן.
          <button uiEmptyStateActions ui-button>יצירת תוכנית</button>
        </ui-empty-state>
      </div>`,
  }),
};

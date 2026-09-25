import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiCard, UiCardContent } from '@vplans/ui-kit/card';
import { UiSkeleton } from './skeleton';

const meta: Meta<UiSkeleton> = {
  title: 'Feedback/Skeleton',
  component: UiSkeleton,
  decorators: [moduleMetadata({ imports: [UiCard, UiCardContent] })],
  argTypes: {
    shape: { control: 'inline-radio', options: ['text', 'rect', 'circle'] },
    lines: { control: { type: 'number', min: 1, max: 8 } },
    width: { control: 'text' },
    height: { control: 'text' },
  },
  args: { shape: 'text', lines: 3, width: '20rem', height: null },
  render: (args) => ({
    props: args,
    template: `<ui-skeleton [shape]="shape" [lines]="lines" [width]="width" [height]="height" />`,
  }),
};

export default meta;
type Story = StoryObj<UiSkeleton>;

export const Text: Story = {};

export const Rect: Story = { args: { shape: 'rect', width: '20rem', height: '8rem' } };

export const Circle: Story = { args: { shape: 'circle', width: '3rem' } };

/** A loading card. The container carries `aria-busy` and the name, the skeletons are hidden. */
export const LoadingCard: Story = {
  render: () => ({
    template: `
      <ui-card style="max-inline-size:24rem" aria-busy="true" aria-label="טוען תוכנית">
        <ui-card-content>
          <div style="display:flex;gap:12px;align-items:center;margin-block-end:16px">
            <ui-skeleton shape="circle" width="2.5rem" />
            <ui-skeleton width="10rem" />
          </div>
          <ui-skeleton lines="3" />
        </ui-card-content>
      </ui-card>`,
  }),
};

/** List rows while the plans load. */
export const List: Story = {
  render: () => ({
    template: `
      <ul style="display:grid;gap:16px;padding:0;margin:0;list-style:none;max-inline-size:32rem" aria-busy="true" aria-label="טוען">
        @for (row of [1, 2, 3]; track row) {
          <li style="display:flex;gap:12px;align-items:center">
            <ui-skeleton shape="rect" width="3rem" height="3rem" />
            <div style="flex:1"><ui-skeleton lines="2" /></div>
          </li>
        }
      </ul>`,
  }),
};

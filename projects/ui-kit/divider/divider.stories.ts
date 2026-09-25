import { argsToTemplate, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiDivider } from './divider';

const meta: Meta<UiDivider> = {
  title: 'Layout/Divider',
  component: UiDivider,
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  args: { orientation: 'horizontal', label: '', decorative: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;max-inline-size:420px">
        <span>Personal details</span>
        <ui-divider ${argsToTemplate(args)} />
        <span>Notifications</span>
      </div>`,
  }),
};

export default meta;
type Story = StoryObj<UiDivider>;

export const Default: Story = {};
export const WithLabel: Story = { args: { label: 'or' } };
export const HebrewLabel: Story = { args: { label: 'או' } };

export const Vertical: Story = {
  render: () => ({
    template: `
      <div style="display:flex;align-items:center;gap:12px;block-size:24px">
        <span>Edit</span>
        <ui-divider orientation="vertical" />
        <span>Duplicate</span>
        <ui-divider orientation="vertical" />
        <span>Delete</span>
      </div>`,
  }),
};

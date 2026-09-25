import { argsToTemplate, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiSpinner } from './spinner';

const meta: Meta<UiSpinner> = {
  title: 'Feedback/Spinner',
  component: UiSpinner,
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  args: { size: 'md', label: '', decorative: false },
  render: (args) => ({ props: args, template: `<ui-spinner ${argsToTemplate(args)} />` }),
};

export default meta;
type Story = StoryObj<UiSpinner>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center">
        <ui-spinner size="sm" /><ui-spinner size="md" /><ui-spinner size="lg" />
      </div>`,
  }),
};

export const InheritsColor: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center">
        <span style="color:var(--ui-color-primary)"><ui-spinner /></span>
        <span style="color:var(--ui-color-danger)"><ui-spinner /></span>
        <span style="color:var(--ui-color-text-muted)"><ui-spinner /></span>
      </div>`,
  }),
};

import { argsToTemplate, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiSwitch } from './switch';

type SwitchArgs = UiSwitch & { label: string };

const meta: Meta<SwitchArgs> = {
  title: 'Forms/Switch',
  component: UiSwitch,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    labelPosition: { control: 'inline-radio', options: ['start', 'end'] },
  },
};

export default meta;
type Story = StoryObj<SwitchArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'Email notifications',
    checked: false,
    disabled: false,
    invalid: false,
    size: 'md',
    labelPosition: 'end',
    fullWidth: false,
  },
  render: ({ label, ...args }) => ({
    props: args,
    template: `<ui-switch ${argsToTemplate(args)}>${label}</ui-switch>`,
  }),
};
export const Checked: Story = { ...Default, args: { ...Default.args, checked: true } };
export const Disabled: Story = { ...Default, args: { ...Default.args, disabled: true } };
export const DisabledChecked: Story = {
  ...Default,
  args: { ...Default.args, disabled: true, checked: true },
};
export const LabelStart: Story = { ...Default, args: { ...Default.args, labelPosition: 'start' } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px">
        <ui-switch size="sm" [checked]="true">Small</ui-switch>
        <ui-switch size="md" [checked]="true">Medium</ui-switch>
        <ui-switch size="lg" [checked]="true">Large</ui-switch>
      </div>`,
  }),
};

export const SettingsList: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px;max-inline-size:360px">
        <ui-switch fullWidth labelPosition="start" [checked]="true">Push notifications</ui-switch>
        <ui-switch fullWidth labelPosition="start">Weekly digest</ui-switch>
        <ui-switch fullWidth labelPosition="start" disabled>Beta features</ui-switch>
      </div>`,
  }),
};

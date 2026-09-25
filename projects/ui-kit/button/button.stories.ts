import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiButton } from './button';
import { UiIconButton } from './icon-button';

type ButtonArgs = UiButton & { label: string; click: () => void };

const meta: Meta<ButtonArgs> = {
  title: 'Actions/Button',
  component: UiButton,
  decorators: [moduleMetadata({ imports: [UiIcon, UiIconButton] })],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    label: { control: 'text' },
  },
  args: {
    label: 'Save changes',
    variant: 'primary',
    size: 'md',
    disabled: false,
    disabledInteractive: false,
    loading: false,
    fullWidth: false,
    click: fn(),
  },
  render: ({ label, click, ...args }) => ({
    props: { ...args, click },
    template: `<button ui-button ${argsToTemplate(args)} (click)="click()">${label}</button>`,
  }),
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger', label: 'Delete' } };
export const Disabled: Story = { args: { disabled: true } };
/** Looks disabled and blocks clicks, but stays focusable and hoverable. */
export const DisabledInteractive: Story = { args: { disabled: true, disabledInteractive: true } };
export const Loading: Story = { args: { loading: true } };
export const FullWidth: Story = { args: { fullWidth: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <button ui-button size="sm">Small</button>
        <button ui-button size="md">Medium</button>
        <button ui-button size="lg">Large</button>
      </div>`,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px;grid-template-columns:repeat(4,max-content)">
        @for (v of ['primary','secondary','ghost','danger']; track v) {
          <button ui-button [variant]="$any(v)">{{ v }}</button>
        }
        @for (v of ['primary','secondary','ghost','danger']; track v) {
          <button ui-button [variant]="$any(v)" disabled>{{ v }}</button>
        }
      </div>`,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button ui-button><ui-icon icon="plus" /> New order</button>
        <button ui-button variant="secondary">Next <ui-icon icon="arrow-right" flipRtl /></button>
        <button ui-button variant="danger"><ui-icon icon="trash" /> Delete</button>
      </div>`,
  }),
};

export const AsLink: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px">
        <a ui-button href="#" variant="secondary">Link button</a>
        <a ui-button href="#" variant="secondary" disabled>Disabled link</a>
      </div>`,
  }),
};

export const IconButtons: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px;align-items:center">
        <button ui-icon-button label="Edit" size="sm"><ui-icon icon="edit" /></button>
        <button ui-icon-button label="Search"><ui-icon icon="search" /></button>
        <button ui-icon-button label="Menu" size="lg"><ui-icon icon="menu" /></button>
        <button ui-icon-button label="Add" variant="primary"><ui-icon icon="plus" /></button>
        <button ui-icon-button label="Delete" variant="danger"><ui-icon icon="trash" /></button>
        <button ui-icon-button label="Saving" variant="secondary" loading><ui-icon icon="check" /></button>
        <button ui-icon-button label="Close" disabled><ui-icon icon="x" /></button>
      </div>`,
  }),
};

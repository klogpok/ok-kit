import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiTooltip, UiTooltipPosition } from './tooltip';

// Arg names differ from the directive's fields: Storybook writes args onto the component instance.
interface TooltipArgs {
  text: string;
  placement: UiTooltipPosition;
  off: boolean;
  showAfter: number;
  hideAfter: number;
}

const meta: Meta<TooltipArgs> = {
  title: 'Overlays/Tooltip',
  component: UiTooltip,
  decorators: [moduleMetadata({ imports: [UiButton, UiIconButton, UiIcon] })],
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'start', 'end'] },
  },
};

export default meta;
type Story = StoryObj<TooltipArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    text: 'Delete the plan',
    placement: 'top',
    off: false,
    showAfter: 300,
    hideAfter: 100,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding:48px;display:flex;justify-content:center">
        <button
          ui-icon-button
          variant="ghost"
          label="Delete"
          [uiTooltip]="text"
          [uiTooltipPosition]="placement"
          [uiTooltipDisabled]="off"
          [uiTooltipShowDelay]="showAfter"
          [uiTooltipHideDelay]="hideAfter"
        >
          <ui-icon icon="trash" />
        </button>
      </div>`,
  }),
};

export const Bottom: Story = { ...Default, args: { ...Default.args, placement: 'bottom' } };
export const Start: Story = { ...Default, args: { ...Default.args, placement: 'start' } };
export const End: Story = { ...Default, args: { ...Default.args, placement: 'end' } };
export const Disabled: Story = { ...Default, args: { ...Default.args, off: true } };

export const LongText: Story = {
  ...Default,
  args: {
    ...Default.args,
    text: 'The plan is locked while the owner signs it. You can edit it again once it is signed or returned.',
  },
};

/** Tab through the buttons: the tooltip opens on keyboard focus and closes on Escape. */
export const Toolbar: Story = {
  render: () => ({
    template: `
      <div style="padding:48px;display:flex;gap:4px;justify-content:center">
        <button ui-icon-button variant="ghost" label="Edit" uiTooltip="Edit"><ui-icon icon="edit" /></button>
        <button ui-icon-button variant="ghost" label="Search" uiTooltip="Search plans"><ui-icon icon="search" /></button>
        <button ui-icon-button variant="ghost" label="Delete" uiTooltip="Delete the plan"><ui-icon icon="trash" /></button>
      </div>`,
  }),
};

/** `disabledInteractive` keeps a disabled button focusable and hoverable, so the tooltip can explain why. */
export const DisabledButton: Story = {
  render: () => ({
    template: `
      <div style="padding:48px;display:flex;gap:16px;justify-content:center">
        <button ui-icon-button label="Delete" disabled disabledInteractive uiTooltip="Only the owner can delete the plan">
          <ui-icon icon="trash" />
        </button>
        <button ui-button disabled disabledInteractive uiTooltip="Fill in all required fields first">Send</button>
      </div>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="padding:48px;display:flex;gap:16px;justify-content:center">
        <button ui-button variant="secondary" uiTooltip="שליחת תזכורת לבעלים" uiTooltipPosition="start">
          תזכורת
        </button>
        <button ui-button variant="secondary" uiTooltip="מחיקת התוכנית" uiTooltipPosition="end">
          מחיקה
        </button>
      </div>`,
  }),
};

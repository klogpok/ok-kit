import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiTooltip } from './tooltip';

const meta: Meta<UiTooltip> = {
  title: 'Overlays/Tooltip',
  component: UiTooltip,
  decorators: [moduleMetadata({ imports: [UiButton, UiIconButton, UiIcon] })],
  argTypes: {
    position: { control: 'inline-radio', options: ['top', 'bottom', 'start', 'end'] },
  },
  args: {
    message: 'Delete the plan',
    position: 'top',
    disabled: false,
    showDelay: 300,
    hideDelay: 100,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding:48px;display:flex;justify-content:center">
        <button
          ui-icon-button
          variant="ghost"
          label="Delete"
          [uiTooltip]="message"
          [uiTooltipPosition]="position"
          [uiTooltipDisabled]="disabled"
          [uiTooltipShowDelay]="showDelay"
          [uiTooltipHideDelay]="hideDelay"
        >
          <ui-icon icon="trash" />
        </button>
      </div>`,
  }),
};

export default meta;
type Story = StoryObj<UiTooltip>;

export const Default: Story = {};
export const Bottom: Story = { args: { position: 'bottom' } };
export const Start: Story = { args: { position: 'start' } };
export const End: Story = { args: { position: 'end' } };
export const Disabled: Story = { args: { disabled: true } };

export const LongText: Story = {
  args: {
    message:
      'The plan is locked while the owner signs it. You can edit it again once it is signed or returned.',
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

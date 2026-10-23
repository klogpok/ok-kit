import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiIcon } from '@vplans/ui-kit/icon';
import { until } from '../.storybook/play';
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
    placement: {
      control: 'select',
      options: [
        'top',
        'bottom',
        'start',
        'end',
        'corner-top-start',
        'corner-top-end',
        'corner-bottom-start',
        'corner-bottom-end',
      ],
    },
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

/**
 * A corner placement opens the tooltip diagonally outside that corner of the trigger, so it does
 * not cover the content next to it. `start`/`end` follow the direction; with no room above, a top
 * corner flips to the bottom corner on the same side.
 */
export const Corners: Story = {
  render: () => ({
    template: `
      <div style="padding:64px;display:grid;grid-template-columns:repeat(2,max-content);gap:96px 240px;justify-content:center">
        <button ui-button variant="secondary" uiTooltip="Top start" uiTooltipPosition="corner-top-start" uiTooltipShowDelay="0">Plans</button>
        <button ui-button variant="secondary" uiTooltip="Top end" uiTooltipPosition="corner-top-end" uiTooltipShowDelay="0">Owners</button>
        <button ui-button variant="secondary" uiTooltip="Bottom start" uiTooltipPosition="corner-bottom-start" uiTooltipShowDelay="0">Files</button>
        <button ui-button variant="secondary" uiTooltip="Bottom end" uiTooltipPosition="corner-bottom-end" uiTooltipShowDelay="0">Notes</button>
      </div>`,
  }),
  // Hovers every trigger, so the four tooltips stay open together.
  play: async ({ canvasElement }) => {
    for (const trigger of canvasElement.querySelectorAll('button')) {
      trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    }
    const panes = () => Array.from(document.querySelectorAll<HTMLElement>('.ui-tooltip-pane'));
    // The CDK positions each pane after its tooltip renders.
    const placed = () =>
      panes().filter((pane) => [pane.style.top, pane.style.bottom].some(Boolean)).length === 4;
    await until(placed, 'the four tooltips did not open');
  },
};

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

import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UI_OVERLAY_PLACEMENTS } from '@vplans/ui-kit/core';
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
      options: UI_OVERLAY_PLACEMENTS,
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

/**
 * Walks a simulated pointer along the `path`, one point per step, and fires the enter and leave
 * events a real pointer would (a play function has no real pointer, and `elementFromPoint` is what
 * the browser hit-tests with, including the `::before` bridge). Returns how many points are over
 * neither the trigger nor the tooltip: the pointer is on nothing there, and a tooltip with a hide
 * delay of 0 would close.
 */
function walkPointer(trigger: HTMLElement, path: { x: number; y: number }[]): number {
  const over = { trigger: true, tooltip: false };
  let gone = 0;
  for (const { x, y } of path) {
    const target = document.elementFromPoint(x, y);
    const panel = document.querySelector('.ui-tooltip');
    const now = {
      trigger: !!target && trigger.contains(target),
      tooltip: !!target && !!panel?.contains(target),
    };
    if (now.trigger !== over.trigger) {
      trigger.dispatchEvent(
        new PointerEvent(now.trigger ? 'pointerenter' : 'pointerleave', { pointerType: 'mouse' }),
      );
    }
    if (now.tooltip !== over.tooltip) {
      panel?.dispatchEvent(new MouseEvent(now.tooltip ? 'mouseenter' : 'mouseleave'));
    }
    Object.assign(over, now);
    if (!now.trigger && !now.tooltip) gone++;
  }
  return gone;
}

/**
 * The bridge of a corner tooltip: a pointer that leaves the trigger through its corner crosses the
 * gap over the bridge and reaches the tooltip, which stays open (WCAG 1.4.13 hoverable). A pointer
 * that leaves past the bridge, straight up from the trigger, is on nothing and the tooltip closes.
 * The trigger is square: a rounded corner is not the corner of its box (see ticket 05).
 */
export const CornerBridge: Story = {
  render: () => ({
    template: `
      <div style="padding:64px;display:flex;justify-content:center">
        <button ui-button variant="secondary" style="border-radius:0" uiTooltip="Waiting for the owner" uiTooltipPosition="corner-top-start" uiTooltipShowDelay="0">Plans</button>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLButtonElement>('button')!;
    const rtl = getComputedStyle(trigger).direction === 'rtl';
    // The centered trigger moves when the web font loads; the open tooltip would not follow it.
    await document.fonts.ready;
    const pane = () => document.querySelector<HTMLElement>('.ui-tooltip-pane');
    const hover = async () => {
      trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
      // The CDK positions the pane after the tooltip renders.
      await until(
        () => [pane()?.style.top, pane()?.style.bottom].some(Boolean),
        'the tooltip did not open',
      );
    };
    // Points on a line from 4 px inside the trigger, across a corner of its box, to the tooltip.
    const line = (dx: number, dy: number) => {
      const origin = trigger.getBoundingClientRect();
      const gap =
        origin.top - document.querySelector('.ui-tooltip')!.getBoundingClientRect().bottom;
      const inward = rtl ? -1 : 1;
      const x = rtl ? origin.right : origin.left;
      const length = gap + 6;
      return Array.from({ length }, (_, i) => ({
        // Half a pixel inside the edge at the corner: the right edge of a box is not part of it.
        x: x + inward * (4.5 - i * dx),
        y: origin.top + 4 - i * dy,
      }));
    };
    const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

    // Past the bridge: straight up from the trigger, over the space above it.
    await hover();
    const lost = walkPointer(trigger, line(0, 1));
    await settle();
    await expect({ lost: lost > 0, open: pane() !== null }).toEqual({ lost: true, open: false });

    // Through the corner: over the trigger, then over the bridge, then over the tooltip.
    await hover();
    const crossed = walkPointer(trigger, line(1, 1));
    await settle();
    await expect({ lost: crossed, open: pane() !== null }).toEqual({ lost: 0, open: true });
  },
};

/**
 * A `corner-top-start` tooltip on a trigger at the top-start corner of the viewport: no room above
 * and none before it. It flips to `corner-bottom-start` and is pushed back on screen, below the
 * trigger, never over it.
 */
export const CornerAtTheEdge: Story = {
  render: () => ({
    template: `
      <div style="margin:-1rem;min-block-size:8rem">
        <button ui-button variant="secondary" uiTooltip="Waiting for the owner" uiTooltipPosition="corner-top-start" uiTooltipShowDelay="0">Plans</button>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLButtonElement>('button')!;
    trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    const pane = () => document.querySelector<HTMLElement>('.ui-tooltip-pane');
    // The CDK positions the pane after the tooltip renders.
    const placed = () => [pane()?.style.top, pane()?.style.bottom].some(Boolean);
    await until(placed, 'the tooltip did not open');
    const box = pane()!.getBoundingClientRect();
    const origin = trigger.getBoundingClientRect();
    const covers =
      Math.round(box.left) < origin.right &&
      Math.round(box.right) > origin.left &&
      Math.round(box.top) < origin.bottom &&
      Math.round(box.bottom) > origin.top;
    await expect({
      covers,
      placement: pane()!.querySelector('.ui-tooltip--corner-bottom-start') !== null,
    }).toEqual({
      covers: false,
      placement: true,
    });
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

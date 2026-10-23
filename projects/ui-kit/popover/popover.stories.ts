import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { until } from '../.storybook/play';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UI_OVERLAY_PLACEMENTS } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiInput } from '@vplans/ui-kit/input';
import { UiPopoverPosition, UiPopoverTrigger } from './popover';

// Arg names differ from the directive's fields: Storybook writes matching args onto the instance.
interface PopoverArgs {
  placement: UiPopoverPosition;
}

/** The open popover's pane, once the CDK has positioned it. */
async function openPopover(trigger: HTMLElement): Promise<HTMLElement> {
  trigger.click();
  const pane = () => document.querySelector<HTMLElement>('.ui-popover-pane');
  // The CDK positions the pane after the panel renders.
  const placed = () => [pane()?.style.top, pane()?.style.bottom].some(Boolean);
  await until(placed, 'the popover did not open');
  return pane()!;
}

const meta: Meta<PopoverArgs> = {
  title: 'Overlays/Popover',
  component: UiPopoverTrigger,
  decorators: [moduleMetadata({ imports: [UiButton, UiCheckbox, UiFormField, UiIcon, UiInput] })],
  argTypes: {
    placement: { control: 'inline-radio', options: UI_OVERLAY_PLACEMENTS },
  },
};

export default meta;
type Story = StoryObj<PopoverArgs>;

export const Default: Story = {
  args: { placement: 'bottom' },
  render: (args) => ({
    props: args,
    template: `
      <div style="min-block-size:16rem;display:grid;place-items:center">
        <button ui-button variant="secondary" [uiPopoverTriggerFor]="filters" [uiPopoverPosition]="placement">
          <ui-icon icon="filter" /> Filters
        </button>
        <ng-template #filters let-close="close">
          <div style="display:grid;gap:12px;min-inline-size:14rem">
            <ui-checkbox>Only my plans</ui-checkbox>
            <ui-checkbox>Waiting for signature</ui-checkbox>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button ui-button size="sm" variant="secondary" (click)="close()">Cancel</button>
              <button ui-button size="sm" (click)="close()">Apply</button>
            </div>
          </div>
        </ng-template>
      </div>`,
  }),
};

export const WithForm: Story = {
  render: () => ({
    template: `
      <div style="min-block-size:16rem">
        <button ui-button variant="secondary" [uiPopoverTriggerFor]="rename" uiPopoverLabel="Rename the plan">
          Rename
        </button>
        <ng-template #rename let-close="close">
          <div style="display:grid;gap:12px;min-inline-size:16rem">
            <ui-form-field label="Name"><input ui-input value="Tower B, floor 4" /></ui-form-field>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button ui-button size="sm" (click)="close()">Save</button>
            </div>
          </div>
        </ng-template>
      </div>`,
  }),
};

export const Details: Story = {
  render: () => ({
    template: `
      <div style="min-block-size:12rem">
        <button ui-button variant="ghost" [uiPopoverTriggerFor]="details" uiPopoverPosition="end">
          <ui-icon icon="info" /> Signing status
        </button>
        <ng-template #details>
          <p style="margin:0">Waiting for the owner since 22.9.2026. A reminder goes out on Thursday.</p>
        </ng-template>
      </div>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="min-block-size:14rem">
        <button ui-button variant="secondary" [uiPopoverTriggerFor]="he">סינון</button>
        <ng-template #he let-close="close">
          <div style="display:grid;gap:12px">
            <ui-checkbox>רק התוכניות שלי</ui-checkbox>
            <button ui-button size="sm" (click)="close()">החלה</button>
          </div>
        </ng-template>
      </div>`,
  }),
};

/**
 * A popover diagonally outside the top-start corner of its trigger: above it and before its start
 * edge (on the right in RTL), with the gap on the block axis only.
 */
export const Corner: Story = {
  render: () => ({
    template: `
      <div style="min-block-size:16rem;display:grid;place-items:center">
        <button ui-button variant="secondary" [uiPopoverTriggerFor]="corner" uiPopoverPosition="corner-top-start">
          Signing status
        </button>
        <ng-template #corner>
          <p style="margin:0;inline-size:12rem">Waiting for the owner since 22.9.2026.</p>
        </ng-template>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLButtonElement>('button')!;
    // The centered trigger moves when the web font loads; the open popover would not follow it.
    await document.fonts.ready;
    const pane = await openPopover(trigger);
    const box = pane.getBoundingClientRect();
    const panel = pane.querySelector('.ui-popover')!.getBoundingClientRect();
    const origin = trigger.getBoundingClientRect();
    const rtl = getComputedStyle(trigger).direction === 'rtl';
    await expect({
      placement: pane.querySelector('.ui-popover--corner-top-start') !== null,
      // The inline edge meets the trigger's start edge: no inline gap.
      inline: Math.round(rtl ? box.left - origin.right : origin.left - box.right),
      // The pane ends at the trigger's top edge; the panel keeps the gap inside it.
      block: Math.round(origin.top - box.bottom),
      gap: panel.bottom < origin.top,
    }).toEqual({ placement: true, inline: 0, block: 0, gap: true });
  },
};

/** A trigger at one inline edge whose popover does not fit on either side of it. */
const edgeStory = (edge: 'start' | 'end', placement: UiPopoverPosition = 'bottom'): Story => ({
  render: () => ({
    template: `
      <div style="min-block-size:12rem${edge === 'end' ? ';text-align:end' : ''}">
        <button ui-button variant="secondary" [uiPopoverTriggerFor]="edge" uiPopoverPosition="${placement}">Filters</button>
        <ng-template #edge>
          <p style="margin:0;inline-size:18rem">
            Plans waiting for a signature, plans of the current project and drafts.
          </p>
        </ng-template>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLButtonElement>('button')!;
    const pane = await openPopover(trigger);
    // The visible viewport starts after a page scrollbar on the left.
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;inline-size:1rem';
    document.body.append(probe);
    const start = probe.getBoundingClientRect().left;
    const rem = probe.getBoundingClientRect().width;
    probe.remove();
    const rect = pane.getBoundingClientRect();
    const style = getComputedStyle(trigger);
    const end = start + document.documentElement.clientWidth;
    // The gap at the edge the trigger sits at: the inline-start edge is on the right in RTL.
    const atRight = (style.direction === 'rtl') === (edge === 'start');
    const gap = atRight ? end - rect.right : rect.left - start;
    const token = style.getPropertyValue('--ui-popover-viewport-margin').trim();
    const margin = parseFloat(token) * (token.endsWith('rem') ? rem : 1);
    // Pushed over the trigger on the inline axis, it stays above or below it.
    const origin = trigger.getBoundingClientRect();
    const covers = Math.round(rect.bottom) > origin.top && Math.round(rect.top) < origin.bottom;
    await expect({ gap: Math.round(gap), covers }).toEqual({ gap: margin, covers: false });
  },
});

/**
 * A popover that does not fit on either side of a trigger at the start edge is pushed back on
 * screen and keeps the viewport margin, also clear of a page scrollbar on the left.
 */
export const AtTheEdge: Story = edgeStory('start');

/** The same at the end edge: the popover keeps the viewport margin there too. */
export const AtTheEndEdge: Story = edgeStory('end');

/**
 * A `corner-top-start` popover at the start edge: no room above, so it flips to
 * `corner-bottom-start`; no room before the trigger, so it is pushed back on screen over the
 * trigger's inline extent, below it and clear of a page scrollbar on the left.
 */
export const CornerAtTheEdge: Story = edgeStory('start', 'corner-top-start');

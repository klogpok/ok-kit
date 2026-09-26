import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiInput } from '@vplans/ui-kit/input';
import { UiPopoverTrigger } from './popover';

// Arg names differ from the directive's fields: Storybook writes matching args onto the instance.
interface PopoverArgs {
  placement: 'top' | 'bottom' | 'start' | 'end';
}

const meta: Meta<PopoverArgs> = {
  title: 'Overlays/Popover',
  component: UiPopoverTrigger,
  decorators: [moduleMetadata({ imports: [UiButton, UiCheckbox, UiFormField, UiIcon, UiInput] })],
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'start', 'end'] },
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

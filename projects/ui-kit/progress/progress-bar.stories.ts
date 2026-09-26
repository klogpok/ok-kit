import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UiProgressBar } from './progress-bar';

const meta: Meta<UiProgressBar> = {
  title: 'Feedback/Progress bar',
  component: UiProgressBar,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    tone: { control: 'inline-radio', options: ['primary', 'success', 'warning', 'danger'] },
  },
};

export default meta;
type Story = StoryObj<UiProgressBar>;

export const Default: Story = {
  args: { value: 40, max: 100, size: 'md', tone: 'primary', label: 'Uploading plan.pdf' },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width:24rem">
        <ui-progress-bar [value]="value" [max]="max" [size]="size" [tone]="tone" [label]="label" />
      </div>`,
  }),
};

export const Indeterminate: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px;max-width:24rem">
        <ui-progress-bar label="Loading plans" />
        <ui-progress-bar size="sm" label="Loading plans" />
      </div>`,
  }),
};

export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px;max-width:24rem">
        <ui-progress-bar value="60" label="Primary" />
        <ui-progress-bar value="100" tone="success" label="Success" />
        <ui-progress-bar value="85" tone="warning" label="Warning" />
        <ui-progress-bar value="30" tone="danger" label="Danger" />
      </div>`,
  }),
};

/** A visible caption names the bar through `aria-labelledby`. */
export const WithCaption: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:4px;max-width:24rem">
        <div style="display:flex;justify-content:space-between;font-size:14px">
          <span id="upload-caption">Uploading plan.pdf</span><span>3 of 8 MB</span>
        </div>
        <ui-progress-bar value="3" max="8" aria-labelledby="upload-caption" />
      </div>`,
  }),
};

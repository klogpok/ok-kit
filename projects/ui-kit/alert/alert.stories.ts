import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiAlert } from './alert';

type AlertArgs = UiAlert & { text: string };

const meta: Meta<AlertArgs> = {
  title: 'Feedback/Alert',
  component: UiAlert,
  decorators: [moduleMetadata({ imports: [UiButton] })],
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] },
    live: { control: 'inline-radio', options: ['off', 'polite', 'assertive'] },
  },
};

export default meta;
type Story = StoryObj<AlertArgs>;

export const Default: Story = {
  args: {
    tone: 'info',
    title: 'Plan shared',
    text: 'The coordinator can now see the plan and add comments.',
    dismissible: false,
  },
  render: ({ text, ...args }) => ({
    props: args,
    template: `<ui-alert [tone]="tone" [title]="title" [dismissible]="dismissible">${text}</ui-alert>`,
  }),
};

export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px;max-width:40rem">
        <ui-alert tone="info" title="Info">The plan was shared with the coordinator.</ui-alert>
        <ui-alert tone="success" title="Success">The plan was signed.</ui-alert>
        <ui-alert tone="warning" title="Warning">The signing deadline is tomorrow.</ui-alert>
        <ui-alert tone="danger" title="Error">The plan could not be sent. Try again.</ui-alert>
      </div>`,
  }),
};

export const WithoutTitle: Story = {
  render: () => ({
    template: `<ui-alert tone="success" style="max-width:40rem">Your changes were saved.</ui-alert>`,
  }),
};

export const WithActions: Story = {
  render: () => ({
    template: `
      <ui-alert tone="warning" title="The plan is not signed" dismissible style="max-width:40rem">
        Send it to the owner before the deadline on Thursday.
        <button uiAlertActions ui-button size="sm">Send to the owner</button>
        <button uiAlertActions ui-button size="sm" variant="secondary">Remind me later</button>
      </ui-alert>`,
  }),
};

/** Rendered after a user action with `@if`, so screen readers announce it. */
export const Live: StoryObj<{ shown: boolean }> = {
  args: { shown: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:grid;gap:12px;max-width:40rem">
        <div><button ui-button variant="secondary" (click)="shown = !shown">Send</button></div>
        @if (shown) {
          <ui-alert tone="danger" live="assertive" dismissible (dismissed)="shown = false">
            The plan could not be sent. Check your connection and try again.
          </ui-alert>
        }
      </div>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:12px;max-width:40rem">
        <ui-alert tone="info" title="התוכנית נשלחה" dismissible>המתאם יקבל הודעה בדוא״ל.</ui-alert>
        <ui-alert tone="warning">התוכנית ממתינה לחתימה.</ui-alert>
      </div>`,
  }),
};

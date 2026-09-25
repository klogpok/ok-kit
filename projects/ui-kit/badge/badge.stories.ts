import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiBadge } from './badge';

type BadgeArgs = UiBadge & { text: string };

const meta: Meta<BadgeArgs> = {
  title: 'Data display/Badge',
  component: UiBadge,
  decorators: [moduleMetadata({ imports: [UiIcon] })],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'primary', 'success', 'warning', 'danger'],
    },
    appearance: { control: 'inline-radio', options: ['soft', 'solid'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
};

export default meta;
type Story = StoryObj<BadgeArgs>;

// Only the arg-driven story gets args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: { text: 'Pending approval', tone: 'primary', appearance: 'solid', size: 'md' },
  render: ({ text, ...args }) => ({
    props: args,
    template: `<ui-badge [tone]="tone" [appearance]="appearance" [size]="size">${text}</ui-badge>`,
  }),
};

/** The three statuses from the VPlans list screen. */
export const VPlansStatuses: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:flex;gap:8px;flex-wrap:wrap">
        <ui-badge tone="primary">ממתין לאישור מתאם</ui-badge>
        <ui-badge tone="warning">ממתין לחתימה</ui-badge>
        <ui-badge tone="neutral">לא הוגדר לו"ז</ui-badge>
      </div>`,
  }),
};

export const Tones: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px">
        @for (appearance of ['soft', 'solid']; track appearance) {
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            @for (tone of ['neutral', 'primary', 'success', 'warning', 'danger']; track tone) {
              <ui-badge [tone]="$any(tone)" [appearance]="$any(appearance)">{{ tone }}</ui-badge>
            }
          </div>
        }
      </div>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:8px;align-items:center">
        <ui-badge size="sm" tone="primary">Small</ui-badge>
        <ui-badge size="md" tone="primary">Medium</ui-badge>
      </div>`,
  }),
};

export const WithIcon: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:8px">
        <ui-badge tone="success"><ui-icon icon="check" /> Approved</ui-badge>
        <ui-badge tone="danger" appearance="soft"><ui-icon icon="alert-circle" /> Rejected</ui-badge>
      </div>`,
  }),
};

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
      options: ['neutral', 'primary', 'info', 'success', 'warning', 'danger'],
    },
    appearance: { control: 'inline-radio', options: ['soft', 'solid'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
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
            @for (tone of ['neutral', 'primary', 'info', 'success', 'warning', 'danger']; track tone) {
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
        <ui-badge size="lg" tone="primary">Large</ui-badge>
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

/** A number instead of the text; the text stays for screen readers. Above `max` it shows "99+". */
export const Count: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:8px;align-items:center">
        <ui-badge tone="danger" [count]="3">unread messages</ui-badge>
        <ui-badge tone="primary" [count]="42" size="sm">plans to sign</ui-badge>
        <ui-badge tone="neutral" appearance="soft" [count]="250">notifications</ui-badge>
        <ui-badge tone="danger" [count]="12" max="9" size="lg">alerts</ui-badge>
      </div>`,
  }),
};

/** Only a dot in the tone color; the text stays for screen readers. */
export const Dot: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center">
        <span style="display:inline-flex;gap:8px;align-items:center">
          <ui-badge tone="success" dot>Online</ui-badge> Dana Levi
        </span>
        <span style="display:inline-flex;gap:8px;align-items:center">
          <ui-badge tone="danger" dot>New comments</ui-badge> Tower B
        </span>
      </div>`,
  }),
};

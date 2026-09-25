import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiBadge } from '@vplans/ui-kit/badge';
import { UiButton } from '@vplans/ui-kit/button';
import {
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
  UiCardSubtitle,
  UiCardTitle,
} from './card';

const meta: Meta<UiCard> = {
  title: 'Layout/Card',
  component: UiCard,
  decorators: [
    moduleMetadata({
      imports: [
        UiCardHeader,
        UiCardTitle,
        UiCardSubtitle,
        UiCardContent,
        UiCardFooter,
        UiBadge,
        UiButton,
      ],
    }),
  ],
  argTypes: {
    appearance: { control: 'inline-radio', options: ['outlined', 'elevated'] },
    padding: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
  },
  args: { appearance: 'outlined', padding: 'md' },
  render: (args) => ({
    props: args,
    template: `
      <ui-card [appearance]="appearance" [padding]="padding" style="max-inline-size:360px">
        <ui-card-header>
          <h3 ui-card-title>Tower B, floor 4</h3>
          <p ui-card-subtitle>Updated 2 hours ago</p>
          <ui-badge uiCardHeaderAside tone="warning">Awaiting signature</ui-badge>
        </ui-card-header>
        <ui-card-content>
          The plan was sent to the owner for signature. The coordinator approved it yesterday.
        </ui-card-content>
        <ui-card-footer>
          <button ui-button variant="ghost">Details</button>
          <button ui-button>Send reminder</button>
        </ui-card-footer>
      </ui-card>`,
  }),
};

export default meta;
type Story = StoryObj<UiCard>;

export const Outlined: Story = {};
export const Elevated: Story = { args: { appearance: 'elevated' } };

export const ContentOnly: Story = {
  render: () => ({
    template: `
      <ui-card style="max-inline-size:360px">
        <ui-card-content>A simple card with body text only.</ui-card-content>
      </ui-card>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he">
        <ui-card style="max-inline-size:360px">
          <ui-card-header>
            <h3 ui-card-title>בניין ב׳, קומה 4</h3>
            <p ui-card-subtitle>עודכן לפני שעתיים</p>
            <ui-badge uiCardHeaderAside tone="primary">ממתין לאישור מתאם</ui-badge>
          </ui-card-header>
          <ui-card-content>התוכנית נשלחה למתאם לאישור.</ui-card-content>
          <ui-card-footer>
            <button ui-button variant="secondary">ביטול</button>
            <button ui-button>אישור</button>
          </ui-card-footer>
        </ui-card>
      </div>`,
  }),
};

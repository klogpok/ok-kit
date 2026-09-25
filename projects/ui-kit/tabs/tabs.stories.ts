import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiBadge } from '@vplans/ui-kit/badge';
import { UiTabLink, UiTabNav } from './tab-nav';
import { UiTab, UiTabContent, UiTabGroup, UiTabLabel } from './tabs';

const meta: Meta<UiTabGroup> = {
  title: 'Navigation/Tabs',
  component: UiTabGroup,
  decorators: [
    moduleMetadata({ imports: [UiTab, UiTabLabel, UiTabContent, UiBadge, UiTabNav, UiTabLink] }),
  ],
  argTypes: { activation: { control: 'inline-radio', options: ['automatic', 'manual'] } },
  args: { selectedIndex: 0, activation: 'automatic' },
  render: (args) => ({
    props: args,
    template: `
      <ui-tab-group [(selectedIndex)]="selectedIndex" [activation]="activation" aria-label="Plan">
        <ui-tab label="Details">Plan details, owner and address.</ui-tab>
        <ui-tab label="Documents">Uploaded drawings and permits.</ui-tab>
        <ui-tab label="History">Every change made to the plan.</ui-tab>
      </ui-tab-group>`,
  }),
};

export default meta;
type Story = StoryObj<UiTabGroup>;

export const Default: Story = {};
export const ManualActivation: Story = { args: { activation: 'manual' } };

export const WithDisabledTab: Story = {
  render: () => ({
    template: `
      <ui-tab-group aria-label="Plan">
        <ui-tab label="Details">Plan details.</ui-tab>
        <ui-tab label="Billing" disabled>Billing.</ui-tab>
        <ui-tab label="History">History.</ui-tab>
      </ui-tab-group>`,
  }),
};

export const RichLabels: Story = {
  render: () => ({
    template: `
      <ui-tab-group aria-label="Requests">
        <ui-tab>
          <ng-template uiTabLabel>Open <ui-badge size="sm" tone="primary">12</ui-badge></ng-template>
          Open requests.
        </ui-tab>
        <ui-tab>
          <ng-template uiTabLabel>Closed <ui-badge size="sm">48</ui-badge></ng-template>
          <ng-template uiTabContent>Closed requests (created lazily).</ng-template>
        </ui-tab>
      </ui-tab-group>`,
  }),
};

/** Mirrors the VPlans plan screen. */
export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he">
        <ui-tab-group aria-label="תוכנית">
          <ui-tab label="פרטים">פרטי התוכנית.</ui-tab>
          <ui-tab label="מסמכים">מסמכים שהועלו.</ui-tab>
          <ui-tab label="היסטוריה">היסטוריית שינויים.</ui-tab>
        </ui-tab-group>
      </div>`,
  }),
};

export const ManyTabs: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:420px">
        <ui-tab-group aria-label="Floors">
          @for (floor of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track floor) {
            <ui-tab [label]="'Floor ' + floor">Floor {{ floor }} plan.</ui-tab>
          }
        </ui-tab-group>
      </div>`,
  }),
};

/** Tabs as page navigation (`nav[ui-tab-nav]`). In an app, use `routerLink` + `routerLinkActive`. */
export const Navigation: StoryObj<{ current: string }> = {
  args: { current: 'details' },
  render: (args) => ({
    props: args,
    template: `
      <nav ui-tab-nav aria-label="Plan pages">
        @for (page of ['details', 'documents', 'history']; track page) {
          <a ui-tab-link [href]="'#' + page" [active]="current === page" (click)="current = page">
            {{ page }}
          </a>
        }
        <a ui-tab-link href="#billing" disabled>billing</a>
      </nav>`,
  }),
};

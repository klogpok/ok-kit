import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiBreadcrumb, UiBreadcrumbs } from './breadcrumbs';

const meta: Meta<UiBreadcrumbs> = {
  title: 'Navigation/Breadcrumbs',
  component: UiBreadcrumbs,
  decorators: [moduleMetadata({ imports: [UiBreadcrumb] })],
};

export default meta;
type Story = StoryObj<UiBreadcrumbs>;

export const Default: Story = {
  args: { maxItems: 4 },
  render: (args) => ({
    props: args,
    template: `
      <nav ui-breadcrumbs [maxItems]="maxItems">
        <a ui-breadcrumb href="#home">Home</a>
        <a ui-breadcrumb href="#projects">Projects</a>
        <a ui-breadcrumb>Tower B</a>
      </nav>`,
  }),
};

/** Five or more links: the middle ones collapse into a menu after the first link. */
export const Collapsed: Story = {
  render: () => ({
    template: `
      <div style="min-block-size:12rem">
        <nav ui-breadcrumbs>
          <a ui-breadcrumb href="#home">Home</a>
          <a ui-breadcrumb href="#projects">Projects</a>
          <a ui-breadcrumb href="#tower-b">Tower B</a>
          <a ui-breadcrumb href="#floors">Floors</a>
          <a ui-breadcrumb href="#plans">Plans</a>
          <a ui-breadcrumb>Floor 4, north wing</a>
        </nav>
      </div>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="min-block-size:12rem">
        <nav ui-breadcrumbs>
          <a ui-breadcrumb href="#home">ראשי</a>
          <a ui-breadcrumb href="#projects">פרויקטים</a>
          <a ui-breadcrumb href="#tower">מגדל ב׳</a>
          <a ui-breadcrumb href="#plans">תוכניות</a>
          <a ui-breadcrumb>קומה 4</a>
        </nav>
      </div>`,
  }),
};

export const WithRouter: Story = {
  render: () => ({
    template: `
      <nav ui-breadcrumbs>
        <a ui-breadcrumb href="#home">Home</a>
        <a ui-breadcrumb href="#plans">Plans</a>
        <a ui-breadcrumb>Tower B, floor 4</a>
      </nav>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<nav ui-breadcrumbs>
  <a ui-breadcrumb routerLink="/">Home</a>
  <a ui-breadcrumb routerLink="/plans">Plans</a>
  <a ui-breadcrumb>{{ plan.name }}</a>
</nav>`,
      },
    },
  },
};

import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiAvatar, UiAvatarGroup } from './avatar';

// A small inline image, so the story does not depend on the network.
const PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#72b8f2"/><circle cx="20" cy="16" r="7" fill="#0d3d6e"/><path d="M6 40c2-9 8-13 14-13s12 4 14 13z" fill="#0d3d6e"/></svg>',
  );

const NAMES = [
  'Dana Levi',
  'Yossi Peretz',
  'Noa Friedman',
  'David Cohen',
  'Tal Mor',
  'Maya Katz',
  'דנה לוי',
  'יוסי פרץ',
];

const meta: Meta<UiAvatar> = {
  title: 'Data display/Avatar',
  component: UiAvatar,
  decorators: [moduleMetadata({ imports: [UiAvatarGroup] })],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
  },
};

export default meta;
type Story = StoryObj<UiAvatar>;

export const Default: Story = {
  args: { name: 'Dana Levi', size: 'lg', shape: 'circle' },
  render: (args) => ({
    props: args,
    template: `<ui-avatar [name]="name" [size]="size" [shape]="shape" />`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px;align-items:center">
        <ui-avatar name="Dana Levi" size="sm" />
        <ui-avatar name="Dana Levi" size="md" />
        <ui-avatar name="Dana Levi" size="lg" />
        <ui-avatar name="Dana Levi" size="xl" />
      </div>`,
  }),
};

/** Initials and colors come from the name; the same name always gets the same color. */
export const Colors: Story = {
  render: () => ({
    props: { names: NAMES },
    template: `
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        @for (name of names; track name) {
          <ui-avatar [name]="name" size="lg" />
        }
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `@for (user of users; track user.id) {\n  <ui-avatar [name]="user.name" size="lg" />\n}`,
      },
    },
  },
};

export const Image: Story = {
  render: () => ({
    props: { photo: PHOTO },
    template: `
      <div style="display:flex;gap:12px;align-items:center">
        <ui-avatar name="Dana Levi" [src]="photo" size="lg" />
        <ui-avatar name="Dana Levi" [src]="photo" size="lg" shape="square" />
        <!-- A broken image falls back to the initials. -->
        <ui-avatar name="Yossi Peretz" src="data:image/png;base64,broken" size="lg" />
      </div>`,
  }),
  parameters: {
    docs: { source: { code: `<ui-avatar name="Dana Levi" [src]="user.photoUrl" size="lg" />` } },
  },
};

export const Fallbacks: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px;align-items:center">
        <ui-avatar size="lg" />
        <ui-avatar name="Noa" size="lg" />
        <span style="display:inline-flex;gap:8px;align-items:center">
          <ui-avatar name="Tal Mor" decorative /> Tal Mor
        </span>
      </div>`,
  }),
};

export const Group: Story = {
  render: () => ({
    props: { names: NAMES },
    template: `
      <div style="display:grid;gap:16px">
        <ui-avatar-group max="4" aria-label="Coordinators">
          @for (name of names; track name) {
            <ui-avatar [name]="name" />
          }
        </ui-avatar-group>
        <ui-avatar-group size="lg" max="3" aria-label="Owners">
          @for (name of names; track name) {
            <ui-avatar [name]="name" />
          }
        </ui-avatar-group>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-avatar-group max="4" aria-label="Coordinators">\n  @for (user of users; track user.id) {\n    <ui-avatar [name]="user.name" [src]="user.photo" />\n  }\n</ui-avatar-group>`,
      },
    },
  },
};

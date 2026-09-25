import { argsToTemplate, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiIcon } from './icon';
import { UI_ICONS_ALL } from './icons';

const meta: Meta<UiIcon> = {
  title: 'Foundations/Icon',
  component: UiIcon,
  argTypes: {
    icon: { control: 'select', options: UI_ICONS_ALL.map((i) => i.name) },
    size: { control: 'inline-radio', options: ['inherit', 'sm', 'md', 'lg'] },
  },
  args: { icon: 'check', size: 'lg', label: '', flipRtl: false },
  render: (args) => ({ props: args, template: `<ui-icon ${argsToTemplate(args)} />` }),
};

export default meta;
type Story = StoryObj<UiIcon>;

export const Default: Story = {};
export const Labelled: Story = { args: { icon: 'alert-circle', label: 'Error' } };

export const Gallery: Story = {
  // The icon list is built in code, so a docs snippet cannot show it.
  parameters: { docs: { source: { code: null } } },
  render: () => ({
    props: { icons: UI_ICONS_ALL.map((i) => i.name) },
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:16px">
        @for (name of icons; track name) {
          <div style="display:grid;justify-items:center;gap:8px;padding:12px;border:1px solid var(--ui-color-border);border-radius:var(--ui-radius-container)">
            <ui-icon [icon]="name" size="lg" />
            <code class="ui-caption">{{ name }}</code>
          </div>
        }
      </div>`,
  }),
};

export const RtlFlip: Story = {
  globals: { dir: 'rtl' },
  render: () => ({
    template: `
      <div style="display:flex;gap:24px;align-items:center" class="ui-body">
        <span><ui-icon icon="arrow-right" size="lg" /> no flip</span>
        <span><ui-icon icon="arrow-right" size="lg" flipRtl /> flipRtl</span>
      </div>`,
  }),
};

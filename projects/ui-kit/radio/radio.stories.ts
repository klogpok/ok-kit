import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiRadio, UiRadioGroup } from './radio';

type RadioArgs = UiRadioGroup<string>;

const meta: Meta<RadioArgs> = {
  title: 'Forms/Radio group',
  component: UiRadioGroup,
  decorators: [moduleMetadata({ imports: [UiRadio, UiFormField, UiError] })],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    value: { control: 'inline-radio', options: [null, 'standard', 'express', 'pickup'] },
  },
  args: { value: 'standard', orientation: 'vertical', size: 'md', disabled: false, invalid: false },
  render: (args) => ({
    props: args,
    template: `
      <ui-form-field label="Delivery method">
        <ui-radio-group ${argsToTemplate(args)}>
          <ui-radio value="standard">Standard (3–5 days)</ui-radio>
          <ui-radio value="express">Express (next day)</ui-radio>
          <ui-radio value="pickup" disabled>Store pickup (unavailable)</ui-radio>
        </ui-radio-group>
      </ui-form-field>`,
  }),
};

export default meta;
type Story = StoryObj<RadioArgs>;

export const Default: Story = {};
export const Horizontal: Story = { args: { orientation: 'horizontal' } };
export const NoSelection: Story = { args: { value: null } };
export const Disabled: Story = { args: { disabled: true } };

export const Invalid: Story = {
  render: () => ({
    template: `
      <ui-form-field label="Payment">
        <ui-radio-group invalid>
          <ui-radio value="card">Card</ui-radio>
          <ui-radio value="invoice">Invoice</ui-radio>
        </ui-radio-group>
        <ui-error>Choose a payment method</ui-error>
      </ui-form-field>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:24px">
        @for (s of ['sm', 'md', 'lg']; track s) {
          <ui-radio-group [size]="$any(s)" value="a" orientation="horizontal" [attr.aria-label]="s">
            <ui-radio value="a">Option A</ui-radio>
            <ui-radio value="b">Option B</ui-radio>
          </ui-radio-group>
        }
      </div>`,
  }),
};

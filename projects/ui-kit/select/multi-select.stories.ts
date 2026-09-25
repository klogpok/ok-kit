import { JsonPipe } from '@angular/common';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiMultiSelect } from './multi-select';
import { UiOption, UiOptionGroup } from './option';

type MultiSelectArgs = UiMultiSelect<string> & { label: string; hint: string };

const meta: Meta<MultiSelectArgs> = {
  title: 'Forms/Multi-select',
  component: UiMultiSelect,
  decorators: [moduleMetadata({ imports: [UiOption, UiOptionGroup, UiFormField, JsonPipe] })],
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
};

export default meta;
type Story = StoryObj<MultiSelectArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'Coordinators',
    hint: 'Everyone chosen gets the plan for approval',
    placeholder: 'Choose coordinators',
    value: [],
    size: 'md',
    disabled: false,
    invalid: false,
    searchable: false,
  },
  render: ({ label, hint, ...args }) => ({
    props: args,
    template: `
      <div style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field [label]="'${label}'" [hint]="'${hint}'">
          <ui-multi-select
            [(value)]="value"
            [placeholder]="placeholder"
            [size]="size"
            [disabled]="disabled"
            [invalid]="invalid"
            [searchable]="searchable"
          >
            @for (name of ['Dana Levi', 'David Cohen', 'Yael Mizrahi', 'Yossi Peretz', 'Noa Friedman']; track name) {
              <ui-option [value]="name" [disabled]="name === 'David Cohen'">{{ name }}</ui-option>
            }
          </ui-multi-select>
        </ui-form-field>
        <p>Value: {{ value | json }}</p>
      </div>`,
  }),
};
export const WithValue: Story = {
  ...Default,
  args: { ...Default.args, value: ['Dana Levi', 'Noa Friedman'] },
};
export const Searchable: Story = { ...Default, args: { ...Default.args, searchable: true } };
export const Disabled: Story = {
  ...Default,
  args: { ...Default.args, disabled: true, value: ['Dana Levi'] },
};
export const Invalid: Story = { ...Default, args: { ...Default.args, invalid: true } };

export const Groups: Story = {
  args: { value: ['a2'] },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field label="Floors">
          <ui-multi-select [(value)]="value" placeholder="Choose floors">
            <ui-option-group label="Tower A">
              <ui-option value="a1">Floor 1</ui-option>
              <ui-option value="a2">Floor 2</ui-option>
            </ui-option-group>
            <ui-option-group label="Tower B">
              <ui-option value="b1">Floor 1</ui-option>
              <ui-option value="b2">Floor 2</ui-option>
            </ui-option-group>
          </ui-multi-select>
        </ui-form-field>
      </div>`,
  }),
};

export const Hebrew: Story = {
  args: { value: ['owner'] },
  render: (args) => ({
    props: args,
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field label="נמענים">
          <ui-multi-select [(value)]="value" placeholder="בחירה" searchable>
            <ui-option value="owner">בעלים</ui-option>
            <ui-option value="coordinator">מתאם</ui-option>
            <ui-option value="architect">אדריכל</ui-option>
          </ui-multi-select>
        </ui-form-field>
      </div>`,
  }),
};

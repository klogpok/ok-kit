import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiOption, UiOptionGroup } from './option';
import { UiSelect } from './select';

type SelectArgs = UiSelect<string> & { label: string; hint: string };

const meta: Meta<SelectArgs> = {
  title: 'Forms/Select',
  component: UiSelect,
  decorators: [moduleMetadata({ imports: [UiOption, UiOptionGroup, UiFormField] })],
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
};

export default meta;
type Story = StoryObj<SelectArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'Coordinator',
    hint: 'Approves the plan before signing',
    placeholder: 'Choose a coordinator',
    value: null,
    size: 'md',
    disabled: false,
    invalid: false,
    searchable: false,
  },
  render: ({ label, hint, ...args }) => ({
    props: args,
    template: `
      <div style="max-inline-size:320px">
        <ui-form-field [label]="'${label}'" [hint]="'${hint}'">
          <ui-select
            [(value)]="value"
            [placeholder]="placeholder"
            [size]="size"
            [disabled]="disabled"
            [invalid]="invalid"
            [searchable]="searchable"
          >
            @for (name of ['Dana Levi', 'David Cohen', 'Yael Mizrahi', 'Yossi Peretz', 'Noa Friedman']; track name) {
              <ui-option [value]="name">{{ name }}</ui-option>
            }
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};
export const WithValue: Story = { ...Default, args: { ...Default.args, value: 'Yael Mizrahi' } };
export const Searchable: Story = { ...Default, args: { ...Default.args, searchable: true } };
export const Disabled: Story = {
  ...Default,
  args: { ...Default.args, disabled: true, value: 'Dana Levi' },
};
export const Invalid: Story = { ...Default, args: { ...Default.args, invalid: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px;max-inline-size:320px">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <ui-select [size]="$any(size)" [aria-label]="'Size ' + size" [placeholder]="size">
            <ui-option value="a">Option A</ui-option>
            <ui-option value="b">Option B</ui-option>
          </ui-select>
        }
      </div>`,
  }),
};

export const GroupsAndDisabledOptions: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:320px">
        <ui-form-field label="Floor">
          <ui-select placeholder="Choose a floor">
            <ui-option-group label="Tower A">
              <ui-option value="a1">Floor 1</ui-option>
              <ui-option value="a2">Floor 2</ui-option>
              <ui-option value="a3" disabled>Floor 3 (locked)</ui-option>
            </ui-option-group>
            <ui-option-group label="Tower B">
              <ui-option value="b1">Floor 1</ui-option>
              <ui-option value="b2">Floor 2</ui-option>
            </ui-option-group>
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px">
        <ui-form-field label="סטטוס">
          <ui-select placeholder="בחירת סטטוס" searchable>
            <ui-option value="pending">ממתין לאישור מתאם</ui-option>
            <ui-option value="signing">ממתין לחתימה</ui-option>
            <ui-option value="none">לא הוגדר לו"ז</ui-option>
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};

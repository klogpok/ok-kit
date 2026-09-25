import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiError, UiFormField, UiHint, UiPrefix, UiSuffix } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiInput } from './input';
import { UiTextarea } from './textarea';

type InputArgs = UiInput & { placeholder: string; disabled: boolean; readonly: boolean };

const meta: Meta<InputArgs> = {
  title: 'Forms/Input',
  component: UiInput,
  decorators: [
    moduleMetadata({
      imports: [
        UiFormField,
        UiHint,
        UiError,
        UiTextarea,
        UiPrefix,
        UiSuffix,
        UiIcon,
        UiIconButton,
        UiButton,
      ],
    }),
  ],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    size: 'md',
    invalid: false,
    placeholder: 'you@company.com',
    disabled: false,
    readonly: false,
  },
  render: ({ placeholder, disabled, readonly, ...args }) => ({
    props: { ...args, placeholder, disabled, readonly },
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field label="Email">
          <input ui-input ${argsToTemplate(args)} [placeholder]="placeholder" [disabled]="disabled" [readOnly]="readonly" />
        </ui-form-field>
      </div>`,
  }),
};

export default meta;
type Story = StoryObj<InputArgs>;

export const Default: Story = {};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
export const Readonly: Story = { args: { readonly: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px;max-inline-size:360px">
        <input ui-input size="sm" placeholder="Small" aria-label="Small" />
        <input ui-input size="md" placeholder="Medium" aria-label="Medium" />
        <input ui-input size="lg" placeholder="Large" aria-label="Large" />
      </div>`,
  }),
};

export const Textarea: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px;max-inline-size:360px">
        <ui-form-field label="Comment" hint="Fixed height, resizable">
          <textarea ui-textarea rows="3"></textarea>
        </ui-form-field>
        <ui-form-field label="Notes" hint="Grows from 2 to 6 rows">
          <textarea ui-textarea autosize [minRows]="2" [maxRows]="6"></textarea>
        </ui-form-field>
      </div>`,
  }),
};

export const Hebrew: Story = {
  globals: { dir: 'rtl' },
  render: () => ({
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field label="שם מלא" hint="כפי שמופיע בתעודת הזהות">
          <input ui-input placeholder="ישראל ישראלי" />
        </ui-form-field>
      </div>`,
  }),
};

const affixesTemplate = `
  <div style="display:grid;gap:16px;max-inline-size:360px">
    <ui-form-field label="Search">
      <ui-icon uiPrefix icon="search" />
      <input ui-input type="search" placeholder="Project, customer, address" />
    </ui-form-field>
    <ui-form-field label="Password" hint="At least 8 characters">
      <input ui-input [type]="visible ? 'text' : 'password'" value="secret-pass" />
      <button uiSuffix ui-icon-button size="sm" type="button"
        [label]="visible ? 'Hide password' : 'Show password'" (click)="visible = !visible">
        <ui-icon [icon]="visible ? 'eye-off' : 'eye'" />
      </button>
    </ui-form-field>
    <ui-form-field label="Price">
      <span uiPrefix>₪</span>
      <input ui-input inputmode="decimal" value="1,250" />
      <span uiSuffix>per month</span>
    </ui-form-field>
    <ui-form-field label="Area">
      <input ui-input inputmode="decimal" value="120" invalid />
      <span uiSuffix>m²</span>
      <ui-error>Area exceeds the plot size</ui-error>
    </ui-form-field>
    <ui-form-field label="Disabled">
      <ui-icon uiPrefix icon="calendar" />
      <input ui-input value="12/07/2026" disabled />
    </ui-form-field>
  </div>`;

export const PrefixAndSuffix: Story = {
  render: () => ({ props: { visible: false }, template: affixesTemplate }),
};

export const PrefixAndSuffixRtl: Story = {
  globals: { dir: 'rtl' },
  render: () => ({ props: { visible: false }, template: affixesTemplate }),
};

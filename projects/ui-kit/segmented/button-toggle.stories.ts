import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiButtonToggle, UiButtonToggleGroup } from './button-toggle';

interface ButtonToggleArgs {
  label: string;
  days: string[];
  controlSize: 'sm' | 'md' | 'lg';
  fullWidthArg: boolean;
  disabledArg: boolean;
  readonlyArg: boolean;
}

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<ButtonToggleArgs> = {
  title: 'Forms/Button toggle group',
  component: UiButtonToggleGroup,
  decorators: [moduleMetadata({ imports: [UiButtonToggle, UiFormField, UiError, UiIcon] })],
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<ButtonToggleArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'ימי ביקור',
    days: ['sun', 'tue'],
    controlSize: 'md',
    fullWidthArg: false,
    disabledArg: false,
    readonlyArg: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-form-field [label]="label" hint="אפשר לבחור כמה ימים">
        <ui-button-toggle-group
          [(value)]="days"
          [size]="controlSize"
          [fullWidth]="fullWidthArg"
          [disabled]="disabledArg"
          [readonly]="readonlyArg"
        >
          <button ui-button-toggle value="sun">ראשון</button>
          <button ui-button-toggle value="mon">שני</button>
          <button ui-button-toggle value="tue">שלישי</button>
          <button ui-button-toggle value="wed">רביעי</button>
          <button ui-button-toggle value="thu">חמישי</button>
        </ui-button-toggle-group>
      </ui-form-field>
      <p>{{ days.join(', ') || 'ללא בחירה' }}</p>`,
  }),
};
export const Disabled: Story = { ...Default, args: { ...Default.args, disabledArg: true } };
export const Readonly: Story = { ...Default, args: { ...Default.args, readonlyArg: true } };
export const FullWidth: Story = { ...Default, args: { ...Default.args, fullWidthArg: true } };

export const Invalid: Story = {
  render: () => ({
    template: `
      <ui-form-field label="שכבות בתוכנית">
        <ui-button-toggle-group invalid>
          <button ui-button-toggle value="walls">קירות</button>
          <button ui-button-toggle value="plumbing">אינסטלציה</button>
          <button ui-button-toggle value="electric">חשמל</button>
        </ui-button-toggle-group>
        <ui-error>יש לבחור שכבה אחת לפחות</ui-error>
      </ui-form-field>`,
  }),
};

export const DisabledToggle: Story = {
  render: () => ({
    template: `
      <ui-button-toggle-group aria-label="ערוצי עדכון" [value]="['sms']">
        <button ui-button-toggle value="sms">SMS</button>
        <button ui-button-toggle value="email">דוא״ל</button>
        <button ui-button-toggle value="whatsapp" disabled>WhatsApp</button>
      </ui-button-toggle-group>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px;justify-items:start">
        @for (s of ['sm', 'md', 'lg']; track s) {
          <ui-button-toggle-group [size]="$any(s)" [value]="['a']" [attr.aria-label]="s">
            <button ui-button-toggle value="a">פתוחות</button>
            <button ui-button-toggle value="b">בטיפול</button>
            <button ui-button-toggle value="c">סגורות</button>
          </ui-button-toggle-group>
        }
      </div>`,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    template: `
      <ui-button-toggle-group aria-label="הצג" [value]="['files']">
        <button ui-button-toggle value="files"><ui-icon icon="file" />קבצים</button>
        <button ui-button-toggle value="team"><ui-icon icon="users" />צוות</button>
        <button ui-button-toggle value="alerts"><ui-icon icon="bell" />התראות</button>
      </ui-button-toggle-group>`,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `
      <ui-form-field label="שכבות בתוכנית">
        <ui-button-toggle-group orientation="vertical" [value]="['walls', 'electric']">
          <button ui-button-toggle value="walls">קירות</button>
          <button ui-button-toggle value="plumbing">אינסטלציה</button>
          <button ui-button-toggle value="electric">חשמל</button>
        </ui-button-toggle-group>
      </ui-form-field>`,
  }),
};

import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiDatepicker } from './datepicker';

interface DatepickerArgs {
  label: string;
  hint: string;
  disabledArg: boolean;
  invalidArg: boolean;
  controlSize: 'sm' | 'md' | 'lg';
}

const today = new Date();
const inDays = (days: number) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<DatepickerArgs> = {
  title: 'Forms/Date picker',
  component: UiDatepicker,
  decorators: [moduleMetadata({ imports: [UiFormField] })],
  argTypes: { controlSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  args: {
    label: 'תאריך חתימה',
    hint: 'אפשר להקליד או לבחור מהלוח',
    disabledArg: false,
    invalidArg: false,
    controlSize: 'md',
  },
  render: (args) => ({
    props: { ...args, value: null },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px;min-block-size:26rem">
        <ui-form-field [label]="label" [hint]="hint">
          <ui-datepicker
            [(value)]="value"
            [disabled]="disabledArg"
            [invalid]="invalidArg"
            [size]="controlSize"
          />
        </ui-form-field>
        <p>{{ value ? value.toDateString() : 'No date' }}</p>
      </div>`,
  }),
};

export default meta;
type Story = StoryObj<DatepickerArgs>;

export const Default: Story = {};

export const WithValue: Story = {
  render: () => ({
    props: { value: new Date(2026, 8, 25) },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px;min-block-size:26rem">
        <ui-form-field label="תאריך חתימה"><ui-datepicker [(value)]="value" /></ui-form-field>
      </div>`,
  }),
};

/** Only the next 30 working days (Sunday–Thursday) can be picked or typed. */
export const MinMaxAndFilter: Story = {
  render: () => ({
    props: {
      value: null,
      min: today,
      max: inDays(30),
      workdays: (d: Date) => d.getDay() !== 5 && d.getDay() !== 6,
    },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px;min-block-size:26rem">
        <ui-form-field label="מועד פגישה" hint="ימים א׳–ה׳ בחודש הקרוב">
          <ui-datepicker [(value)]="value" [min]="min" [max]="max" [dateFilter]="workdays" />
        </ui-form-field>
      </div>`,
  }),
};

export const Disabled: Story = { args: { disabledArg: true } };

export const Invalid: Story = { args: { invalidArg: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:12px;max-inline-size:320px">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <ui-datepicker [size]="$any(size)" [aria-label]="'תאריך ' + size" />
        }
      </div>`,
  }),
};

/** English texts and US date order (MM/DD/YYYY). */
export const English: Story = {
  decorators: [applicationConfig({ providers: [provideUiLabels(UI_LABELS_EN)] })],
  render: () => ({
    props: { value: new Date(2026, 8, 25) },
    template: `
      <div dir="ltr" lang="en" style="max-inline-size:320px;min-block-size:26rem">
        <ui-form-field label="Signing date"><ui-datepicker [(value)]="value" /></ui-form-field>
      </div>`,
  }),
};

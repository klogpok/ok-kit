import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiFormField, UiPrefix, UiSuffix } from '@vplans/ui-kit/form-field';
import { UiNumberInput } from './number-input';

interface NumberInputArgs {
  label: string;
  hintText: string;
  minValue: number;
  maxValue: number;
  stepValue: number;
  disabledArg: boolean;
  readonlyArg: boolean;
  invalidArg: boolean;
  controlSize: 'sm' | 'md' | 'lg';
  amount: number | null;
}

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<NumberInputArgs> = {
  title: 'Forms/Number input',
  component: UiNumberInput,
  decorators: [moduleMetadata({ imports: [UiFormField, UiPrefix, UiSuffix] })],
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<NumberInputArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'מספר יחידות',
    hintText: 'בין 1 ל-500',
    minValue: 1,
    maxValue: 500,
    stepValue: 1,
    disabledArg: false,
    readonlyArg: false,
    invalidArg: false,
    controlSize: 'md',
    amount: 24,
  },
  render: (args) => ({
    props: args,
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px">
        <ui-form-field [label]="label" [hint]="hintText">
          <ui-number-input
            [(value)]="amount"
            [min]="minValue"
            [max]="maxValue"
            [step]="stepValue"
            [disabled]="disabledArg"
            [readonly]="readonlyArg"
            [invalid]="invalidArg"
            [size]="controlSize"
          />
        </ui-form-field>
        <p>{{ amount ?? 'ללא ערך' }}</p>
      </div>`,
  }),
};

/** Units and currency go into the field border with `uiPrefix` / `uiSuffix`. */
export const WithAffixes: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:16px;max-inline-size:320px">
        <ui-form-field label="שטח">
          <ui-number-input [value]="86.5" min="0" maxFractionDigits="2" />
          <span uiSuffix>מ״ר</span>
        </ui-form-field>
        <ui-form-field label="מחיר">
          <span uiPrefix>₪</span>
          <ui-number-input [value]="1250000" min="0" step="1000" [steppers]="false" />
        </ui-form-field>
      </div>`,
  }),
};

/** `minFractionDigits` keeps two digits for prices; the step can be a fraction. */
export const Decimals: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:16px;max-inline-size:320px">
        <ui-form-field label="מחיר ליחידה">
          <ui-number-input [value]="12.5" min="0" step="0.25" minFractionDigits="2" maxFractionDigits="2" />
        </ui-form-field>
        <ui-form-field label="שיפוע (%)">
          <ui-number-input [value]="-1.5" min="-10" max="10" step="0.5" inputmode="text" />
        </ui-form-field>
      </div>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:16px;max-inline-size:320px">
        <ui-number-input size="sm" aria-label="קטן" [value]="1" />
        <ui-number-input size="md" aria-label="בינוני" [value]="2" />
        <ui-number-input size="lg" aria-label="גדול" [value]="3" />
      </div>`,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:16px;max-inline-size:320px">
        <ui-form-field label="מושבת"><ui-number-input disabled [value]="4" /></ui-form-field>
        <ui-form-field label="לקריאה בלבד"><ui-number-input readonly [value]="4" /></ui-form-field>
        <ui-form-field label="שגוי"><ui-number-input invalid [value]="0" min="1" /></ui-form-field>
        <ui-form-field label="בגבול העליון"><ui-number-input [value]="10" max="10" /></ui-form-field>
      </div>`,
  }),
};

/** Without steppers and group separators, e.g. for an id-like number. */
export const WithoutSteppers: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px">
        <ui-form-field label="מספר היתר">
          <ui-number-input [steppers]="false" [grouping]="false" maxFractionDigits="0" [value]="20260925" />
        </ui-form-field>
      </div>`,
  }),
};

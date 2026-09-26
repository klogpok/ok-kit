import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiRangeSlider, UiSlider } from './slider';

interface SliderArgs {
  label: string;
  hintText: string;
  minValue: number;
  maxValue: number;
  stepValue: number;
  showMarks: boolean;
  disabledArg: boolean;
  readonlyArg: boolean;
  invalidArg: boolean;
  controlSize: 'sm' | 'md' | 'lg';
  amount: number | null;
}

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<SliderArgs> = {
  title: 'Forms/Slider',
  component: UiSlider,
  decorators: [moduleMetadata({ imports: [UiFormField, UiRangeSlider] })],
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<SliderArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'שקיפות',
    hintText: 'באחוזים',
    minValue: 0,
    maxValue: 100,
    stepValue: 10,
    showMarks: false,
    disabledArg: false,
    readonlyArg: false,
    invalidArg: false,
    controlSize: 'md',
    amount: 40,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field [label]="label" [hint]="hintText">
          <ui-slider
            [(value)]="amount"
            [min]="minValue"
            [max]="maxValue"
            [step]="stepValue"
            [marks]="showMarks"
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
export const Ticks: Story = { ...Default, args: { ...Default.args, showMarks: true } };
export const Disabled: Story = { ...Default, args: { ...Default.args, disabledArg: true } };
export const Readonly: Story = { ...Default, args: { ...Default.args, readonlyArg: true } };
export const Invalid: Story = { ...Default, args: { ...Default.args, invalidArg: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px;max-inline-size:360px">
        <ui-slider aria-label="קטן" size="sm" [value]="30" />
        <ui-slider aria-label="בינוני" size="md" [value]="50" />
        <ui-slider aria-label="גדול" size="lg" [value]="70" />
      </div>`,
  }),
};

/** Marks with labels; screen readers read the label of the mark at the value. */
export const LabelledMarks: Story = {
  render: () => ({
    props: {
      marks: [
        { value: 0, label: 'נמוכה' },
        { value: 50, label: 'בינונית' },
        { value: 100, label: 'גבוהה' },
      ],
    },
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field label="עדיפות">
          <ui-slider [value]="50" step="50" [marks]="marks" />
        </ui-form-field>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-slider [(value)]="priority" step="50"
  [marks]="[{ value: 0, label: 'נמוכה' }, { value: 50, label: 'בינונית' }, { value: 100, label: 'גבוהה' }]" />`,
      },
    },
  },
};

/** `valueText` sets what screen readers read, e.g. with the currency. */
export const Range: Story = {
  render: () => ({
    props: {
      price: [1200, 3800],
      priceText: (value: number) => `${value.toLocaleString('he-IL')} ₪`,
    },
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field label="מחיר לחודש" hint="עד 5,000 ₪">
          <ui-range-slider [(value)]="price" [limits]="[0, 5000]" step="100" [valueText]="priceText" />
        </ui-form-field>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-form-field label="מחיר לחודש">
  <ui-range-slider [(value)]="price" [limits]="[0, 5000]" step="100"
    [valueText]="(v) => v + ' ₪'" />
</ui-form-field>`,
      },
    },
  },
};

export const RangeWithMarks: Story = {
  render: () => ({
    props: {
      marks: [1, 5, 10, 15, 20].map((value) => ({ value, label: String(value) })),
    },
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field label="קומות">
          <ui-range-slider [value]="[5, 15]" min="1" max="20" [marks]="marks" />
        </ui-form-field>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-range-slider [(value)]="floors" min="1" max="20"
  [marks]="[1, 5, 10, 15, 20].map((value) => ({ value, label: '' + value }))" />`,
      },
    },
  },
};

export const RangeDisabled: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:360px">
        <ui-range-slider aria-label="שטח" [value]="[20, 60]" disabled />
      </div>`,
  }),
};

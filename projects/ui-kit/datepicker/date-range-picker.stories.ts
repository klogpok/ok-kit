import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiDateRangePicker, UiDateRangePreset } from './date-range-picker';

interface DateRangePickerArgs {
  label: string;
  hintText: string;
  disabledArg: boolean;
  readonlyArg: boolean;
  invalidArg: boolean;
  controlSize: 'sm' | 'md' | 'lg';
}

const lastDays =
  (days: number): UiDateRangePreset['range'] =>
  () => {
    const end = new Date();
    return { start: new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1), end };
  };

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<DateRangePickerArgs> = {
  title: 'Forms/Date range picker',
  component: UiDateRangePicker,
  decorators: [moduleMetadata({ imports: [UiFormField] })],
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<DateRangePickerArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'תקופת הדוח',
    hintText: 'אפשר להקליד או לבחור מהלוח',
    disabledArg: false,
    readonlyArg: false,
    invalidArg: false,
    controlSize: 'md',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size:360px;min-block-size:28rem">
        <ui-form-field [label]="label" [hint]="hintText">
          <ui-date-range-picker
            [disabled]="disabledArg"
            [readonly]="readonlyArg"
            [invalid]="invalidArg"
            [size]="controlSize"
          />
        </ui-form-field>
      </div>`,
  }),
};

// Dates and functions are not literals, so the docs snippet cannot be derived; these stories spell it out.
export const WithValue: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UiDateRange, UiDateRangePicker } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';

@Component({
  selector: 'app-demo',
  imports: [UiDateRangePicker, UiFormField],
  template: \`
    <ui-form-field label="תקופת הדוח">
      <ui-date-range-picker [(value)]="period" />
    </ui-form-field>
    <p>{{ period?.start?.toDateString() }} – {{ period?.end?.toDateString() }}</p>\`,
})
export class DemoComponent {
  period: UiDateRange | null = { start: new Date(2026, 8, 20), end: new Date(2026, 9, 6) };
}`,
      },
    },
  },
  render: () => ({
    props: { period: { start: new Date(2026, 8, 20), end: new Date(2026, 9, 6) } },
    template: `
      <div style="max-inline-size:360px;min-block-size:28rem">
        <ui-form-field label="תקופת הדוח">
          <ui-date-range-picker [(value)]="period" />
        </ui-form-field>
        <p>{{ period?.start?.toDateString() }} – {{ period?.end?.toDateString() }}</p>
      </div>`,
  }),
};

/** Quick picks next to the calendar; ranges relative to today are functions. */
export const Presets: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UiDateRange, UiDateRangePicker, UiDateRangePreset } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';

const lastDays = (days: number): UiDateRangePreset['range'] => () => {
  const end = new Date();
  return { start: new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1), end };
};

@Component({
  selector: 'app-demo',
  imports: [UiDateRangePicker, UiFormField],
  template: \`
    <ui-form-field label="תקופת הדוח">
      <ui-date-range-picker [(value)]="period" [presets]="presets" [maxDate]="today" />
    </ui-form-field>\`,
})
export class DemoComponent {
  period: UiDateRange | null = null;
  today = new Date();
  presets: UiDateRangePreset[] = [
    { label: '7 הימים האחרונים', range: lastDays(7) },
    { label: '30 הימים האחרונים', range: lastDays(30) },
    { label: 'רבעון 3', range: { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30) } },
  ];
}`,
      },
    },
  },
  render: () => ({
    props: {
      period: null,
      today: new Date(),
      presets: [
        { label: '7 הימים האחרונים', range: lastDays(7) },
        { label: '30 הימים האחרונים', range: lastDays(30) },
        { label: 'רבעון 3', range: { start: new Date(2026, 6, 1), end: new Date(2026, 8, 30) } },
      ],
    },
    template: `
      <div style="max-inline-size:360px;min-block-size:28rem">
        <ui-form-field label="תקופת הדוח">
          <ui-date-range-picker [(value)]="period" [presets]="presets" [maxDate]="today" />
        </ui-form-field>
      </div>`,
  }),
};

/** Only days in September and October 2026 can be picked or typed. */
export const MinMax: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UiDateRangePicker } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';

@Component({
  selector: 'app-demo',
  imports: [UiDateRangePicker, UiFormField],
  template: \`
    <ui-form-field label="חופשה" hint="ספטמבר–אוקטובר 2026">
      <ui-date-range-picker [minDate]="min" [maxDate]="max" />
    </ui-form-field>\`,
})
export class DemoComponent {
  min = new Date(2026, 8, 1);
  max = new Date(2026, 9, 31);
}`,
      },
    },
  },
  render: () => ({
    props: { min: new Date(2026, 8, 1), max: new Date(2026, 9, 31) },
    template: `
      <div style="max-inline-size:360px;min-block-size:28rem">
        <ui-form-field label="חופשה" hint="ספטמבר–אוקטובר 2026">
          <ui-date-range-picker [minDate]="min" [maxDate]="max" />
        </ui-form-field>
      </div>`,
  }),
};

export const Disabled: Story = { ...Default, args: { ...Default.args, disabledArg: true } };

export const Readonly: Story = { ...Default, args: { ...Default.args, readonlyArg: true } };

export const Invalid: Story = { ...Default, args: { ...Default.args, invalidArg: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px;max-inline-size:360px">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <ui-date-range-picker [size]="$any(size)" [aria-label]="'תקופה ' + size" />
        }
      </div>`,
  }),
};

/** English texts and US date order (MM/DD/YYYY). */
export const English: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiDateRange, UiDateRangePicker } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';

@Component({
  selector: 'app-demo',
  imports: [UiDateRangePicker, UiFormField],
  providers: [provideUiLabels(UI_LABELS_EN)],
  template: \`
    <div dir="ltr" lang="en">
      <ui-form-field label="Stay"><ui-date-range-picker [(value)]="stay" /></ui-form-field>
    </div>\`,
})
export class DemoComponent {
  stay: UiDateRange | null = { start: new Date(2026, 8, 25), end: new Date(2026, 8, 28) };
}`,
      },
    },
  },
  decorators: [applicationConfig({ providers: [provideUiLabels(UI_LABELS_EN)] })],
  render: () => ({
    props: { stay: { start: new Date(2026, 8, 25), end: new Date(2026, 8, 28) } },
    template: `
      <div dir="ltr" lang="en" style="max-inline-size:360px;min-block-size:28rem">
        <ui-form-field label="Stay"><ui-date-range-picker [(value)]="stay" /></ui-form-field>
      </div>`,
  }),
};

import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiDatepicker } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiTimeInput } from './time-input';
import { uiDateWithTime } from './time-utils';

interface TimeInputArgs {
  label: string;
  hintText: string;
  minArg: string;
  maxArg: string;
  intervalArg: number;
  disabledArg: boolean;
  readonlyArg: boolean;
  invalidArg: boolean;
  controlSize: 'sm' | 'md' | 'lg';
  picked: string | null;
}

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<TimeInputArgs> = {
  title: 'Forms/Time input',
  component: UiTimeInput,
  decorators: [moduleMetadata({ imports: [UiFormField, UiDatepicker] })],
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<TimeInputArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'שעת פגישה',
    hintText: 'אפשר להקליד או לבחור מהרשימה',
    minArg: '',
    maxArg: '',
    intervalArg: 30,
    disabledArg: false,
    readonlyArg: false,
    invalidArg: false,
    controlSize: 'md',
    picked: null,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size:240px;min-block-size:20rem">
        <ui-form-field [label]="label" [hint]="hintText">
          <ui-time-input
            [(value)]="picked"
            [minTime]="minArg || null"
            [maxTime]="maxArg || null"
            [interval]="intervalArg"
            [disabled]="disabledArg"
            [readonly]="readonlyArg"
            [invalid]="invalidArg"
            [size]="controlSize"
          />
        </ui-form-field>
        <p>{{ picked ?? 'No time' }}</p>
      </div>`,
  }),
};

export const WithValue: Story = { ...Default, args: { ...Default.args, picked: '14:30' } };

/** Working hours every 15 minutes; other typed times are errors. */
export const Limits: Story = {
  ...Default,
  args: {
    ...Default.args,
    label: 'שעת ביקור',
    hintText: '08:00–18:00',
    minArg: '08:00',
    maxArg: '18:00',
    intervalArg: 15,
    picked: '09:15',
  },
};

export const Disabled: Story = {
  ...Default,
  args: { ...Default.args, picked: '10:00', disabledArg: true },
};

export const Readonly: Story = {
  ...Default,
  args: { ...Default.args, picked: '10:00', readonlyArg: true },
};

export const Invalid: Story = { ...Default, args: { ...Default.args, invalidArg: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px;max-inline-size:240px">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <ui-time-input [size]="$any(size)" [aria-label]="'שעה ' + size" value="08:30" />
        }
      </div>`,
  }),
};

// Functions are not literals, so the docs snippet cannot be derived; these stories spell it out.
/** A date and a time joined into one `Date` with `uiDateWithTime()`. */
export const WithDate: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component, computed, signal } from '@angular/core';
import { UiDatepicker } from '@vplans/ui-kit/datepicker';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiTimeInput, uiDateWithTime } from '@vplans/ui-kit/time';

@Component({
  selector: 'app-demo',
  imports: [UiDatepicker, UiFormField, UiTimeInput],
  template: \`
    <div style="display:flex;gap:12px">
      <ui-form-field label="תאריך"><ui-datepicker [(value)]="date" /></ui-form-field>
      <ui-form-field label="שעה"><ui-time-input [(value)]="time" interval="15" /></ui-form-field>
    </div>
    <p>{{ meeting()?.toLocaleString('he-IL') }}</p>\`,
})
export class DemoComponent {
  readonly date = signal<Date | null>(new Date(2026, 8, 25));
  readonly time = signal<string | null>('10:30');
  readonly meeting = computed(() => uiDateWithTime(this.date(), this.time()));
}`,
      },
    },
  },
  render: () => ({
    props: { day: new Date(2026, 8, 25), hour: '10:30', join: uiDateWithTime },
    template: `
      <div style="max-inline-size:480px;min-block-size:24rem">
        <div style="display:flex;gap:12px">
          <ui-form-field label="תאריך"><ui-datepicker [(value)]="day" /></ui-form-field>
          <ui-form-field label="שעה"><ui-time-input [(value)]="hour" interval="15" /></ui-form-field>
        </div>
        <p>{{ join(day, hour)?.toLocaleString('he-IL') }}</p>
      </div>`,
  }),
};

/** English texts and a 12-hour clock with AM/PM. */
export const English: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiTimeInput } from '@vplans/ui-kit/time';

@Component({
  selector: 'app-demo',
  imports: [UiFormField, UiTimeInput],
  providers: [provideUiLabels(UI_LABELS_EN)],
  template: \`
    <div dir="ltr" lang="en">
      <ui-form-field label="Start"><ui-time-input [(value)]="time" /></ui-form-field>
    </div>\`,
})
export class DemoComponent {
  time: string | null = '14:30';
}`,
      },
    },
  },
  decorators: [applicationConfig({ providers: [provideUiLabels(UI_LABELS_EN)] })],
  render: () => ({
    props: { start: '14:30' },
    template: `
      <div dir="ltr" lang="en" style="max-inline-size:240px;min-block-size:20rem">
        <ui-form-field label="Start"><ui-time-input [(value)]="start" /></ui-form-field>
      </div>`,
  }),
};

import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiCalendar } from './calendar';

// Dates and functions are not literals, so the docs snippet cannot be derived; each story spells it out.
const meta: Meta<UiCalendar> = {
  title: 'Forms/Calendar',
  component: UiCalendar,
};

export default meta;
type Story = StoryObj<UiCalendar>;

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UiCalendar } from '@vplans/ui-kit/datepicker';

@Component({
  selector: 'app-demo',
  imports: [UiCalendar],
  template: \`
    <ui-calendar [(selected)]="selected" />
    <p>{{ selected ? selected.toDateString() : 'No date' }}</p>\`,
})
export class DemoComponent {
  selected: Date | null = new Date(2026, 8, 25);
}`,
      },
    },
  },
  render: () => ({
    props: { selected: new Date(2026, 8, 25) },
    template: `
      <div style="display:grid;gap:12px;justify-items:start">
        <ui-calendar [(selected)]="selected" />
        <p>{{ selected ? selected.toDateString() : 'No date' }}</p>
      </div>`,
  }),
};

/** Weekends (Friday, Saturday) and days outside September 2026 cannot be picked. */
export const Restricted: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UiCalendar } from '@vplans/ui-kit/datepicker';

@Component({
  selector: 'app-demo',
  imports: [UiCalendar],
  template: \`
    <ui-calendar
      [(selected)]="selected"
      [startAt]="startAt"
      [min]="min"
      [max]="max"
      [dateFilter]="workdays"
    />\`,
})
export class DemoComponent {
  selected: Date | null = null;
  startAt = new Date(2026, 8, 1);
  min = new Date(2026, 8, 1);
  max = new Date(2026, 8, 30);
  workdays = (d: Date) => d.getDay() !== 5 && d.getDay() !== 6;
}`,
      },
    },
  },
  render: () => ({
    props: {
      selected: null,
      startAt: new Date(2026, 8, 1),
      min: new Date(2026, 8, 1),
      max: new Date(2026, 8, 30),
      workdays: (d: Date) => d.getDay() !== 5 && d.getDay() !== 6,
    },
    template: `
      <ui-calendar
        [(selected)]="selected"
        [startAt]="startAt"
        [min]="min"
        [max]="max"
        [dateFilter]="workdays"
      />`,
  }),
};

export const Hebrew: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UiCalendar } from '@vplans/ui-kit/datepicker';

@Component({
  selector: 'app-demo',
  imports: [UiCalendar],
  template: \`
    <div dir="rtl" lang="he">
      <ui-calendar [(selected)]="selected" />
    </div>\`,
})
export class DemoComponent {
  selected: Date | null = new Date(2026, 8, 25);
}`,
      },
    },
  },
  render: () => ({
    props: { selected: new Date(2026, 8, 25) },
    template: `<div dir="rtl" lang="he"><ui-calendar [(selected)]="selected" /></div>`,
  }),
};

/** Range mode with two months: the first pick sets the start, the second the end. */
export const Range: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { UiCalendar, UiDateRange } from '@vplans/ui-kit/datepicker';

@Component({
  selector: 'app-demo',
  imports: [UiCalendar],
  template: \`<ui-calendar range months="2" [(selectedRange)]="range" />\`,
})
export class DemoComponent {
  range: UiDateRange | null = { start: new Date(2026, 8, 20), end: new Date(2026, 9, 6) };
}`,
      },
    },
  },
  render: () => ({
    props: { range: { start: new Date(2026, 8, 20), end: new Date(2026, 9, 6) } },
    template: `<ui-calendar range months="2" [(selectedRange)]="range" />`,
  }),
};

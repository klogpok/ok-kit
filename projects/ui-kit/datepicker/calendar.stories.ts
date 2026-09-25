import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiCalendar } from './calendar';

const meta: Meta<UiCalendar> = {
  title: 'Forms/Calendar',
  component: UiCalendar,
  render: () => ({
    props: { selected: new Date(2026, 8, 25) },
    template: `
      <div style="display:grid;gap:12px;justify-items:start">
        <ui-calendar [(selected)]="selected" />
        <p>{{ selected ? selected.toDateString() : 'No date' }}</p>
      </div>`,
  }),
};

export default meta;
type Story = StoryObj<UiCalendar>;

export const Default: Story = {};

/** Weekends (Friday, Saturday) and days outside September 2026 cannot be picked. */
export const Restricted: Story = {
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
  render: () => ({
    props: { selected: new Date(2026, 8, 25) },
    template: `<div dir="rtl" lang="he"><ui-calendar [(selected)]="selected" /></div>`,
  }),
};

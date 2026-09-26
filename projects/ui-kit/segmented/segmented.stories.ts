import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiSegment, UiSegmented } from './segmented';

interface SegmentedArgs {
  label: string;
  view: string | null;
  controlSize: 'sm' | 'md' | 'lg';
  fullWidthArg: boolean;
  disabledArg: boolean;
  readonlyArg: boolean;
  invalidArg: boolean;
}

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<SegmentedArgs> = {
  title: 'Forms/Segmented',
  component: UiSegmented,
  decorators: [moduleMetadata({ imports: [UiSegment, UiFormField, UiError, UiIcon] })],
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    view: { control: 'inline-radio', options: [null, 'list', 'board', 'calendar'] },
  },
};

export default meta;
type Story = StoryObj<SegmentedArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'תצוגה',
    view: 'list',
    controlSize: 'md',
    fullWidthArg: false,
    disabledArg: false,
    readonlyArg: false,
    invalidArg: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-form-field [label]="label">
        <ui-segmented
          [(value)]="view"
          [size]="controlSize"
          [fullWidth]="fullWidthArg"
          [disabled]="disabledArg"
          [readonly]="readonlyArg"
          [invalid]="invalidArg"
        >
          <ui-segment value="list">רשימה</ui-segment>
          <ui-segment value="board">לוח משימות</ui-segment>
          <ui-segment value="calendar">לוח שנה</ui-segment>
        </ui-segmented>
      </ui-form-field>
      <p>{{ view ?? 'ללא בחירה' }}</p>`,
  }),
};
export const NoSelection: Story = { ...Default, args: { ...Default.args, view: null } };
export const Disabled: Story = { ...Default, args: { ...Default.args, disabledArg: true } };
export const Readonly: Story = { ...Default, args: { ...Default.args, readonlyArg: true } };
export const FullWidth: Story = { ...Default, args: { ...Default.args, fullWidthArg: true } };

export const Invalid: Story = {
  render: () => ({
    template: `
      <ui-form-field label="היקף">
        <ui-segmented invalid>
          <ui-segment value="mine">התוכניות שלי</ui-segment>
          <ui-segment value="all">כל התוכניות</ui-segment>
        </ui-segmented>
        <ui-error>יש לבחור היקף</ui-error>
      </ui-form-field>`,
  }),
};

export const DisabledSegment: Story = {
  render: () => ({
    template: `
      <ui-segmented aria-label="תקופה" value="month">
        <ui-segment value="week">שבוע</ui-segment>
        <ui-segment value="month">חודש</ui-segment>
        <ui-segment value="year" disabled>שנה</ui-segment>
      </ui-segmented>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:16px;justify-items:start">
        @for (s of ['sm', 'md', 'lg']; track s) {
          <ui-segmented [size]="$any(s)" value="a" [attr.aria-label]="s">
            <ui-segment value="a">יומי</ui-segment>
            <ui-segment value="b">שבועי</ui-segment>
            <ui-segment value="c">חודשי</ui-segment>
          </ui-segmented>
        }
      </div>`,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    template: `
      <ui-segmented aria-label="תצוגה" value="list">
        <ui-segment value="list"><ui-icon uiSegmentIcon icon="menu" />רשימה</ui-segment>
        <ui-segment value="calendar"><ui-icon uiSegmentIcon icon="calendar" />לוח שנה</ui-segment>
        <ui-segment value="timeline"><ui-icon uiSegmentIcon icon="clock" />ציר זמן</ui-segment>
      </ui-segmented>`,
  }),
};

export const IconOnly: Story = {
  render: () => ({
    template: `
      <ui-segmented aria-label="תצוגה" value="list" size="sm">
        <ui-segment value="list" aria-label="רשימה"><ui-icon uiSegmentIcon icon="menu" /></ui-segment>
        <ui-segment value="calendar" aria-label="לוח שנה"><ui-icon uiSegmentIcon icon="calendar" /></ui-segment>
        <ui-segment value="team" aria-label="צוות"><ui-icon uiSegmentIcon icon="users" /></ui-segment>
      </ui-segmented>`,
  }),
};

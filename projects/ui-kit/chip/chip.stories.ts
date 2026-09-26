import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiAvatar } from '@vplans/ui-kit/avatar';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiChip, UiChipSet, UiFilterChip } from './chip';
import { UiChipInput } from './chip-input';

const PEOPLE = ['דנה כהן', 'יוסי לוי', 'מיכל אברהם', 'אבי מזרחי'];

/** Removable chips: the app takes a chip out when it emits `removed`. */
@Component({
  selector: 'ui-story-removable-chips',
  imports: [UiChip, UiChipSet, UiAvatar],
  template: `
    <ui-chip-set aria-label="נמענים">
      @for (person of people(); track person) {
        <ui-chip removable (removed)="remove(person)">
          <ui-avatar uiChipIcon size="sm" [name]="person" decorative />
          {{ person }}
        </ui-chip>
      }
    </ui-chip-set>
  `,
})
class RemovableChips {
  readonly people = signal(PEOPLE);
  remove(person: string): void {
    this.people.update((people) => people.filter((p) => p !== person));
  }
}

const meta: Meta<UiChip> = {
  title: 'Forms/Chips',
  component: UiChip,
  decorators: [
    moduleMetadata({
      imports: [UiChipSet, UiFilterChip, UiChipInput, UiFormField, RemovableChips],
    }),
  ],
};

export default meta;
type Story = StoryObj<UiChip>;

/** Display chips, e.g. the tags of a plan. */
export const Default: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he">
        <ui-chip-set aria-label="תגיות">
          <ui-chip>מגדל ב׳</ui-chip>
          <ui-chip>קומה 4</ui-chip>
          <ui-chip>חשמל</ui-chip>
          <ui-chip disabled>ארכיון</ui-chip>
        </ui-chip-set>
      </div>`,
  }),
};

/** The arrow keys move between the remove buttons; Delete removes a chip. */
export const Removable: Story = {
  render: () => ({ template: `<ui-story-removable-chips dir="rtl" lang="he" />` }),
};

/** Filter chips are toggle buttons (`aria-pressed`) in a group with one tab stop. */
export const Filters: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he">
        <ui-chip-set aria-label="סינון לפי סטטוס">
          <button ui-filter-chip [selected]="true">ממתין לאישור מתאם</button>
          <button ui-filter-chip>ממתין לחתימה</button>
          <button ui-filter-chip>לא הוגדר לו"ז</button>
          <button ui-filter-chip disabled>בארכיון</button>
        </ui-chip-set>
      </div>`,
  }),
};

/** Enter or a comma adds a chip; Backspace in the empty field removes the last one. */
export const ChipInput: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:26rem">
        <ui-form-field label="תגיות" hint="Enter או פסיק אחרי כל תגית">
          <ui-chip-input [value]="['חשמל', 'אינסטלציה']" placeholder="הוספת תגית" />
        </ui-form-field>
      </div>`,
  }),
};

export const ChipInputStates: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:16px;max-inline-size:26rem">
        <ui-form-field label="ריק"><ui-chip-input placeholder="הוספת תגית" /></ui-form-field>
        <ui-form-field label="מושבת"><ui-chip-input disabled [value]="['חשמל']" /></ui-form-field>
        <ui-form-field label="לקריאה בלבד"><ui-chip-input readonly [value]="['חשמל']" /></ui-form-field>
        <ui-form-field label="שגוי"><ui-chip-input invalid [value]="['x']" /></ui-form-field>
      </div>`,
  }),
};

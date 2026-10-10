import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiAvatar } from '@vplans/ui-kit/avatar';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
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
      imports: [UiChipSet, UiFilterChip, UiChipInput, UiFormField, UiIcon, RemovableChips],
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

/**
 * `outline` (default) and `soft`. Set it on a chip, on its `ui-chip-set`, or for the whole app
 * with `provideUiChip({ appearance: 'soft' })`.
 */
export const Appearances: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center">
        <strong>outline</strong>
        <div style="display:grid;gap:8px">
          <ui-chip-set aria-label="תגיות outline">
            <ui-chip>מגדל ב׳</ui-chip>
            <ui-chip removable>קומה 4</ui-chip>
            <ui-chip disabled>ארכיון</ui-chip>
          </ui-chip-set>
          <ui-chip-set aria-label="סינון outline">
            <button ui-filter-chip [selected]="true">ממתין לאישור</button>
            <button ui-filter-chip>ממתין לחתימה</button>
            <button ui-filter-chip disabled>בארכיון</button>
          </ui-chip-set>
        </div>
        <strong>soft</strong>
        <div style="display:grid;gap:8px">
          <ui-chip-set appearance="soft" aria-label="תגיות soft">
            <ui-chip>מגדל ב׳</ui-chip>
            <ui-chip removable>קומה 4</ui-chip>
            <ui-chip disabled>ארכיון</ui-chip>
          </ui-chip-set>
          <ui-chip-set appearance="soft" aria-label="סינון soft">
            <button ui-filter-chip [selected]="true">ממתין לאישור</button>
            <button ui-filter-chip>ממתין לחתימה</button>
            <button ui-filter-chip disabled>בארכיון</button>
          </ui-chip-set>
        </div>
      </div>`,
  }),
};

/** `sm` is the compact chip for tables and cards; it does not follow `data-density`. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center">
        <strong>md</strong>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <ui-chip-set aria-label="תגיות md">
            <ui-chip>חשמל</ui-chip>
            <ui-chip removable>אינסטלציה</ui-chip>
          </ui-chip-set>
          <ui-chip-set aria-label="סינון md">
            <button ui-filter-chip [selected]="true">פתוח</button>
            <button ui-filter-chip>סגור</button>
          </ui-chip-set>
        </div>
        <strong>sm</strong>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <ui-chip-set size="sm" aria-label="תגיות sm">
            <ui-chip>חשמל</ui-chip>
            <ui-chip removable>אינסטלציה</ui-chip>
          </ui-chip-set>
          <ui-chip-set size="sm" aria-label="סינון sm">
            <button ui-filter-chip [selected]="true">פתוח</button>
            <button ui-filter-chip>סגור</button>
          </ui-chip-set>
        </div>
      </div>`,
  }),
};

/** A `tone` tints a tag or a status in either appearance; a toned chip has no border. */
export const Tones: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:12px">
        <ui-chip-set aria-label="סטטוסים">
          <ui-chip tone="neutral">טיוטה</ui-chip>
          <ui-chip tone="primary">בתהליך</ui-chip>
          <ui-chip tone="info">לידיעה</ui-chip>
          <ui-chip tone="success">אושר</ui-chip>
          <ui-chip tone="warning">ממתין</ui-chip>
          <ui-chip tone="danger">נדחה</ui-chip>
        </ui-chip-set>
        <ui-chip-set size="sm" aria-label="סטטוסים קומפקטיים">
          <ui-chip tone="neutral">טיוטה</ui-chip>
          <ui-chip tone="primary">בתהליך</ui-chip>
          <ui-chip tone="info">לידיעה</ui-chip>
          <ui-chip tone="success" removable>אושר</ui-chip>
          <ui-chip tone="warning" removable>ממתין</ui-chip>
          <ui-chip tone="danger" removable>נדחה</ui-chip>
        </ui-chip-set>
      </div>`,
  }),
};

/** An icon marked `uiChipIcon` takes the primary color; the check mark replaces it when selected. */
export const FiltersWithIcons: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:12px">
        <ui-chip-set aria-label="סינון לפי סוג">
          <button ui-filter-chip [selected]="true"><ui-icon uiChipIcon icon="user" />שלי</button>
          <button ui-filter-chip><ui-icon uiChipIcon icon="users" />הצוות</button>
          <button ui-filter-chip><ui-icon uiChipIcon icon="calendar" />השבוע</button>
          <button ui-filter-chip disabled><ui-icon uiChipIcon icon="bell" />התראות</button>
        </ui-chip-set>
        <ui-chip-set appearance="soft" aria-label="סינון לפי סוג soft">
          <button ui-filter-chip [selected]="true"><ui-icon uiChipIcon icon="user" />שלי</button>
          <button ui-filter-chip><ui-icon uiChipIcon icon="users" />הצוות</button>
          <button ui-filter-chip><ui-icon uiChipIcon icon="calendar" />השבוע</button>
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

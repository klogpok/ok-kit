import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { press, until } from '../.storybook/play';
import { UiAvatar } from '@vplans/ui-kit/avatar';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiOption, UiOptionGroup } from './option';
import { UiSelect } from './select';

type SelectArgs = UiSelect<string> & { label: string; hint: string };

const meta: Meta<SelectArgs> = {
  title: 'Forms/Select',
  component: UiSelect,
  decorators: [
    moduleMetadata({ imports: [UiOption, UiOptionGroup, UiFormField, UiAvatar, UiIcon] }),
  ],
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
};

export default meta;
type Story = StoryObj<SelectArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'Coordinator',
    hint: 'Approves the plan before signing',
    placeholder: 'Choose a coordinator',
    value: null,
    size: 'md',
    disabled: false,
    invalid: false,
    searchable: false,
  },
  render: ({ label, hint, ...args }) => ({
    props: args,
    template: `
      <div style="max-inline-size:320px">
        <ui-form-field [label]="'${label}'" [hint]="'${hint}'">
          <ui-select
            [(value)]="value"
            [placeholder]="placeholder"
            [size]="size"
            [disabled]="disabled"
            [invalid]="invalid"
            [searchable]="searchable"
          >
            @for (name of ['Dana Levi', 'David Cohen', 'Yael Mizrahi', 'Yossi Peretz', 'Noa Friedman']; track name) {
              <ui-option [value]="name">{{ name }}</ui-option>
            }
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};
export const WithValue: Story = { ...Default, args: { ...Default.args, value: 'Yael Mizrahi' } };
/**
 * A click opens the list without an active option, also with a value: only the checkbox or the
 * check mark shows the selection.
 */
export const WithValueOpenedByClick: Story = {
  ...WithValue,
  play: async ({ canvasElement }) => {
    const control = canvasElement.querySelector<HTMLElement>('.ui-select__control')!;
    control.click();
    await until(
      () => !!document.querySelector('[role="option"][aria-selected="true"]'),
      'the list did not open',
    );
    // The selected option would be activated after the first render of the list.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await expect(document.querySelector('.ui-option--active')).toBeNull();
    await expect(control.hasAttribute('aria-activedescendant')).toBe(false);
  },
};

export const Searchable: Story = { ...Default, args: { ...Default.args, searchable: true } };
export const Disabled: Story = {
  ...Default,
  args: { ...Default.args, disabled: true, value: 'Dana Levi' },
};
export const Invalid: Story = { ...Default, args: { ...Default.args, invalid: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px;max-inline-size:320px">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <ui-select [size]="$any(size)" [aria-label]="'Size ' + size" [placeholder]="size">
            <ui-option value="a">Option A</ui-option>
            <ui-option value="b">Option B</ui-option>
          </ui-select>
        }
      </div>`,
  }),
};

export const GroupsAndDisabledOptions: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:320px">
        <ui-form-field label="Floor">
          <ui-select placeholder="Choose a floor">
            <ui-option-group label="Tower A">
              <ui-option value="a1">Floor 1</ui-option>
              <ui-option value="a2">Floor 2</ui-option>
              <ui-option value="a3" disabled>Floor 3 (locked)</ui-option>
            </ui-option-group>
            <ui-option-group label="Tower B">
              <ui-option value="b1">Floor 1</ui-option>
              <ui-option value="b2">Floor 2</ui-option>
            </ui-option-group>
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};

export const Hebrew: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px">
        <ui-form-field label="סטטוס">
          <ui-select placeholder="בחירת סטטוס" searchable>
            <ui-option value="pending">ממתין לאישור מתאם</ui-option>
            <ui-option value="signing">ממתין לחתימה</ui-option>
            <ui-option value="none">לא הוגדר לו"ז</ui-option>
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};

export const Clearable: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:320px">
        <ui-form-field label="Coordinator">
          <ui-select placeholder="Choose" clearable [value]="'dana'">
            <ui-option value="dana">Dana Levi</ui-option>
            <ui-option value="yossi">Yossi Peretz</ui-option>
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};

/** Server-side search in progress: a spinner replaces the chevron and the list is busy. */
export const Loading: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:320px">
        <ui-form-field label="Owner">
          <ui-select placeholder="Search by name" searchable loading [filterOptions]="false" />
        </ui-form-field>
      </div>`,
  }),
};

/** Options with an avatar or icon (`uiOptionIcon`) and a second line (`uiOptionDescription`). */
export const RichOptions: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:320px;min-block-size:16rem">
        <ui-form-field label="Coordinator">
          <ui-select placeholder="Choose" [value]="'dana'">
            <ui-option value="dana">
              <ui-avatar uiOptionIcon size="sm" name="Dana Levi" decorative />
              Dana Levi
              <span uiOptionDescription>Coordinator, Tower B</span>
            </ui-option>
            <ui-option value="yossi">
              <ui-avatar uiOptionIcon size="sm" name="Yossi Peretz" decorative />
              Yossi Peretz
              <span uiOptionDescription>Owner</span>
            </ui-option>
            <ui-option value="archive">
              <ui-icon uiOptionIcon icon="file" />
              Archive
            </ui-option>
          </ui-select>
        </ui-form-field>
      </div>`,
  }),
};

const APARTMENTS = Array.from({ length: 2000 }, (_, i) => ({
  value: i + 1,
  label: `דירה ${i + 1}`,
  disabled: i % 50 === 49,
}));

/**
 * Options as data (`items`). From 100 items on (`virtualThreshold`) the list renders only the
 * options in view; the keyboard, typeahead and search still reach all of them.
 */
export const ManyOptions: Story = {
  render: () => ({
    props: { apartments: APARTMENTS },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field label="דירה" hint="2,000 דירות">
          <ui-select placeholder="בחירת דירה" searchable [items]="apartments" [value]="1234" />
        </ui-form-field>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<!-- apartments: { value, label, description?, disabled? }[] -->
<ui-form-field label="דירה">
  <ui-select formControlName="apartment" searchable [items]="apartments" />
</ui-form-field>`,
      },
    },
  },
};

/**
 * End on the closed list opens it at the last enabled item (2000 is disabled), and the viewport
 * scrolls to it before any other key.
 */
export const ManyOptionsAtEnd: Story = {
  ...ManyOptions,
  play: async ({ canvasElement }) => {
    const control = canvasElement.querySelector<HTMLElement>('.ui-select__control')!;
    control.focus();
    press('End');
    const active = () => {
      const id = control.getAttribute('aria-activedescendant');
      return id ? document.getElementById(id) : null;
    };
    await until(() => !!active()?.textContent?.includes('דירה 1999'), 'not at the last item');
    await expect(active()?.getAttribute('aria-posinset')).toBe('1999');
  },
};

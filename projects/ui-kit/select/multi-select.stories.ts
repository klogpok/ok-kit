import { JsonPipe } from '@angular/common';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';
import { press, until } from '../.storybook/play';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiMultiSelect } from './multi-select';
import { UiOption, UiOptionGroup } from './option';

type MultiSelectArgs = UiMultiSelect<string> & { label: string; hint: string };

const meta: Meta<MultiSelectArgs> = {
  title: 'Forms/Multi-select',
  component: UiMultiSelect,
  decorators: [moduleMetadata({ imports: [UiOption, UiOptionGroup, UiFormField, JsonPipe] })],
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
};

export default meta;
type Story = StoryObj<MultiSelectArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: {
    label: 'Coordinators',
    hint: 'Everyone chosen gets the plan for approval',
    placeholder: 'Choose coordinators',
    value: [],
    size: 'md',
    disabled: false,
    invalid: false,
    searchable: false,
  },
  render: ({ label, hint, ...args }) => ({
    props: args,
    template: `
      <div style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field [label]="'${label}'" [hint]="'${hint}'">
          <ui-multi-select
            [(value)]="value"
            [placeholder]="placeholder"
            [size]="size"
            [disabled]="disabled"
            [invalid]="invalid"
            [searchable]="searchable"
          >
            @for (name of ['Dana Levi', 'David Cohen', 'Yael Mizrahi', 'Yossi Peretz', 'Noa Friedman']; track name) {
              <ui-option [value]="name" [disabled]="name === 'David Cohen'">{{ name }}</ui-option>
            }
          </ui-multi-select>
        </ui-form-field>
        <p>Value: {{ value | json }}</p>
      </div>`,
  }),
};
export const WithValue: Story = {
  ...Default,
  args: { ...Default.args, value: ['Dana Levi', 'Noa Friedman'] },
};
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
  args: { ...Default.args, disabled: true, value: ['Dana Levi'] },
};
export const Invalid: Story = { ...Default, args: { ...Default.args, invalid: true } };

export const Groups: Story = {
  args: { value: ['a2'] },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field label="Floors">
          <ui-multi-select [(value)]="value" placeholder="Choose floors">
            <ui-option-group label="Tower A">
              <ui-option value="a1">Floor 1</ui-option>
              <ui-option value="a2">Floor 2</ui-option>
            </ui-option-group>
            <ui-option-group label="Tower B">
              <ui-option value="b1">Floor 1</ui-option>
              <ui-option value="b2">Floor 2</ui-option>
            </ui-option-group>
          </ui-multi-select>
        </ui-form-field>
      </div>`,
  }),
};

export const Hebrew: Story = {
  args: { value: ['owner'] },
  render: (args) => ({
    props: args,
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:320px;min-block-size:18rem">
        <ui-form-field label="נמענים">
          <ui-multi-select [(value)]="value" placeholder="בחירה" searchable>
            <ui-option value="owner">בעלים</ui-option>
            <ui-option value="coordinator">מתאם</ui-option>
            <ui-option value="architect">אדריכל</ui-option>
          </ui-multi-select>
        </ui-form-field>
      </div>`,
  }),
};

const TRADES = ['חשמל', 'אינסטלציה', 'צבע', 'ריצוף', 'גבס', 'מיזוג אוויר'];

/** The selected values as chips in the trigger; their x removes a value with the mouse. */
export const Chips: Story = {
  render: () => ({
    props: { trades: TRADES },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:360px;min-block-size:18rem">
        <ui-form-field label="מקצועות">
          <ui-multi-select chips [value]="['חשמל', 'צבע', 'גבס']" placeholder="בחירת מקצועות">
            @for (trade of trades; track trade) {
              <ui-option [value]="trade">{{ trade }}</ui-option>
            }
          </ui-multi-select>
        </ui-form-field>
      </div>`,
  }),
};

/** "Select all" is the first option; it is mixed while some options are selected. */
export const SelectAll: Story = {
  render: () => ({
    props: { trades: TRADES },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:360px;min-block-size:18rem">
        <ui-form-field label="מקצועות">
          <ui-multi-select selectAll searchable [value]="['חשמל']" placeholder="בחירת מקצועות">
            @for (trade of trades; track trade) {
              <ui-option [value]="trade">{{ trade }}</ui-option>
            }
          </ui-multi-select>
        </ui-form-field>
      </div>`,
  }),
};

/** With `maxSelections`, the other options are disabled once the limit is reached. */
export const MaxSelections: Story = {
  render: () => ({
    props: { trades: TRADES },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:360px;min-block-size:18rem">
        <ui-form-field label="עד שני מקצועות" hint="אפשר לבחור עד 2">
          <ui-multi-select maxSelections="2" chips [value]="['חשמל', 'צבע']">
            @for (trade of trades; track trade) {
              <ui-option [value]="trade">{{ trade }}</ui-option>
            }
          </ui-multi-select>
        </ui-form-field>
      </div>`,
  }),
};

const UNITS = Array.from({ length: 500 }, (_, i) => ({
  value: `unit-${i + 1}`,
  label: `יחידה ${i + 1}`,
  description: i % 2 ? 'בניין ב' : 'בניין א',
}));

/** Options as data (`items`) in a virtual scroll viewport; "select all" stays above it. */
export const ManyOptions: Story = {
  render: () => ({
    props: { units: UNITS },
    template: `
      <div dir="rtl" lang="he" style="max-inline-size:360px;min-block-size:18rem">
        <ui-form-field label="יחידות">
          <ui-multi-select selectAll searchable [items]="units" [value]="['unit-3', 'unit-120']" />
        </ui-form-field>
      </div>`,
  }),
  parameters: {
    docs: {
      source: {
        code: `<ui-multi-select formControlName="units" selectAll searchable [items]="units" />`,
      },
    },
  },
};

/** End and Enter toggle the last item, which is not rendered until the viewport scrolls to it. */
export const ManyOptionsToggleLast: Story = {
  ...ManyOptions,
  play: async ({ canvasElement }) => {
    const control = canvasElement.querySelector<HTMLElement>('.ui-select__control')!;
    control.focus();
    press('End');
    press('Enter');
    const active = () => {
      const id = control.getAttribute('aria-activedescendant');
      return id ? document.getElementById(id) : null;
    };
    await until(() => active()?.getAttribute('aria-selected') === 'true', 'not selected yet');
    await expect(active()?.textContent).toContain('יחידה 500');
    // "Select all" opens the set.
    await expect(active()?.getAttribute('aria-posinset')).toBe('501');
  },
};

/** PageUp from the end scrolls the rows back under "select all", which stays in view. */
export const ManyOptionsPageUp: Story = {
  ...ManyOptions,
  play: async ({ canvasElement }) => {
    const control = canvasElement.querySelector<HTMLElement>('.ui-select__control')!;
    control.focus();
    press('End');
    // From item 500, ten items a page: item 10.
    for (let i = 0; i < 49; i++) press('PageUp');
    const active = () => {
      const id = control.getAttribute('aria-activedescendant');
      return id ? document.getElementById(id) : null;
    };
    await until(() => !!active()?.textContent?.includes('יחידה 10'), 'not at item 10');
    const row = document.querySelector('.ui-select__all-row')!.getBoundingClientRect();
    const listbox = document.querySelector('[role="listbox"]')!.getBoundingClientRect();
    // The list is scrolled, "select all" sticks at its top, and the active item shows below it.
    // (The listbox border is 1px.)
    await expect(Math.abs(row.top - listbox.top)).toBeLessThan(2);
    await expect(active()!.getBoundingClientRect().top).toBeGreaterThanOrEqual(row.bottom - 1);
  },
};

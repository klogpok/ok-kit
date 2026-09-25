import { Component, computed, signal } from '@angular/core';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiCheckbox } from './checkbox';

@Component({
  selector: 'ui-story-select-all',
  imports: [UiCheckbox],
  template: `
    <div style="display:grid;gap:8px">
      <ui-checkbox [checked]="all()" [indeterminate]="some()" (checkedChange)="setAll($event)">
        Select all
      </ui-checkbox>
      <div style="display:grid;gap:8px;padding-inline-start:28px">
        @for (item of items(); track item.name; let i = $index) {
          <ui-checkbox [checked]="item.done" (checkedChange)="toggle(i, $event)">{{ item.name }}</ui-checkbox>
        }
      </div>
    </div>
  `,
})
class SelectAllStory {
  readonly items = signal([
    { name: 'Invoices', done: true },
    { name: 'Receipts', done: false },
    { name: 'Contracts', done: false },
  ]);
  readonly all = computed(() => this.items().every((i) => i.done));
  readonly some = computed(() => !this.all() && this.items().some((i) => i.done));

  setAll(done: boolean): void {
    this.items.update((items) => items.map((i) => ({ ...i, done })));
  }

  toggle(index: number, done: boolean): void {
    this.items.update((items) => items.map((i, n) => (n === index ? { ...i, done } : i)));
  }
}

type CheckboxArgs = UiCheckbox & { label: string };

const meta: Meta<CheckboxArgs> = {
  title: 'Forms/Checkbox',
  component: UiCheckbox,
  decorators: [moduleMetadata({ imports: [UiFormField, UiError, SelectAllStory] })],
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  args: {
    label: 'Send me product updates',
    checked: false,
    indeterminate: false,
    disabled: false,
    invalid: false,
    required: false,
    size: 'md',
  },
  render: ({ label, ...args }) => ({
    props: args,
    template: `<ui-checkbox ${argsToTemplate(args)}>${label}</ui-checkbox>`,
  }),
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, checked: true } };
export const Invalid: Story = { args: { invalid: true } };

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:grid;gap:12px">
        <ui-checkbox size="sm">Small</ui-checkbox>
        <ui-checkbox size="md" [checked]="true">Medium</ui-checkbox>
        <ui-checkbox size="lg" [indeterminate]="true">Large</ui-checkbox>
      </div>`,
  }),
};

export const LongLabel: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:320px">
        <ui-checkbox>I agree to the processing of my personal data in accordance with the privacy policy and terms of service</ui-checkbox>
      </div>`,
  }),
};

export const SelectAll: Story = {
  render: () => ({ template: '<ui-story-select-all />' }),
};

export const WithFormFieldError: Story = {
  render: () => ({
    template: `
      <ui-form-field>
        <ui-checkbox invalid>I accept the terms</ui-checkbox>
        <ui-error>You must accept the terms to continue</ui-error>
      </ui-form-field>`,
  }),
};

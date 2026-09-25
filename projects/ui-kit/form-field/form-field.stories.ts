import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiInput, UiTextarea } from '@vplans/ui-kit/input';
import { UiRadio, UiRadioGroup } from '@vplans/ui-kit/radio';
import { UiSwitch } from '@vplans/ui-kit/switch';
import { UiError, UiFormField, UiHint } from './form-field';

@Component({
  selector: 'ui-story-signal-form',
  imports: [
    JsonPipe,
    FormField,
    UiFormField,
    UiInput,
    UiTextarea,
    UiCheckbox,
    UiRadioGroup,
    UiRadio,
    UiSwitch,
    UiButton,
  ],
  template: `
    <form style="display:grid;gap:16px;max-inline-size:400px" (submit)="submit($event)" novalidate>
      <ui-form-field label="Full name">
        <input ui-input [formField]="f.name" autocomplete="name" />
      </ui-form-field>
      <ui-form-field label="Email" hint="We'll send the receipt here">
        <input ui-input type="email" [formField]="f.email" autocomplete="email" />
      </ui-form-field>
      <ui-form-field label="Plan">
        <ui-radio-group [formField]="f.plan" orientation="horizontal">
          <ui-radio value="free">Free</ui-radio>
          <ui-radio value="pro">Pro</ui-radio>
          <ui-radio value="team">Team</ui-radio>
        </ui-radio-group>
      </ui-form-field>
      <ui-form-field label="Notes">
        <textarea ui-textarea autosize [formField]="f.notes"></textarea>
      </ui-form-field>
      <ui-switch [formField]="f.newsletter">Monthly newsletter</ui-switch>
      <ui-form-field>
        <ui-checkbox [formField]="f.terms">I accept the terms of service</ui-checkbox>
      </ui-form-field>
      <div><button ui-button type="submit">Create account</button></div>
      <pre dir="ltr" style="font-size:12px">{{ model() | json }}</pre>
    </form>
  `,
})
class SignalFormStory {
  readonly model = signal({
    name: '',
    email: '',
    plan: '',
    notes: '',
    newsletter: true,
    terms: false,
  });
  readonly f = form(this.model, (p) => {
    required(p.name, { message: 'Enter your name' });
    minLength(p.name, 2, { message: 'At least 2 characters' });
    required(p.email, { message: 'Enter your email' });
    email(p.email, { message: 'Enter a valid email' });
    required(p.plan, { message: 'Choose a plan' });
    required(p.terms, { message: 'You must accept the terms' });
  });

  submit(event: Event): void {
    event.preventDefault();
    // Marks every field touched, then runs the action only when the form is valid.
    void submit(this.f, () => Promise.resolve(undefined));
  }
}

@Component({
  selector: 'ui-story-reactive-form',
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiError, UiHint, UiCheckbox, UiButton],
  template: `
    <form
      [formGroup]="group"
      style="display:grid;gap:16px;max-inline-size:400px"
      (ngSubmit)="group.markAllAsTouched()"
    >
      <ui-form-field label="Username">
        <input ui-input formControlName="username" />
        <ui-hint>Letters and digits only</ui-hint>
        @if (group.controls.username.hasError('required')) {
          <ui-error>Username is required</ui-error>
        }
        @if (group.controls.username.hasError('pattern')) {
          <ui-error>Only letters and digits</ui-error>
        }
      </ui-form-field>
      <ui-form-field>
        <ui-checkbox formControlName="remember">Remember me</ui-checkbox>
      </ui-form-field>
      <div style="display:flex;gap:8px">
        <button ui-button type="submit">Sign in</button>
        <button ui-button variant="secondary" (click)="toggle()">
          {{ group.disabled ? 'Enable' : 'Disable' }}
        </button>
      </div>
    </form>
  `,
})
class ReactiveFormStory {
  readonly group = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9]+$/i)]),
    remember: new FormControl(false),
  });

  toggle(): void {
    if (this.group.disabled) this.group.enable();
    else this.group.disable();
  }
}

type FieldArgs = UiFormField;

const meta: Meta<FieldArgs> = {
  title: 'Forms/Form field',
  component: UiFormField,
  decorators: [moduleMetadata({ imports: [UiInput, UiHint, UiError] })],
  args: { label: 'Company', hint: 'Legal entity name' },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field ${argsToTemplate(args)}><input ui-input /></ui-form-field>
      </div>`,
  }),
};

export default meta;
type Story = StoryObj<FieldArgs>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };

export const WithError: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:360px">
        <ui-form-field label="IBAN" hint="Starts with the country code">
          <input ui-input invalid value="DE00" />
          <ui-error>IBAN is too short</ui-error>
        </ui-form-field>
      </div>`,
  }),
};

export const SignalForms: Story = {
  decorators: [moduleMetadata({ imports: [SignalFormStory] })],
  render: () => ({ template: '<ui-story-signal-form />' }),
};

export const ReactiveForms: Story = {
  decorators: [moduleMetadata({ imports: [ReactiveFormStory] })],
  render: () => ({ template: '<ui-story-reactive-form />' }),
};

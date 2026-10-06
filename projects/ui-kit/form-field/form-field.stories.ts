import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { argsToTemplate, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiInput, UiTextarea } from '@vplans/ui-kit/input';
import { UiRadio, UiRadioGroup } from '@vplans/ui-kit/radio';
import { UiSwitch } from '@vplans/ui-kit/switch';
import { UiError, UiFormField, UiHint } from './form-field';

/**
 * Wraps a validator so that its error value is the message to show. `ui-form-field` renders
 * string-valued Reactive Forms errors, so a field needs no projected `<ui-error>` for them.
 * `Validators.required` itself stays in the list: the required marker reads that exact validator.
 */
function withMessage(validator: ValidatorFn, message: string): ValidatorFn {
  return (control) => (validator(control) ? { uiMessage: message } : null);
}

@Component({
  selector: 'ui-story-account-form',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
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
    <form
      [formGroup]="form"
      style="display:grid;gap:16px;max-inline-size:400px"
      (submit)="submit($event)"
      novalidate
    >
      <ui-form-field label="Full name">
        <input ui-input formControlName="name" autocomplete="name" />
      </ui-form-field>
      <ui-form-field label="Email" hint="We'll send the receipt here">
        <input ui-input type="email" formControlName="email" autocomplete="email" />
      </ui-form-field>
      <ui-form-field label="Plan">
        <ui-radio-group formControlName="plan" orientation="horizontal">
          <ui-radio value="free">Free</ui-radio>
          <ui-radio value="pro">Pro</ui-radio>
          <ui-radio value="team">Team</ui-radio>
        </ui-radio-group>
      </ui-form-field>
      <ui-form-field label="Notes">
        <textarea ui-textarea autosize formControlName="notes"></textarea>
      </ui-form-field>
      <ui-switch formControlName="newsletter">Monthly newsletter</ui-switch>
      <ui-form-field>
        <ui-checkbox formControlName="terms">I accept the terms of service</ui-checkbox>
      </ui-form-field>
      <div><button ui-button type="submit">Create account</button></div>
      <pre dir="ltr" style="font-size:12px">{{ form.value | json }}</pre>
    </form>
  `,
})
class AccountFormStory {
  readonly form = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      withMessage(Validators.required, 'Enter your name'),
      withMessage(Validators.minLength(2), 'At least 2 characters'),
    ]),
    email: new FormControl('', [
      Validators.required,
      withMessage(Validators.required, 'Enter your email'),
      withMessage(Validators.email, 'Enter a valid email'),
    ]),
    plan: new FormControl('', [
      Validators.required,
      withMessage(Validators.required, 'Choose a plan'),
    ]),
    notes: new FormControl(''),
    newsletter: new FormControl(true),
    terms: new FormControl(false, [
      Validators.requiredTrue,
      withMessage(Validators.requiredTrue, 'You must accept the terms'),
    ]),
  });

  submit(event: Event): void {
    event.preventDefault();
    // Marks every field touched, so the messages appear; the action runs only when valid.
    this.form.markAllAsTouched();
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

// The export name is the story id, and the visual baseline is keyed by it. It stays as it is
// so that this ticket removes no baseline; the display name carries the story's current subject.
export const SignalForms: Story = {
  name: 'Account form',
  decorators: [moduleMetadata({ imports: [AccountFormStory] })],
  render: () => ({ template: '<ui-story-account-form />' }),
};

export const ReactiveForms: Story = {
  decorators: [moduleMetadata({ imports: [ReactiveFormStory] })],
  render: () => ({ template: '<ui-story-reactive-form />' }),
};

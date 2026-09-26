import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@vplans/ui-kit/button';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiInput } from '@vplans/ui-kit/input';
import { UiStep, UiStepper, UiStepperNext, UiStepperPrevious } from './stepper';

interface StepperArgs {
  linearArg: boolean;
  orientationArg: 'horizontal' | 'vertical';
  stepIndex: number;
}

// Arg names differ from the component fields: Storybook would overwrite the signal inputs.
const meta: Meta<StepperArgs> = {
  title: 'Navigation/Stepper',
  component: UiStepper,
  decorators: [
    moduleMetadata({
      imports: [
        ReactiveFormsModule,
        UiButton,
        UiError,
        UiFormField,
        UiInput,
        UiStep,
        UiStepperNext,
        UiStepperPrevious,
      ],
    }),
  ],
  argTypes: {
    orientationArg: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
};

export default meta;
type Story = StoryObj<StepperArgs>;

// Only the arg-driven stories get args: the docs snippet warns about args a static template does not use.
export const Default: Story = {
  args: { linearArg: false, orientationArg: 'horizontal', stepIndex: 0 },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-inline-size:720px">
        <ui-stepper [linear]="linearArg" [orientation]="orientationArg" [(selectedIndex)]="stepIndex">
          <ui-step label="פרטי הבקשה">
            <p>סוג הבקשה, כתובת וגוש/חלקה.</p>
            <button ui-button uiStepperNext>המשך</button>
          </ui-step>
          <ui-step label="מסמכים" optional>
            <p>תוכניות, אישורים ונספחים.</p>
            <div style="display:flex;gap:8px">
              <button ui-button variant="secondary" uiStepperPrevious>חזרה</button>
              <button ui-button uiStepperNext>המשך</button>
            </div>
          </ui-step>
          <ui-step label="סיכום ושליחה">
            <p>בדקו את הפרטים ושלחו את הבקשה.</p>
            <button ui-button variant="secondary" uiStepperPrevious>חזרה</button>
          </ui-step>
        </ui-stepper>
      </div>`,
  }),
};

/** Done, error, current and pending steps, and an optional one. */
export const States: Story = {
  render: () => ({
    template: `
      <div style="max-inline-size:860px">
        <ui-stepper [selectedIndex]="2">
          <ui-step label="פרטי הבקשה" [completed]="true"><p>הושלם</p></ui-step>
          <ui-step label="מסמכים" error="חסרה חתימה"><p>שגיאה</p></ui-step>
          <ui-step label="תשלום"><p>השלב הנוכחי.</p></ui-step>
          <ui-step label="הערות" optional><p>אופציונלי</p></ui-step>
          <ui-step label="שליחה"><p>ממתין</p></ui-step>
        </ui-stepper>
      </div>`,
  }),
};

export const Vertical: Story = {
  ...Default,
  args: { ...Default.args, orientationArg: 'vertical', stepIndex: 1 },
};

// The form is not a literal, so the docs snippet cannot be derived; this story spells it out.
/** Linear: Next checks the form of the step; the fields show their errors when it is invalid. */
export const LinearWithForm: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@vplans/ui-kit/button';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiInput } from '@vplans/ui-kit/input';
import { UiStep, UiStepper, UiStepperNext, UiStepperPrevious } from '@vplans/ui-kit/stepper';

@Component({
  selector: 'app-demo',
  imports: [
    ReactiveFormsModule,
    UiButton,
    UiError,
    UiFormField,
    UiInput,
    UiStep,
    UiStepper,
    UiStepperNext,
    UiStepperPrevious,
  ],
  template: \`
    <ui-stepper linear>
      <ui-step label="פרטים" [control]="details">
        <ui-form-field label="שם המבקש">
          <input ui-input [formControl]="details.controls.name" />
          @if (details.controls.name.hasError('required')) {
            <ui-error>שדה חובה</ui-error>
          }
        </ui-form-field>
        <button ui-button uiStepperNext>המשך</button>
      </ui-step>
      <ui-step label="אישור">
        <button ui-button variant="secondary" uiStepperPrevious>חזרה</button>
      </ui-step>
    </ui-stepper>\`,
})
export class DemoComponent {
  details = new FormGroup({ name: new FormControl('', Validators.required) });
}`,
      },
    },
  },
  render: () => ({
    props: { details: new FormGroup({ name: new FormControl('', Validators.required) }) },
    template: `
      <div style="max-inline-size:720px">
        <ui-stepper linear>
          <ui-step label="פרטים" [control]="details">
            <div style="display:grid;gap:12px;max-inline-size:320px;justify-items:start">
              <ui-form-field label="שם המבקש" style="inline-size:100%">
                <input ui-input [formControl]="details.controls.name" />
                @if (details.controls.name.hasError('required')) {
                  <ui-error>שדה חובה</ui-error>
                }
              </ui-form-field>
              <button ui-button uiStepperNext>המשך</button>
            </div>
          </ui-step>
          <ui-step label="מסמכים" optional><p>אפשר לדלג.</p></ui-step>
          <ui-step label="אישור">
            <button ui-button variant="secondary" uiStepperPrevious>חזרה</button>
          </ui-step>
        </ui-stepper>
      </div>`,
  }),
};

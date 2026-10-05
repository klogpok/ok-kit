import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UiInput, UiTextarea } from '@vplans/ui-kit/input';
import { UiInputHarness } from '@vplans/ui-kit/testing';
import { UiError, UiFormField, UiHint, UiPrefix, UiSuffix } from './form-field';

function query(fixture: ComponentFixture<unknown>, selector: string): HTMLElement {
  return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector)!;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** Reactive forms show the message of an error value that is a string. */
const enterYourName: ValidatorFn = (control) =>
  control.value ? null : { nameRequired: 'Name is required' };

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiError],
  template: `
    <form [formGroup]="form">
      <ui-form-field label="Email" hint="Work address">
        <input ui-input formControlName="email" />
        @if (form.controls.email.hasError('required')) {
          <ui-error>Email is required</ui-error>
        }
      </ui-form-field>
      <ui-form-field label="Name">
        <input ui-input formControlName="name" />
      </ui-form-field>
    </form>
  `,
})
class ReactiveHost {
  readonly form = new FormGroup({
    email: new FormControl('', Validators.required),
    // Validators.required marks the control required; the string-valued error carries the text.
    name: new FormControl('', [Validators.required, enterYourName]),
  });
}

@Component({
  imports: [UiFormField, UiTextarea, UiHint, UiError],
  template: `
    <ui-form-field label="Notes">
      <textarea ui-textarea id="notes" [invalid]="invalid()" disabled></textarea>
      <ui-hint>Optional</ui-hint>
      <ui-error>Too long</ui-error>
    </ui-form-field>
  `,
})
class ManualHost {
  readonly invalid = signal(false);
}

describe('UiFormField + UiInput', () => {
  describe('with Reactive Forms', () => {
    let fixture: ComponentFixture<ReactiveHost>;
    let root: HTMLElement;
    let controls: ReactiveHost['form']['controls'];
    let loader: HarnessLoader;

    const input = (label: string) => loader.getHarness(UiInputHarness.with({ label }));
    /** The `ui-form-field` whose label contains this text. */
    const fieldOf = (label: string): HTMLElement =>
      [...root.querySelectorAll<HTMLElement>('ui-form-field')].find((it) =>
        it.querySelector('label')?.textContent.includes(label),
      )!;
    const errorOf = (label: string): HTMLElement =>
      fieldOf(label).querySelector<HTMLElement>('.ui-form-field__error')!;
    const hintOf = (label: string): HTMLElement =>
      fieldOf(label).querySelector<HTMLElement>('.ui-form-field__hint')!;
    const describedBy = (label: string): string | null =>
      fieldOf(label).querySelector('input')!.getAttribute('aria-describedby');

    beforeEach(async () => {
      fixture = TestBed.createComponent(ReactiveHost);
      root = fixture.nativeElement as HTMLElement;
      controls = fixture.componentInstance.form.controls;
      loader = TestbedHarnessEnvironment.loader(fixture);
      await settle(fixture);
    });

    it('links label to the input via for/id', async () => {
      const email = await input('Email');
      const label = fieldOf('Email').querySelector<HTMLLabelElement>('label')!;
      expect(await email.getLabel()).toBe('Email');
      expect(await email.getId()).toMatch(/^ui-input-/);
      expect(label.htmlFor).toBe(await email.getId());
    });

    it('shows the required marker from Validators.required', async () => {
      expect(await (await input('Email')).isRequired()).toBe(true);
      expect(fieldOf('Email').querySelector('.ui-form-field__required')).not.toBeNull();
      expect(fieldOf('Email').querySelector('.ui-form-field__required-text')).toBeNull();
    });

    it('describes the input with the hint while valid or untouched', async () => {
      expect(describedBy('Email')).toBe(hintOf('Email').id);
      expect(hintOf('Email').hidden).toBe(false);
      expect(await (await input('Email')).isInvalid()).toBe(false);
      expect(errorOf('Email').classList).toContain('ui-form-field__error--empty');
    });

    it('shows the projected error after the control is touched and links it', async () => {
      const email = await input('Email');
      await email.blur();
      await settle(fixture);

      const error = errorOf('Email');
      expect(await email.isInvalid()).toBe(true);
      expect(fieldOf('Email').querySelector('input')!.classList).toContain('ui-input--invalid');
      expect(error.classList).not.toContain('ui-form-field__error--empty');
      expect(error.textContent).toContain('Email is required');
      expect(error.getAttribute('aria-live')).toBe('polite');
      expect(describedBy('Email')).toBe(error.id);
      expect(hintOf('Email').hidden).toBe(true);
    });

    it('shows the message of the validator when no ui-error is projected', async () => {
      const name = await input('Name');
      expect(await name.isRequired()).toBe(true);
      expect(errorOf('Name').textContent.trim()).toBe('');

      await name.blur();
      await settle(fixture);

      const error = errorOf('Name');
      expect(await name.isInvalid()).toBe(true);
      expect(error.querySelector('.ui-error')!.textContent).toBe('Name is required');
      expect(describedBy('Name')).toBe(error.id);
    });

    it('binds the value both ways and clears the error once valid', async () => {
      const name = await input('Name');
      controls.name.markAsTouched();
      await name.setValue('Ada');
      await settle(fixture);
      expect(controls.name.value).toBe('Ada');
      expect(errorOf('Name').textContent.trim()).toBe('');

      controls.name.setValue('Grace');
      await settle(fixture);
      expect(await name.getValue()).toBe('Grace');
    });

    it('reacts to programmatic markAsTouched and value changes', async () => {
      const email = await input('Email');
      controls.email.markAsTouched();
      await settle(fixture);
      expect(await email.isInvalid()).toBe(true);

      await email.setValue('a@b.c');
      await settle(fixture);
      expect(await email.isInvalid()).toBe(false);
      expect(describedBy('Email')).toBe(hintOf('Email').id);
    });

    it('reflects the disabled state on the field', async () => {
      const email = await input('Email');
      controls.email.disable();
      await settle(fixture);
      expect(await email.isDisabled()).toBe(true);
      expect(fieldOf('Email').classList).toContain('ui-form-field--disabled');
    });
  });

  describe('without forms', () => {
    let fixture: ComponentFixture<ManualHost>;

    beforeEach(async () => {
      fixture = TestBed.createComponent(ManualHost);
      await settle(fixture);
    });

    it('respects a user-provided id', () => {
      expect((query(fixture, 'label') as HTMLLabelElement).htmlFor).toBe('notes');
    });

    it('uses projected hint and toggles the error via the invalid input', async () => {
      const textarea = query(fixture, 'textarea') as HTMLTextAreaElement;
      expect(textarea.getAttribute('aria-describedby')).toBe(
        query(fixture, '.ui-form-field__hint').id,
      );
      const region = query(fixture, '.ui-form-field__error');
      expect(region.hidden).toBe(false);
      expect(region.classList).toContain('ui-form-field__error--empty');

      fixture.componentInstance.invalid.set(true);
      await settle(fixture);
      expect(textarea.getAttribute('aria-invalid')).toBe('true');
      expect(query(fixture, '.ui-form-field__error').textContent).toContain('Too long');
    });

    it('detects the native disabled attribute', () => {
      expect(query(fixture, 'ui-form-field').classList).toContain('ui-form-field--disabled');
    });
  });
});

@Component({
  imports: [UiFormField, UiInput, UiPrefix, UiSuffix],
  template: `
    <ui-form-field label="Password">
      <span uiPrefix id="prefix">#</span>
      <input ui-input [type]="visible() ? 'text' : 'password'" [invalid]="invalid()" />
      <button uiSuffix id="toggle" type="button" (click)="visible.set(!visible())">Show</button>
    </ui-form-field>
    <ui-form-field label="Plain" id="plain"><input ui-input /></ui-form-field>
  `,
})
class AffixHost {
  readonly visible = signal(false);
  readonly invalid = signal(false);
}

describe('UiFormField affixes', () => {
  let fixture: ComponentFixture<AffixHost>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(AffixHost);
    await settle(fixture);
  });

  it('renders prefix and suffix inside the control box and switches to affixed mode', () => {
    const field = query(fixture, 'ui-form-field');
    const box = query(fixture, '.ui-form-field__control');
    expect(field.classList).toContain('ui-form-field--affixed');
    expect(box.querySelector('.ui-form-field__prefix #prefix')).not.toBeNull();
    expect(box.querySelector('.ui-form-field__suffix #toggle')).not.toBeNull();
    expect(query(fixture, 'input').classList).toContain('ui-input--affixed');
  });

  it('keeps plain fields unaffixed', () => {
    const plain = query(fixture, '#plain');
    expect(plain.classList).not.toContain('ui-form-field--affixed');
    expect(plain.querySelector('input')!.classList).not.toContain('ui-input--affixed');
    expect(plain.querySelector('.ui-form-field__prefix')).toBeNull();
  });

  it('focuses the input when decorative affix content is clicked', () => {
    query(fixture, '#prefix').click();
    expect(document.activeElement).toBe(query(fixture, 'input'));
  });

  it('lets interactive suffix content handle its own clicks', async () => {
    const toggle = query(fixture, '#toggle') as HTMLButtonElement;
    toggle.focus();
    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(toggle);
    expect((query(fixture, 'input') as HTMLInputElement).type).toBe('text');
  });

  it('reflects the invalid state on the field box', async () => {
    fixture.componentInstance.invalid.set(true);
    await settle(fixture);
    expect(query(fixture, 'ui-form-field').classList).toContain('ui-form-field--invalid');
  });
});

@Component({
  imports: [UiFormField, UiInput],
  template: ` <ui-form-field label="Name" required><input ui-input /></ui-form-field> `,
})
class BareRequiredHost {}

describe('UiFormField with a bare required attribute', () => {
  it('shows the required marker', async () => {
    const fixture = TestBed.createComponent(BareRequiredHost);
    await settle(fixture);
    expect(query(fixture, '.ui-form-field__required')).not.toBeNull();
  });

  it('tells assistive technology that a field the control does not mark is required', async () => {
    const fixture = TestBed.createComponent(BareRequiredHost);
    await settle(fixture);
    const label = query(fixture, 'label');
    expect(label.querySelector('.ui-form-field__required-text')!.textContent).toBe('חובה');
    expect(query(fixture, 'input').hasAttribute('aria-required')).toBe(false);
  });
});

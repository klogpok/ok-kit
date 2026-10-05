import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormControl,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiCheckboxHarness } from '@vplans/ui-kit/testing';
import { UiCheckbox } from './checkbox';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [UiCheckbox],
  template: `
    <ui-checkbox
      id="terms"
      name="terms"
      [(checked)]="checked"
      [(indeterminate)]="indeterminate"
      [disabled]="disabled()"
      >Accept terms</ui-checkbox
    >
    <ui-checkbox aria-label="Select row" />
  `,
})
class StandaloneHost {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
  readonly disabled = signal(false);
}

/** Stands in for an application validator with a message of its own. */
const mustAccept: ValidatorFn = (control) =>
  control.value === true ? null : { uiTerms: { message: 'Accept the terms to continue' } };

@Component({
  imports: [ReactiveFormsModule, UiCheckbox, UiFormField],
  template: `
    <ui-form-field label="Terms">
      <ui-checkbox [formControl]="control">Subscribe</ui-checkbox>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl(false, [Validators.requiredTrue, mustAccept]);
}

describe('UiCheckbox', () => {
  describe('standalone', () => {
    let fixture: ComponentFixture<StandaloneHost>;
    let host: HTMLElement;
    let input: HTMLInputElement;

    beforeEach(async () => {
      fixture = TestBed.createComponent(StandaloneHost);
      await settle(fixture);
      host = (fixture.nativeElement as HTMLElement).querySelector('#terms')!;
      input = host.querySelector('input')!;
    });

    it('renders a native checkbox labelled by its content', () => {
      expect(input.type).toBe('checkbox');
      expect(input.id).toBe('terms-input');
      expect(input.name).toBe('terms');
      expect(input.closest('label')?.textContent).toContain('Accept terms');
    });

    it('toggles on click and updates the model', async () => {
      input.click();
      await settle(fixture);
      expect(fixture.componentInstance.checked()).toBe(true);
      expect(host.classList).toContain('ui-checkbox--checked');
    });

    it('reflects the model', async () => {
      fixture.componentInstance.checked.set(true);
      await settle(fixture);
      expect(input.checked).toBe(true);
    });

    it('supports indeterminate and clears it on toggle', async () => {
      fixture.componentInstance.indeterminate.set(true);
      await settle(fixture);
      expect(input.indeterminate).toBe(true);
      input.click();
      await settle(fixture);
      expect(fixture.componentInstance.indeterminate()).toBe(false);
      expect(fixture.componentInstance.checked()).toBe(true);
    });

    it('disables the native input', async () => {
      fixture.componentInstance.disabled.set(true);
      await settle(fixture);
      expect(input.disabled).toBe(true);
      expect(host.classList).toContain('ui-checkbox--disabled');
    });

    it('is keyboard focusable and forwards aria-label', () => {
      input.focus();
      expect(document.activeElement).toBe(input);
      const unlabelled = (fixture.nativeElement as HTMLElement).querySelectorAll('input')[1];
      expect(unlabelled.getAttribute('aria-label')).toBe('Select row');
      expect(unlabelled.closest('ui-checkbox')!.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('with Reactive Forms', () => {
    let fixture: ComponentFixture<ReactiveHost>;
    let control: ReactiveHost['control'];
    let loader: HarnessLoader;
    let checkbox: UiCheckboxHarness;
    /** The message `ui-form-field` shows under the checkbox. */
    const error = (): HTMLElement =>
      (fixture.nativeElement as HTMLElement).querySelector('.ui-form-field__error')!;

    beforeEach(async () => {
      fixture = TestBed.createComponent(ReactiveHost);
      control = fixture.componentInstance.control;
      loader = TestbedHarnessEnvironment.loader(fixture);
      await settle(fixture);
      checkbox = await loader.getHarness(UiCheckboxHarness.with({ label: 'Subscribe' }));
    });

    it('binds checked both ways and marks the field required', async () => {
      expect(await checkbox.isChecked()).toBe(false);
      expect(await checkbox.isRequired()).toBe(true);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.ui-form-field__required'),
      ).not.toBeNull();

      await checkbox.check();
      expect(control.value).toBe(true);

      control.setValue(false);
      await settle(fixture);
      expect(await checkbox.isChecked()).toBe(false);
    });

    it('disables the checkbox from the control', async () => {
      control.disable();
      await settle(fixture);
      expect(await checkbox.isDisabled()).toBe(true);
    });

    it('marks the control touched when the user leaves it', async () => {
      expect(control.touched).toBe(false);
      await checkbox.focus();
      await checkbox.blur();
      expect(control.touched).toBe(true);
    });

    it('shows the validator message only once the control is invalid and touched', async () => {
      expect(control.invalid).toBe(true);
      expect(await checkbox.isInvalid()).toBe(false);
      expect(error().textContent.trim()).toBe('');

      await checkbox.focus();
      await checkbox.blur();
      await settle(fixture);
      expect(await checkbox.isInvalid()).toBe(true);
      expect(error().textContent).toContain('Accept the terms to continue');
      expect(
        (fixture.nativeElement as HTMLElement)
          .querySelector('input')!
          .getAttribute('aria-describedby'),
      ).toBe(error().id);

      await checkbox.check();
      await settle(fixture);
      expect(control.valid).toBe(true);
      expect(await checkbox.isInvalid()).toBe(false);
      expect(error().textContent.trim()).toBe('');
    });
  });
});

@Component({
  imports: [UiCheckbox],
  // Simulates a bare attribute in non-strict templates (strictTemplates rejects it at compile time).
  template: `<ui-checkbox [checked]="$any('')">A</ui-checkbox
    ><ui-checkbox [indeterminate]="$any('')">B</ui-checkbox>`,
})
class StaticAttributeHost {}

describe('UiCheckbox static attributes', () => {
  it('treats bare checked/indeterminate attributes as true', async () => {
    const fixture = TestBed.createComponent(StaticAttributeHost);
    await settle(fixture);
    const [a, b] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('input'));
    expect(a.checked).toBe(true);
    expect(b.indeterminate).toBe(true);
  });
});

@Component({
  imports: [ReactiveFormsModule, UiCheckbox],
  template: `
    <ui-checkbox [formControl]="agree" [readonly]="true">Agree</ui-checkbox>
    <ui-checkbox [readonly]="true" [(checked)]="plain">Plain</ui-checkbox>
  `,
})
class ReadonlyHost {
  readonly agree = new FormControl(true);
  readonly plain = signal(false);
}

describe('UiCheckbox readonly', () => {
  it('keeps its state on click and reports aria-readonly, also for a bound control', async () => {
    const fixture = TestBed.createComponent(ReadonlyHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await settle(fixture);
    const [bound, plain] = await loader.getAllHarnesses(UiCheckboxHarness);
    await bound.toggle();
    await plain.toggle();
    await settle(fixture);
    expect(fixture.componentInstance.agree.value).toBe(true);
    expect(await bound.isChecked()).toBe(true);
    expect(fixture.componentInstance.plain()).toBe(false);
    expect(await plain.isChecked()).toBe(false);
    expect(await bound.isReadonly()).toBe(true);
    expect(await plain.isReadonly()).toBe(true);
    // Readonly is not disabled: the checkbox stays focusable.
    expect(await bound.isDisabled()).toBe(false);
  });
});

@Component({
  imports: [FormsModule, ReactiveFormsModule, UiCheckbox],
  template: `
    <ui-checkbox name="terms" required [(ngModel)]="terms">Terms</ui-checkbox>
    <ui-checkbox [formControl]="privacy">Privacy</ui-checkbox>
  `,
})
class RequiredHost {
  readonly terms = signal(false);
  readonly privacy = new FormControl(false, Validators.required);
  readonly ngModel = viewChild.required(NgModel);
}

describe('UiCheckbox required', () => {
  it('is invalid until checked with ngModel + required or Validators.required', async () => {
    const fixture = TestBed.createComponent(RequiredHost);
    await settle(fixture);
    const host = fixture.componentInstance;
    const [terms, privacy] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('input'),
    );
    expect(host.ngModel().invalid).toBe(true);
    expect(host.privacy.hasError('required')).toBe(true);

    terms.click();
    privacy.click();
    await settle(fixture);
    expect(host.ngModel().valid).toBe(true);
    expect(host.privacy.valid).toBe(true);
  });
});

@Component({
  imports: [ReactiveFormsModule, UiCheckbox],
  template: `<ui-checkbox [formControl]="control">Terms ({{ reason() }})</ui-checkbox>`,
})
class ConditionalRequiredHost {
  readonly control = new FormControl(false);
  readonly reason = signal('optional');
  requireTerms(): void {
    this.control.setValidators(Validators.requiredTrue);
    this.reason.set('required for new plans');
  }
}

describe('UiCheckbox validators set at runtime', () => {
  it('shows the required state after setValidators, which emits no event', async () => {
    const fixture = TestBed.createComponent(ConditionalRequiredHost);
    await settle(fixture);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(input.required).toBe(false);
    fixture.componentInstance.requireTerms();
    await settle(fixture);
    expect(input.required).toBe(true);
  });
});

@Component({
  imports: [UiCheckbox, UiFormField],
  template: `
    <p id="terms-note">Read the terms first</p>
    <ui-form-field hint="Required for new plans">
      <ui-checkbox aria-describedby="terms-note">Terms</ui-checkbox>
    </ui-form-field>
  `,
})
class DescribedHost {}

describe('UiCheckbox aria-describedby', () => {
  it('keeps the app description before the form-field hint on the native input', async () => {
    const fixture = TestBed.createComponent(DescribedHost);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const ids = root.querySelector('input')!.getAttribute('aria-describedby')!.split(' ');
    expect(ids[0]).toBe('terms-note');
    expect(document.getElementById(ids[1])?.textContent).toContain('Required for new plans');
    expect(root.querySelector('ui-checkbox')!.hasAttribute('aria-describedby')).toBe(false);
  });
});

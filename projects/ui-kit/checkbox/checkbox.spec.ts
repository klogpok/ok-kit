import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, readonly, required } from '@angular/forms/signals';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
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

@Component({
  imports: [ReactiveFormsModule, UiCheckbox, UiFormField, UiError],
  template: `
    <ui-form-field>
      <ui-checkbox [formControl]="control">Subscribe</ui-checkbox>
      <ui-error>Required</ui-error>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl(false, Validators.requiredTrue);
}

@Component({
  imports: [FormField, UiCheckbox, UiFormField],
  template: `
    <ui-form-field>
      <ui-checkbox [formField]="f.agree">Agree</ui-checkbox>
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal({ agree: false });
  readonly f = form(this.model, (p) => {
    required(p.agree, { message: 'You must agree' });
  });
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
    let input: HTMLInputElement;

    beforeEach(async () => {
      fixture = TestBed.createComponent(ReactiveHost);
      await settle(fixture);
      input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    });

    it('writes and reads values', async () => {
      fixture.componentInstance.control.setValue(true);
      await settle(fixture);
      expect(input.checked).toBe(true);

      input.click();
      expect(fixture.componentInstance.control.value).toBe(false);
    });

    it('marks touched on blur and shows the linked error', async () => {
      input.dispatchEvent(new Event('blur'));
      await settle(fixture);
      expect(fixture.componentInstance.control.touched).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.required).toBe(true);
      const error = (fixture.nativeElement as HTMLElement).querySelector('.ui-form-field__error')!;
      expect(input.getAttribute('aria-describedby')).toBe(error.id);
    });

    it('follows control.disable()', async () => {
      fixture.componentInstance.control.disable();
      await settle(fixture);
      expect(input.disabled).toBe(true);
    });
  });

  describe('with Signal Forms', () => {
    let fixture: ComponentFixture<SignalHost>;
    let input: HTMLInputElement;

    beforeEach(async () => {
      fixture = TestBed.createComponent(SignalHost);
      await settle(fixture);
      input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    });

    it('binds checked both ways', async () => {
      input.click();
      await settle(fixture);
      expect(fixture.componentInstance.model().agree).toBe(true);

      fixture.componentInstance.model.set({ agree: false });
      await settle(fixture);
      expect(input.checked).toBe(false);
    });

    it('marks the field touched on blur and shows validator messages', async () => {
      input.dispatchEvent(new Event('blur'));
      await settle(fixture);
      expect(fixture.componentInstance.f.agree().touched()).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('You must agree');
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
  imports: [FormField, UiCheckbox],
  template: `
    <ui-checkbox [formField]="f.agree">Agree</ui-checkbox>
    <ui-checkbox [readonly]="true" [(checked)]="plain">Plain</ui-checkbox>
  `,
})
class ReadonlyHost {
  readonly model = signal({ agree: true });
  readonly f = form(this.model, (p) => {
    readonly(p.agree);
  });
  readonly plain = signal(false);
}

describe('UiCheckbox readonly', () => {
  it('keeps its state on click and reports aria-readonly, also from a Signal Forms rule', async () => {
    const fixture = TestBed.createComponent(ReadonlyHost);
    await settle(fixture);
    const [bound, plain] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('input'),
    );
    bound.click();
    plain.click();
    await settle(fixture);
    expect(fixture.componentInstance.model().agree).toBe(true);
    expect(bound.checked).toBe(true);
    expect(fixture.componentInstance.plain()).toBe(false);
    expect(plain.checked).toBe(false);
    expect(bound.getAttribute('aria-readonly')).toBe('true');
    expect(plain.getAttribute('aria-readonly')).toBe('true');
    expect(bound.disabled).toBe(false);
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

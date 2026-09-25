import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
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

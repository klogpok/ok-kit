import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiInput, UiTextarea } from '@vplans/ui-kit/input';
import { UiError, UiFormField, UiHint, UiPrefix, UiSuffix } from './form-field';

function query<T extends Element = HTMLElement>(
  fixture: ComponentFixture<unknown>,
  selector: string,
): T {
  return (fixture.nativeElement as HTMLElement).querySelector<T>(selector)!;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiInput, UiError],
  template: `
    <ui-form-field label="Email" hint="Work address">
      <input ui-input [formControl]="email" />
      @if (email.hasError('required')) {
        <ui-error>Email is required</ui-error>
      }
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly email = new FormControl('', Validators.required);
}

@Component({
  imports: [FormField, UiFormField, UiInput],
  template: `
    <ui-form-field label="Name">
      <input ui-input [formField]="f.name" />
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal({ name: '' });
  readonly f = form(this.model, (path) => {
    required(path.name, { message: 'Name is required' });
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
    let inputEl: HTMLInputElement;

    beforeEach(async () => {
      fixture = TestBed.createComponent(ReactiveHost);
      await settle(fixture);
      inputEl = query<HTMLInputElement>(fixture, 'input');
    });

    it('links label to the input via for/id', () => {
      const label = query<HTMLLabelElement>(fixture, 'label');
      expect(inputEl.id).toMatch(/^ui-input-/);
      expect(label.htmlFor).toBe(inputEl.id);
      expect(label.textContent).toContain('Email');
    });

    it('shows the required marker from Validators.required', () => {
      expect(inputEl.getAttribute('aria-required')).toBe('true');
      expect(query(fixture, '.ui-form-field__required')).not.toBeNull();
    });

    it('describes the input with the hint while valid or untouched', () => {
      const hint = query(fixture, '.ui-form-field__hint');
      expect(inputEl.getAttribute('aria-describedby')).toBe(hint.id);
      expect(hint.hidden).toBe(false);
      expect(inputEl.hasAttribute('aria-invalid')).toBe(false);
    });

    it('shows the error after the control is touched and links it', async () => {
      inputEl.dispatchEvent(new Event('blur'));
      await settle(fixture);

      const error = query(fixture, '.ui-form-field__error');
      expect(inputEl.getAttribute('aria-invalid')).toBe('true');
      expect(inputEl.classList).toContain('ui-input--invalid');
      expect(error.hidden).toBe(false);
      expect(error.textContent).toContain('Email is required');
      expect(error.getAttribute('aria-live')).toBe('polite');
      expect(inputEl.getAttribute('aria-describedby')).toBe(error.id);
      expect(query(fixture, '.ui-form-field__hint').hidden).toBe(true);
    });

    it('reacts to programmatic markAsTouched and value changes', async () => {
      fixture.componentInstance.email.markAsTouched();
      await settle(fixture);
      expect(inputEl.getAttribute('aria-invalid')).toBe('true');

      inputEl.value = 'a@b.c';
      inputEl.dispatchEvent(new Event('input'));
      await settle(fixture);
      expect(inputEl.hasAttribute('aria-invalid')).toBe(false);
    });

    it('reflects the disabled state on the field', async () => {
      fixture.componentInstance.email.disable();
      await settle(fixture);
      expect(inputEl.disabled).toBe(true);
      expect(query(fixture, 'ui-form-field').classList).toContain('ui-form-field--disabled');
    });
  });

  describe('with Signal Forms', () => {
    let fixture: ComponentFixture<SignalHost>;
    let inputEl: HTMLInputElement;

    beforeEach(async () => {
      fixture = TestBed.createComponent(SignalHost);
      await settle(fixture);
      inputEl = query<HTMLInputElement>(fixture, 'input');
    });

    it('binds the value both ways', async () => {
      inputEl.value = 'Ada';
      inputEl.dispatchEvent(new Event('input'));
      await settle(fixture);
      expect(fixture.componentInstance.model().name).toBe('Ada');

      fixture.componentInstance.model.set({ name: 'Grace' });
      await settle(fixture);
      expect(inputEl.value).toBe('Grace');
    });

    it('marks required and shows validator messages after touch', async () => {
      expect(inputEl.getAttribute('aria-required')).toBe('true');
      expect(inputEl.hasAttribute('aria-invalid')).toBe(false);

      inputEl.dispatchEvent(new Event('blur'));
      await settle(fixture);

      const error = query(fixture, '.ui-form-field__error');
      expect(inputEl.getAttribute('aria-invalid')).toBe('true');
      expect(error.textContent).toContain('Name is required');
      expect(inputEl.getAttribute('aria-describedby')).toBe(error.id);
    });
  });

  describe('without forms', () => {
    let fixture: ComponentFixture<ManualHost>;

    beforeEach(async () => {
      fixture = TestBed.createComponent(ManualHost);
      await settle(fixture);
    });

    it('respects a user-provided id', () => {
      expect(query<HTMLLabelElement>(fixture, 'label').htmlFor).toBe('notes');
    });

    it('uses projected hint and toggles the error via the invalid input', async () => {
      const textarea = query<HTMLTextAreaElement>(fixture, 'textarea');
      expect(textarea.getAttribute('aria-describedby')).toBe(
        query(fixture, '.ui-form-field__hint').id,
      );
      expect(query(fixture, '.ui-form-field__error').hidden).toBe(true);

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
    const toggle = query<HTMLButtonElement>(fixture, '#toggle');
    toggle.focus();
    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(toggle);
    expect(query<HTMLInputElement>(fixture, 'input').type).toBe('text');
  });

  it('reflects the invalid state on the field box', async () => {
    fixture.componentInstance.invalid.set(true);
    await settle(fixture);
    expect(query(fixture, 'ui-form-field').classList).toContain('ui-form-field--invalid');
  });
});

import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiRadio, UiRadioGroup } from './radio';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [UiRadioGroup, UiRadio, UiFormField],
  template: `
    <ui-form-field label="Delivery" hint="Choose one">
      <ui-radio-group [(value)]="value" [disabled]="disabled()" orientation="horizontal">
        <ui-radio value="pickup">Pickup</ui-radio>
        <ui-radio value="courier">Courier</ui-radio>
        <ui-radio value="drone" disabled>Drone</ui-radio>
      </ui-radio-group>
    </ui-form-field>
  `,
})
class StandaloneHost {
  readonly value = signal<string | null>(null);
  readonly disabled = signal(false);
  readonly group = viewChild.required(UiRadioGroup);
}

@Component({
  imports: [UiRadioGroup, UiRadio, ReactiveFormsModule],
  template: `
    <ui-radio-group [formControl]="control" aria-label="Size">
      <ui-radio [value]="1">S</ui-radio>
      <ui-radio [value]="2">M</ui-radio>
    </ui-radio-group>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<number | null>(2, Validators.required);
}

@Component({
  imports: [UiRadioGroup, UiRadio, FormField, UiFormField],
  template: `
    <ui-form-field label="Plan">
      <ui-radio-group [formField]="f.plan">
        <ui-radio value="free">Free</ui-radio>
        <ui-radio value="pro">Pro</ui-radio>
      </ui-radio-group>
    </ui-form-field>
  `,
})
class SignalHost {
  readonly model = signal({ plan: '' });
  readonly f = form(this.model, (p) => {
    required(p.plan, { message: 'Pick a plan' });
  });
}

describe('UiRadioGroup', () => {
  describe('standalone', () => {
    let fixture: ComponentFixture<StandaloneHost>;
    let el: HTMLElement;
    let radios: HTMLInputElement[];

    beforeEach(async () => {
      fixture = TestBed.createComponent(StandaloneHost);
      await settle(fixture);
      el = fixture.nativeElement as HTMLElement;
      radios = Array.from(el.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    });

    it('renders a radiogroup labelled and described by the form field', () => {
      const group = el.querySelector('ui-radio-group')!;
      const label = el.querySelector('label.ui-form-field__label')!;
      expect(group.getAttribute('role')).toBe('radiogroup');
      expect(group.getAttribute('aria-labelledby')).toBe(label.id);
      expect(label.hasAttribute('for')).toBe(false);
      expect(group.getAttribute('aria-describedby')).toBe(el.querySelector('.ui-form-field__hint')!.id);
      expect(group.classList).toContain('ui-radio-group--horizontal');
    });

    it('shares one generated name between native radios', () => {
      const names = new Set(radios.map((r) => r.name));
      expect(names.size).toBe(1);
      expect([...names][0]).toMatch(/^ui-radio-group-name-/);
    });

    it('selects on click and updates the model', async () => {
      radios[1].click();
      await settle(fixture);
      expect(fixture.componentInstance.value()).toBe('courier');
      expect(radios[1].checked).toBe(true);
      expect(el.querySelectorAll('ui-radio')[1].classList).toContain('ui-radio--checked');
    });

    it('reflects the model', async () => {
      fixture.componentInstance.value.set('pickup');
      await settle(fixture);
      expect(radios[0].checked).toBe(true);
    });

    it('disables individual radios and the whole group', async () => {
      expect(radios[2].disabled).toBe(true);
      expect(radios[0].disabled).toBe(false);
      fixture.componentInstance.disabled.set(true);
      await settle(fixture);
      expect(radios.every((r) => r.disabled)).toBe(true);
      expect(el.querySelector('ui-radio-group')!.getAttribute('aria-disabled')).toBe('true');
    });

    it('focus() targets the checked radio, or the first enabled one', async () => {
      fixture.componentInstance.group().focus();
      expect(document.activeElement).toBe(radios[0]);

      fixture.componentInstance.value.set('courier');
      await settle(fixture);
      fixture.componentInstance.group().focus();
      expect(document.activeElement).toBe(radios[1]);
    });
  });

  describe('with Reactive Forms', () => {
    it('writes/reads values, marks touched and follows disable()', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      await settle(fixture);
      const el = fixture.nativeElement as HTMLElement;
      const radios = el.querySelectorAll<HTMLInputElement>('input');
      const control = fixture.componentInstance.control;

      expect(radios[1].checked).toBe(true);
      expect(el.querySelector('ui-radio-group')!.getAttribute('aria-required')).toBe('true');
      expect(el.querySelector('ui-radio-group')!.getAttribute('aria-label')).toBe('Size');

      radios[0].click();
      expect(control.value).toBe(1);

      radios[0].dispatchEvent(new Event('blur'));
      expect(control.touched).toBe(true);

      control.disable();
      await settle(fixture);
      expect(radios[0].disabled).toBe(true);
    });
  });

  describe('with Signal Forms', () => {
    it('binds the value and shows validation after touch', async () => {
      const fixture = TestBed.createComponent(SignalHost);
      await settle(fixture);
      const el = fixture.nativeElement as HTMLElement;
      const radios = el.querySelectorAll<HTMLInputElement>('input');
      const group = el.querySelector('ui-radio-group')!;

      radios[0].dispatchEvent(new Event('blur'));
      await settle(fixture);
      expect(group.getAttribute('aria-invalid')).toBe('true');
      expect(el.textContent).toContain('Pick a plan');

      radios[1].click();
      await settle(fixture);
      expect(fixture.componentInstance.model().plan).toBe('pro');
      expect(group.hasAttribute('aria-invalid')).toBe(false);
    });
  });
});

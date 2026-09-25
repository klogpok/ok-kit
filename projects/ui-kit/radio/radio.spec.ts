import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, readonly, required } from '@angular/forms/signals';
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
      expect(group.getAttribute('aria-describedby')).toBe(
        el.querySelector('.ui-form-field__hint')!.id,
      );
      expect(group.classList).toContain('ui-radio-group--horizontal');
    });

    it('focuses the selected or first radio when the field label is clicked', () => {
      const el = fixture.nativeElement as HTMLElement;
      el.querySelector<HTMLElement>('label.ui-form-field__label')!.click();
      expect(document.activeElement).toBe(el.querySelector('input'));
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

interface City {
  id: number;
  name: string;
}

@Component({
  imports: [UiRadioGroup, UiRadio, ReactiveFormsModule],
  template: `
    <ui-radio-group [formControl]="control" [compareWith]="byId" aria-label="City">
      @for (city of cities; track city.id) {
        <ui-radio [value]="city">{{ city.name }}</ui-radio>
      }
    </ui-radio-group>
  `,
})
class CompareHost {
  readonly cities: City[] = [
    { id: 1, name: 'Haifa' },
    { id: 2, name: 'Eilat' },
  ];
  // A copy from the server, not one of the option objects.
  readonly control = new FormControl<City | null>({ id: 2, name: 'Eilat' });
  readonly calls: [City, City][] = [];
  readonly byId = (option: City, selected: City) => {
    this.calls.push([option, selected]);
    return option.id === selected.id;
  };
}

describe('UiRadioGroup with compareWith', () => {
  it('checks the option equal to an object value', async () => {
    const fixture = TestBed.createComponent(CompareHost);
    await settle(fixture);
    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll('input');
    expect(inputs[1].checked).toBe(true);
    expect(inputs[0].checked).toBe(false);
  });

  it('calls compareWith(option, selected) and never with null', async () => {
    const fixture = TestBed.createComponent(CompareHost);
    await settle(fixture);
    const host = fixture.componentInstance;
    const [option, selected] = host.calls[0];
    expect(host.cities).toContain(option);
    expect(selected).toBe(host.control.value);

    host.calls.length = 0;
    host.control.setValue(null);
    await settle(fixture);
    expect(host.calls).toEqual([]);
    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll('input');
    expect([...inputs].some((input) => input.checked)).toBe(false);
  });
});

@Component({
  imports: [FormField, UiRadioGroup, UiRadio],
  template: `
    <ui-radio-group aria-label="Delivery" aria-describedby="delivery-note" [formField]="f.delivery">
      <ui-radio value="pickup">Pickup</ui-radio>
      <ui-radio value="courier" aria-label="Courier delivery">Courier</ui-radio>
    </ui-radio-group>
  `,
})
class ReadonlyRadioHost {
  readonly model = signal({ delivery: 'pickup' });
  readonly f = form(this.model, (p) => {
    readonly(p.delivery);
  });
}

describe('UiRadioGroup readonly', () => {
  it('keeps the selection under a Signal Forms readonly rule', async () => {
    const fixture = TestBed.createComponent(ReadonlyRadioHost);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const [pickup, courier] = Array.from(root.querySelectorAll('input'));
    courier.click();
    await settle(fixture);
    expect(fixture.componentInstance.model().delivery).toBe('pickup');
    expect(pickup.checked).toBe(true);
    expect(courier.checked).toBe(false);
    expect(root.querySelector('ui-radio-group')!.getAttribute('aria-readonly')).toBe('true');
    expect(root.querySelector('ui-radio-group')!.getAttribute('aria-describedby')).toBe(
      'delivery-note',
    );
  });

  it('moves the aria-label of a radio from its host to the native input', async () => {
    const fixture = TestBed.createComponent(ReadonlyRadioHost);
    await settle(fixture);
    const courier = (fixture.nativeElement as HTMLElement).querySelectorAll('ui-radio')[1];
    expect(courier.querySelector('input')!.getAttribute('aria-label')).toBe('Courier delivery');
    expect(courier.hasAttribute('aria-label')).toBe(false);
  });
});

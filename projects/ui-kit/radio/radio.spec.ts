import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
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

/** Stands in for an application validator with a message of its own. */
const inStock: ValidatorFn = (control) =>
  control.value === 2 ? { uiStock: { message: 'M is out of stock' } } : null;

@Component({
  imports: [UiRadioGroup, UiRadio, ReactiveFormsModule, UiFormField],
  template: `
    <ui-form-field label="Size">
      <ui-radio-group [formControl]="control">
        <ui-radio [value]="1">S</ui-radio>
        <ui-radio [value]="2">M</ui-radio>
      </ui-radio-group>
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly control = new FormControl<number | null>(2, [Validators.required, inStock]);
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
    let fixture: ComponentFixture<ReactiveHost>;
    let control: ReactiveHost['control'];
    let radios: HTMLInputElement[];
    const group = (): HTMLElement =>
      (fixture.nativeElement as HTMLElement).querySelector('ui-radio-group')!;
    /** The message `ui-form-field` shows under the group. */
    const error = (): HTMLElement =>
      (fixture.nativeElement as HTMLElement).querySelector('.ui-form-field__error')!;
    /** Leaves the group, the way a tab out of its last radio does. */
    const leaveGroup = (from: HTMLInputElement): void => {
      from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    };

    beforeEach(async () => {
      fixture = TestBed.createComponent(ReactiveHost);
      control = fixture.componentInstance.control;
      await settle(fixture);
      radios = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input'),
      );
    });

    it('binds the value both ways and marks the group required', async () => {
      expect(radios[1].checked).toBe(true);
      expect(group().getAttribute('aria-required')).toBe('true');
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.ui-form-field__required'),
      ).not.toBeNull();

      radios[0].click();
      await settle(fixture);
      expect(control.value).toBe(1);

      control.setValue(2);
      await settle(fixture);
      expect(radios[1].checked).toBe(true);
    });

    it('marks the control touched only once focus leaves the whole group', () => {
      // Moving between radios keeps focus in the group.
      radios[0].dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: radios[1] }),
      );
      expect(control.touched).toBe(false);

      leaveGroup(radios[1]);
      expect(control.touched).toBe(true);
    });

    it('disables every radio from the control', async () => {
      control.disable();
      await settle(fixture);
      expect(radios.every((radio) => radio.disabled)).toBe(true);
      expect(group().getAttribute('aria-disabled')).toBe('true');
    });

    it('shows the validator message only once the control is invalid and touched', async () => {
      expect(control.invalid).toBe(true);
      expect(group().hasAttribute('aria-invalid')).toBe(false);
      expect(error().textContent.trim()).toBe('');

      leaveGroup(radios[1]);
      await settle(fixture);
      expect(group().getAttribute('aria-invalid')).toBe('true');
      expect(error().textContent).toContain('M is out of stock');
      expect(group().getAttribute('aria-describedby')).toBe(error().id);

      radios[0].click();
      await settle(fixture);
      expect(control.valid).toBe(true);
      expect(group().hasAttribute('aria-invalid')).toBe(false);
      expect(error().textContent.trim()).toBe('');
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
  imports: [ReactiveFormsModule, UiRadioGroup, UiRadio],
  template: `
    <ui-radio-group
      aria-label="Delivery"
      aria-describedby="delivery-note"
      [readonly]="true"
      [formControl]="delivery"
    >
      <ui-radio value="pickup">Pickup</ui-radio>
      <ui-radio value="courier" aria-label="Courier delivery">Courier</ui-radio>
    </ui-radio-group>
  `,
})
class ReadonlyRadioHost {
  readonly delivery = new FormControl('pickup');
}

describe('UiRadioGroup readonly', () => {
  it('keeps the selection of a bound control under the readonly input', async () => {
    const fixture = TestBed.createComponent(ReadonlyRadioHost);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;
    const [pickup, courier] = Array.from(root.querySelectorAll('input'));
    courier.click();
    await settle(fixture);
    expect(fixture.componentInstance.delivery.value).toBe('pickup');
    expect(pickup.checked).toBe(true);
    expect(courier.checked).toBe(false);
    expect(root.querySelector('ui-radio-group')!.getAttribute('aria-readonly')).toBe('true');
    expect(root.querySelector('ui-radio-group')!.getAttribute('aria-describedby')).toBe(
      'delivery-note',
    );
  });

  it('prefers its own aria-label over the form-field label', async () => {
    TestBed.overrideTemplate(
      ReadonlyRadioHost,
      `<ui-form-field label="Delivery method">
        <ui-radio-group aria-label="Delivery" [formControl]="delivery">
          <ui-radio value="pickup">Pickup</ui-radio>
        </ui-radio-group>
      </ui-form-field>`,
    );
    TestBed.overrideComponent(ReadonlyRadioHost, {
      add: { imports: [UiFormField] },
    });
    const fixture = TestBed.createComponent(ReadonlyRadioHost);
    await settle(fixture);
    const group = (fixture.nativeElement as HTMLElement).querySelector('ui-radio-group')!;
    expect(group.getAttribute('aria-label')).toBe('Delivery');
    expect(group.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('moves the aria-label of a radio from its host to the native input', async () => {
    const fixture = TestBed.createComponent(ReadonlyRadioHost);
    await settle(fixture);
    const courier = (fixture.nativeElement as HTMLElement).querySelectorAll('ui-radio')[1];
    expect(courier.querySelector('input')!.getAttribute('aria-label')).toBe('Courier delivery');
    expect(courier.hasAttribute('aria-label')).toBe(false);
  });
});

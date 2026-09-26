import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiChipInput } from '@vplans/ui-kit/chip';
import { UiDatepicker } from '@vplans/ui-kit/datepicker';
import { UiFileUpload } from '@vplans/ui-kit/file-upload';
import { UiNumberInput } from '@vplans/ui-kit/number-input';
import { UiRadio, UiRadioGroup } from '@vplans/ui-kit/radio';
import { UiMultiSelect, UiOption, UiSelect } from '@vplans/ui-kit/select';
import { UiSwitch } from '@vplans/ui-kit/switch';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

const CONTROLS = [
  UiCheckbox,
  UiSwitch,
  UiRadioGroup,
  UiRadio,
  UiSelect,
  UiMultiSelect,
  UiOption,
  UiDatepicker,
  UiNumberInput,
  UiChipInput,
  UiFileUpload,
];

@Component({
  imports: [ReactiveFormsModule, ...CONTROLS],
  template: `
    <form [formGroup]="form">
      <ui-checkbox formControlName="terms">Terms</ui-checkbox>
      <ui-switch formControlName="alerts">Alerts</ui-switch>
      <ui-radio-group formControlName="size" aria-label="Size">
        <ui-radio value="s">S</ui-radio>
        <ui-radio value="m">M</ui-radio>
      </ui-radio-group>
      <ui-select formControlName="city" aria-label="City">
        <ui-option value="haifa">Haifa</ui-option>
        <ui-option value="eilat">Eilat</ui-option>
      </ui-select>
      <ui-multi-select formControlName="tags" aria-label="Tags">
        <ui-option value="a">A</ui-option>
        <ui-option value="b">B</ui-option>
      </ui-multi-select>
      <ui-datepicker formControlName="date" aria-label="Date" />
      <ui-number-input formControlName="units" aria-label="Units" />
      <ui-chip-input formControlName="labels" aria-label="Labels" />
      <ui-file-upload formControlName="plans" aria-label="Plans" multiple />
    </form>
  `,
})
class NamedHost {
  readonly form = new FormGroup({
    terms: new FormControl(true),
    alerts: new FormControl(false),
    size: new FormControl<string | null>('m'),
    city: new FormControl<string | null>('eilat'),
    tags: new FormControl<string[]>(['b']),
    date: new FormControl<Date | null>(new Date(2026, 8, 25)),
    units: new FormControl<number | null>(1200),
    labels: new FormControl<readonly string[]>(['north']),
    plans: new FormControl<readonly File[]>([new File(['x'], 'a.pdf')]),
  });
}

@Component({
  imports: [
    FormsModule,
    UiCheckbox,
    UiRadioGroup,
    UiRadio,
    UiSelect,
    UiOption,
    UiDatepicker,
    UiNumberInput,
    UiChipInput,
    UiFileUpload,
  ],
  template: `
    <ui-checkbox name="terms" [(ngModel)]="terms">Terms</ui-checkbox>
    <ui-radio-group name="size" aria-label="Size" [(ngModel)]="size">
      <ui-radio value="s">S</ui-radio>
      <ui-radio value="m">M</ui-radio>
    </ui-radio-group>
    <ui-select name="city" aria-label="City" [(ngModel)]="city">
      <ui-option value="haifa">Haifa</ui-option>
      <ui-option value="eilat">Eilat</ui-option>
    </ui-select>
    <ui-datepicker name="date" aria-label="Date" [(ngModel)]="date" />
    <ui-number-input name="units" aria-label="Units" [(ngModel)]="units" />
    <ui-chip-input name="labels" aria-label="Labels" [(ngModel)]="labels" />
    <ui-file-upload name="plans" aria-label="Plans" [(ngModel)]="plans" />
  `,
})
class NgModelHost {
  readonly terms = signal(false);
  readonly size = signal<string | null>('s');
  readonly city = signal<string | null>('haifa');
  readonly date = signal<Date | null>(null);
  readonly units = signal<number | null>(3);
  readonly labels = signal<readonly string[]>([]);
  readonly plans = signal<readonly File[]>([]);
}

describe('Custom form controls with formControlName', () => {
  it('show the group values and write user changes back', async () => {
    const fixture = TestBed.createComponent(NamedHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const inputs = root.querySelectorAll<HTMLInputElement>('input');
    const [terms, alerts, , medium] = [...inputs];
    expect(terms.checked).toBe(true);
    expect(alerts.checked).toBe(false);
    expect(medium.checked).toBe(true);
    const [city, tags] = [...root.querySelectorAll<HTMLElement>('.ui-select__control')];
    expect(city.textContent).toContain('Eilat');
    expect(tags.textContent).toContain('B');
    expect(root.querySelector<HTMLInputElement>('.ui-datepicker__input')!.value).toBe('25.9.2026');
    const units = root.querySelector<HTMLInputElement>('.ui-number-input__input')!;
    expect(units.value).toBe('1,200');
    expect(root.querySelector('ui-chip')!.textContent).toContain('north');
    expect(root.querySelector('.ui-file-upload__name')!.textContent).toBe('a.pdf');

    alerts.click();
    inputs[2].click();
    await settle(fixture);
    const form = fixture.componentInstance.form;
    expect(form.value.alerts).toBe(true);
    expect(form.value.size).toBe('s');
    units.value = '15';
    units.dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(form.value.units).toBe(15);
    root.querySelector<HTMLButtonElement>('.ui-chip__remove')!.click();
    await settle(fixture);
    expect(form.value.labels).toEqual([]);
    root.querySelector<HTMLButtonElement>('.ui-file-upload__remove')!.click();
    await settle(fixture);
    expect(form.value.plans).toEqual([]);

    form.disable();
    await settle(fixture);
    expect(
      [...root.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')]
        .filter((el) => !el.closest('.ui-datepicker__toggle, ui-dialog-container'))
        .every((el) => el.disabled),
    ).toBe(true);
    root.remove();
  });
});

describe('Custom form controls with ngModel', () => {
  it('bind both ways', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const host = fixture.componentInstance;
    const inputs = root.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"], input[type="radio"]',
    );
    expect(inputs[1].checked).toBe(true);
    expect(root.querySelector('.ui-select__control')!.textContent).toContain('Haifa');

    inputs[0].click();
    inputs[2].click();
    const date = root.querySelector<HTMLInputElement>('.ui-datepicker__input')!;
    date.value = '1.10.2026';
    date.dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(host.terms()).toBe(true);
    expect(host.size()).toBe('m');
    expect(host.date()).toEqual(new Date(2026, 9, 1));
    const units = root.querySelector<HTMLInputElement>('.ui-number-input__input')!;
    expect(units.value).toBe('3');
    units.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    await settle(fixture);
    expect(host.units()).toBe(4);
    const labels = root.querySelector<HTMLInputElement>('.ui-chip-input__input')!;
    labels.value = 'east';
    labels.dispatchEvent(new Event('input'));
    labels.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    await settle(fixture);
    expect(host.labels()).toEqual(['east']);
    const picker = root.querySelector<HTMLInputElement>('input[type=file]')!;
    const plan = new File(['x'], 'b.pdf');
    Object.defineProperty(picker, 'files', { value: [plan] });
    picker.dispatchEvent(new Event('change'));
    await settle(fixture);
    expect(host.plans()).toEqual([plan]);

    host.city.set('eilat');
    await settle(fixture);
    expect(root.querySelector('.ui-select__control')!.textContent).toContain('Eilat');
    root.remove();
  });
});

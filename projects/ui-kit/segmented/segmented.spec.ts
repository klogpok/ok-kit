import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormField, form, readonly, required } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiSegment, UiSegmented } from './segmented';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function press(target: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

@Component({
  imports: [UiSegmented, UiSegment, UiFormField],
  template: `
    <div [attr.dir]="dir()">
      <ui-form-field label="View" hint="How to show the plans">
        <ui-segmented
          [(value)]="value"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [fullWidth]="fullWidth()"
          [orientation]="orientation()"
          size="sm"
        >
          <ui-segment value="list">List</ui-segment>
          <ui-segment value="board">Board</ui-segment>
          <ui-segment value="map" disabled>Map</ui-segment>
          <ui-segment value="calendar" aria-label="Calendar"
            ><span uiSegmentIcon>C</span></ui-segment
          >
        </ui-segmented>
      </ui-form-field>
    </div>
  `,
})
class StandaloneHost {
  readonly value = signal<string | null>('list');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly fullWidth = signal(false);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly control = viewChild.required(UiSegmented);
}

describe('UiSegmented', () => {
  let fixture: ComponentFixture<StandaloneHost>;
  let host: StandaloneHost;
  let root: HTMLElement;
  let group: HTMLElement;
  let radios: HTMLInputElement[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(StandaloneHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    group = root.querySelector('ui-segmented')!;
    radios = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  });

  afterEach(() => root.remove());

  it('is a radiogroup labelled and described by the form field', () => {
    const label = root.querySelector('label.ui-form-field__label')!;
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.hasAttribute('for')).toBe(false);
    expect(group.getAttribute('aria-describedby')).toBe(
      root.querySelector('.ui-form-field__hint')!.id,
    );
    expect(group.classList).toContain('ui-segmented--sm');
  });

  it('uses native radios that share a generated name', () => {
    expect(radios).toHaveLength(4);
    const names = new Set(radios.map((radio) => radio.name));
    expect(names.size).toBe(1);
    expect([...names][0]).toMatch(/^ui-segmented-name-/);
    expect(radios[0].closest('label')!.textContent.trim()).toBe('List');
  });

  it('moves the aria-label of an icon-only segment to its radio', () => {
    const segment = root.querySelectorAll('ui-segment')[3];
    expect(segment.hasAttribute('aria-label')).toBe(false);
    expect(radios[3].getAttribute('aria-label')).toBe('Calendar');
  });

  it('reflects the value and selects on click', async () => {
    expect(radios[0].checked).toBe(true);
    expect(root.querySelector('ui-segment')!.classList).toContain('ui-segment--checked');
    radios[1].click();
    await settle(fixture);
    expect(host.value()).toBe('board');
    host.value.set('calendar');
    await settle(fixture);
    expect(radios[3].checked).toBe(true);
    host.value.set(null);
    await settle(fixture);
    expect(radios.some((radio) => radio.checked)).toBe(false);
  });

  it('selects the next or previous enabled segment with the arrow keys, wrapping', async () => {
    radios[0].focus();
    expect(press(radios[0], 'ArrowRight').defaultPrevented).toBe(true);
    await settle(fixture);
    expect(host.value()).toBe('board');
    expect(document.activeElement).toBe(radios[1]);

    press(radios[1], 'ArrowDown');
    await settle(fixture);
    expect(host.value()).toBe('calendar');
    expect(document.activeElement).toBe(radios[3]);

    press(radios[3], 'ArrowRight');
    await settle(fixture);
    expect(host.value()).toBe('list');

    press(radios[0], 'ArrowUp');
    await settle(fixture);
    expect(host.value()).toBe('calendar');

    press(radios[3], 'ArrowLeft');
    await settle(fixture);
    expect(host.value()).toBe('board');
  });

  it('mirrors ←/→ in RTL but keeps ↑/↓', async () => {
    host.dir.set('rtl');
    await settle(fixture);
    press(radios[0], 'ArrowLeft');
    await settle(fixture);
    expect(host.value()).toBe('board');
    press(radios[1], 'ArrowRight');
    await settle(fixture);
    expect(host.value()).toBe('list');
    press(radios[0], 'ArrowDown');
    await settle(fixture);
    expect(host.value()).toBe('board');
  });

  it('selects the first and the last enabled segment with Home and End', async () => {
    radios[0].focus();
    expect(press(radios[0], 'End').defaultPrevented).toBe(true);
    await settle(fixture);
    expect(host.value()).toBe('calendar');
    expect(document.activeElement).toBe(radios[3]);
    press(radios[3], 'Home');
    await settle(fixture);
    expect(host.value()).toBe('list');
    expect(document.activeElement).toBe(radios[0]);
  });

  it('ignores other keys and modified arrows', () => {
    expect(press(radios[0], 'PageDown').defaultPrevented).toBe(false);
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    radios[0].dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(host.value()).toBe('list');
  });

  it('keeps the selection when readonly: the arrows only move focus', async () => {
    host.readonly.set(true);
    await settle(fixture);
    expect(group.getAttribute('aria-readonly')).toBe('true');
    radios[0].focus();
    press(radios[0], 'ArrowRight');
    await settle(fixture);
    expect(document.activeElement).toBe(radios[1]);
    expect(host.value()).toBe('list');
    radios[1].click();
    await settle(fixture);
    expect(host.value()).toBe('list');
    expect(radios[0].checked).toBe(true);
  });

  it('disables single segments and the whole control', async () => {
    expect(radios[2].disabled).toBe(true);
    expect(radios[0].disabled).toBe(false);
    host.disabled.set(true);
    await settle(fixture);
    expect(radios.every((radio) => radio.disabled)).toBe(true);
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(group.classList).toContain('ui-segmented--disabled');
  });

  it('stretches with fullWidth', async () => {
    host.fullWidth.set(true);
    await settle(fixture);
    expect(group.classList).toContain('ui-segmented--full-width');
  });

  it('reports its orientation and stacks the segments when vertical', async () => {
    expect(group.getAttribute('aria-orientation')).toBe('horizontal');
    expect(group.classList).not.toContain('ui-segmented--vertical');
    host.orientation.set('vertical');
    await settle(fixture);
    expect(group.getAttribute('aria-orientation')).toBe('vertical');
    expect(group.classList).toContain('ui-segmented--vertical');
  });

  it('focus() and a click on the field label focus the selected segment', async () => {
    root.querySelector<HTMLElement>('label.ui-form-field__label')!.click();
    expect(document.activeElement).toBe(radios[0]);
    host.value.set('board');
    await settle(fixture);
    host.control().focus();
    expect(document.activeElement).toBe(radios[1]);
    host.value.set(null);
    await settle(fixture);
    radios[3].focus();
    host.control().focus();
    expect(document.activeElement).toBe(radios[0]);
  });
});

@Component({
  imports: [UiSegmented, UiSegment, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-segmented formControlName="unit" aria-label="Unit">
        <ui-segment value="m2">m²</ui-segment>
        <ui-segment value="ft2">ft²</ui-segment>
      </ui-segmented>
    </form>
    <button type="button">Outside</button>
  `,
})
class ReactiveHost {
  readonly form = new FormGroup({
    unit: new FormControl<string | null>('ft2', Validators.required),
  });
}

describe('UiSegmented with Reactive Forms', () => {
  it('writes and reads values, marks touched when focus leaves and follows disable()', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const control = fixture.componentInstance.form.controls.unit;
    const radios = root.querySelectorAll<HTMLInputElement>('input');
    const group = root.querySelector('ui-segmented')!;
    expect(radios[1].checked).toBe(true);
    expect(group.getAttribute('aria-required')).toBe('true');

    radios[0].click();
    await settle(fixture);
    expect(control.value).toBe('m2');

    radios[0].focus();
    press(radios[0], 'ArrowRight');
    await settle(fixture);
    expect(control.value).toBe('ft2');
    expect(control.touched).toBe(false);
    root.querySelector('button')!.focus();
    expect(control.touched).toBe(true);

    control.setValue(null);
    await settle(fixture);
    expect(group.getAttribute('aria-invalid')).toBe('true');

    control.disable();
    await settle(fixture);
    expect([...radios].every((radio) => radio.disabled)).toBe(true);
    root.remove();
  });
});

@Component({
  imports: [UiSegmented, UiSegment, FormsModule],
  template: `
    <ui-segmented name="period" aria-label="Period" [(ngModel)]="period">
      <ui-segment value="week">Week</ui-segment>
      <ui-segment value="month">Month</ui-segment>
    </ui-segmented>
  `,
})
class NgModelHost {
  readonly period = signal<string | null>('week');
}

describe('UiSegmented with ngModel', () => {
  it('binds both ways and uses the name', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    await settle(fixture);
    const radios = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input',
    );
    expect(radios[0].checked).toBe(true);
    expect(radios[0].name).toBe('period');
    radios[1].click();
    await settle(fixture);
    expect(fixture.componentInstance.period()).toBe('month');
    fixture.componentInstance.period.set('week');
    await settle(fixture);
    expect(radios[0].checked).toBe(true);
  });
});

@Component({
  imports: [UiSegmented, UiSegment, FormField, UiFormField],
  template: `
    <ui-form-field label="Scope">
      <ui-segmented [formField]="f.scope">
        <ui-segment value="mine">Mine</ui-segment>
        <ui-segment value="all">All</ui-segment>
      </ui-segmented>
    </ui-form-field>
  `,
})
class SignalHost {
  readonly locked = signal(false);
  readonly model = signal<{ scope: string | null }>({ scope: null });
  readonly f = form(this.model, (p) => {
    required(p.scope, { message: 'Choose a scope' });
    readonly(p.scope, () => this.locked());
  });
}

describe('UiSegmented with Signal Forms', () => {
  it('binds the value, shows the error after touch and follows a readonly rule', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const host = fixture.componentInstance;
    const group = root.querySelector('ui-segmented')!;
    const radios = root.querySelectorAll<HTMLInputElement>('input');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(group.getAttribute('aria-invalid')).toBeNull();

    radios[0].focus();
    radios[0].blur();
    await settle(fixture);
    expect(host.f.scope().touched()).toBe(true);
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('.ui-form-field__error')!.textContent).toContain('Choose a scope');

    radios[1].click();
    await settle(fixture);
    expect(host.model().scope).toBe('all');
    expect(group.getAttribute('aria-invalid')).toBeNull();

    host.model.set({ scope: 'mine' });
    await settle(fixture);
    expect(radios[0].checked).toBe(true);

    host.locked.set(true);
    await settle(fixture);
    expect(group.getAttribute('aria-readonly')).toBe('true');
    radios[1].click();
    await settle(fixture);
    expect(host.model().scope).toBe('mine');
    root.remove();
  });
});

interface Plan {
  id: number;
  name: string;
}

@Component({
  imports: [UiSegmented, UiSegment],
  template: `
    <ui-segmented aria-label="Plan" [(value)]="value" [compareWith]="byId">
      @for (plan of plans; track plan.id) {
        <ui-segment [value]="plan">{{ plan.name }}</ui-segment>
      }
    </ui-segmented>
  `,
})
class CompareHost {
  readonly plans: Plan[] = [
    { id: 1, name: 'Basic' },
    { id: 2, name: 'Pro' },
  ];
  readonly value = signal<Plan | null>({ id: 2, name: 'Pro (renamed)' });
  readonly calls: [Plan, Plan][] = [];
  readonly byId = (option: Plan, selected: Plan) => {
    this.calls.push([option, selected]);
    return option.id === selected.id;
  };
}

describe('UiSegmented with compareWith', () => {
  it('checks the segment equal to an object value, calling compareWith(option, selected)', async () => {
    const fixture = TestBed.createComponent(CompareHost);
    await settle(fixture);
    const host = fixture.componentInstance;
    const radios = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input',
    );
    expect(radios[1].checked).toBe(true);
    expect(host.calls.every(([option]) => host.plans.includes(option))).toBe(true);
    host.calls.length = 0;
    host.value.set(null);
    await settle(fixture);
    expect(host.calls).toHaveLength(0);
    expect([...radios].some((radio) => radio.checked)).toBe(false);
  });
});

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import {
  UiStep,
  UiStepper,
  UiStepperNext,
  UiStepperPrevious,
  UiStepperSelectionChange,
} from './stepper';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

@Component({
  imports: [ReactiveFormsModule, UiStepper, UiStep, UiStepperNext, UiStepperPrevious],
  template: `
    <ui-stepper
      [linear]="linear()"
      [orientation]="orientation()"
      [(selectedIndex)]="index"
      (selectionChange)="changes.push($event)"
    >
      <ui-step label="Details" [control]="details">
        <input aria-label="Name" [formControl]="details.controls.name" />
        <button type="button" uiStepperNext>Next</button>
      </ui-step>
      <ui-step label="Documents" optional>
        <p>Upload</p>
        <button type="button" uiStepperPrevious>Back</button>
        <button type="button" uiStepperNext>Next</button>
      </ui-step>
      <ui-step label="Review" [error]="reviewError()" [completed]="reviewDone()">
        <p>Check</p>
      </ui-step>
    </ui-stepper>
  `,
})
class Host {
  readonly linear = signal(false);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly index = signal(0);
  readonly reviewError = signal<string | boolean | null>(null);
  readonly reviewDone = signal<boolean | null>(null);
  readonly changes: UiStepperSelectionChange[] = [];
  readonly details = new FormGroup({ name: new FormControl('', Validators.required) });
}

describe('UiStepper', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const headers = () => [...root.querySelectorAll<HTMLButtonElement>('.ui-stepper__header')];
  const items = () => [...root.querySelectorAll<HTMLElement>('.ui-stepper__step')];
  const content = () => root.querySelector<HTMLElement>('.ui-stepper__content');
  const button = (text: string) =>
    [...root.querySelectorAll<HTMLButtonElement>('.ui-stepper__content button')].find(
      (b) => b.textContent.trim() === text,
    )!;
  const click = async (element: HTMLElement) => {
    element.click();
    await settle(fixture);
  };
  const name = (header: HTMLElement) => header.textContent.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    root.remove();
  });

  it('renders the steps as a named list with the current step marked', () => {
    const list = root.querySelector('ol')!;
    expect(list.getAttribute('aria-label')).toBe('שלבים');
    expect(headers().map((h) => h.querySelector('.ui-stepper__label')!.textContent)).toEqual([
      'Details',
      'Documents',
      'Review',
    ]);
    expect(headers()[0].getAttribute('aria-current')).toBe('step');
    expect(headers()[1].hasAttribute('aria-current')).toBe(false);
    expect(headers()[1].textContent).toContain('אופציונלי');
    expect(items()[0].classList).toContain('ui-stepper__step--current');
    expect(root.querySelectorAll('.ui-stepper__connector')).toHaveLength(2);
    // The number is decorative: the list gives the position.
    expect(headers()[0].querySelector('.ui-stepper__marker')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('shows only the current content in a region named by its step', () => {
    expect(content()!.getAttribute('role')).toBe('region');
    expect(content()!.getAttribute('aria-labelledby')).toBe(headers()[0].id);
    expect(content()!.textContent).toContain('Next');
    expect(content()!.textContent).not.toContain('Upload');
  });

  it('moves with the header buttons and the next and previous buttons', async () => {
    await click(headers()[2]);
    expect(host.index()).toBe(2);
    expect(content()!.textContent).toContain('Check');
    expect(host.changes).toEqual([{ previousIndex: 0, selectedIndex: 2 }]);

    await click(headers()[1]);
    await click(button('Back'));
    expect(host.index()).toBe(0);
    await click(button('Next'));
    expect(host.index()).toBe(1);
    expect(host.changes).toHaveLength(4);
  });

  it('keeps form state while the content is not shown', async () => {
    const input = root.querySelector<HTMLInputElement>('input')!;
    input.value = 'Dana';
    input.dispatchEvent(new Event('input'));
    await click(headers()[1]);
    await click(headers()[0]);
    expect(root.querySelector<HTMLInputElement>('input')!.value).toBe('Dana');
  });

  it('marks left steps done or with errors and reads the state after the label', async () => {
    await click(headers()[1]);
    expect(items()[0].classList).toContain('ui-stepper__step--error');
    expect(name(headers()[0])).toBe('! Details, יש שגיאות');

    host.details.setValue({ name: 'Dana' });
    await settle(fixture);
    expect(items()[0].classList).toContain('ui-stepper__step--done');
    expect(items()[0].classList).not.toContain('ui-stepper__step--error');
    expect(headers()[0].querySelector('ui-icon')).not.toBeNull();
    expect(name(headers()[0])).toBe('Details, הושלם');
    // The current step is not read as done.
    expect(name(headers()[1])).toBe('2 Documents אופציונלי');
  });

  it('takes the state from completed and error', async () => {
    host.reviewError.set('Missing signature');
    await settle(fixture);
    expect(items()[2].classList).toContain('ui-stepper__step--error');
    expect(headers()[2].querySelector('.ui-stepper__note--error')!.textContent).toBe(
      'Missing signature',
    );
    host.reviewError.set(null);
    host.reviewDone.set(true);
    await settle(fixture);
    expect(items()[2].classList).toContain('ui-stepper__step--done');
    expect(items()[2].classList).not.toContain('ui-stepper__step--error');
  });

  it('keeps selectedIndex inside the steps', async () => {
    host.index.set(9);
    await settle(fixture);
    expect(headers()[2].getAttribute('aria-current')).toBe('step');
    const stepper = fixture.debugElement.children[0].componentInstance as UiStepper;
    stepper.next();
    await settle(fixture);
    expect(host.changes).toHaveLength(0);
  });

  it('blocks later steps in linear mode until the step is valid', async () => {
    host.linear.set(true);
    await settle(fixture);
    expect(headers()[1].disabled).toBe(true);
    expect(headers()[2].disabled).toBe(true);

    await click(button('Next'));
    expect(host.index()).toBe(0);
    expect(host.details.controls.name.touched).toBe(true);
    expect(items()[0].classList).toContain('ui-stepper__step--error');

    host.details.setValue({ name: 'Dana' });
    await settle(fixture);
    // The optional step does not stop the way to the last step.
    expect(headers()[1].disabled).toBe(false);
    expect(headers()[2].disabled).toBe(false);
    await click(headers()[2]);
    expect(host.index()).toBe(2);
    // Going back is always allowed.
    await click(headers()[0]);
    expect(host.index()).toBe(0);
  });

  it('blocks a later step until the steps between are visited', async () => {
    host.linear.set(true);
    host.details.setValue({ name: 'Dana' });
    host.reviewDone.set(null);
    await settle(fixture);
    // Steps without a form count once visited; the optional one never blocks.
    expect(headers()[2].disabled).toBe(false);
  });

  it('moves focus to the new step header when the button that moved is gone', async () => {
    button('Next').focus();
    await click(button('Next'));
    expect(document.activeElement).toBe(headers()[1]);
    headers()[2].focus();
    await click(headers()[2]);
    expect(document.activeElement).toBe(headers()[2]);
  });

  it('puts the content under the current step in vertical mode', async () => {
    host.orientation.set('vertical');
    await settle(fixture);
    expect(root.querySelector('ui-stepper')!.classList).toContain('ui-stepper--vertical');
    expect(root.querySelectorAll('.ui-stepper__connector')).toHaveLength(0);
    expect(items()[0].querySelector('.ui-stepper__content')).not.toBeNull();
    await click(headers()[1]);
    expect(items()[0].querySelector('.ui-stepper__content')).toBeNull();
    expect(items()[1].querySelector('.ui-stepper__content')!.textContent).toContain('Upload');
    expect(items()[2].querySelector('.ui-stepper__body--last')).not.toBeNull();
  });

  it('resets to the first step and forgets the visits', async () => {
    await click(headers()[2]);
    const stepper = fixture.debugElement.children[0].componentInstance as UiStepper;
    stepper.reset();
    await settle(fixture);
    expect(host.index()).toBe(0);
    expect(items()[0].classList).not.toContain('ui-stepper__step--error');
    expect(host.changes.at(-1)).toEqual({ previousIndex: 2, selectedIndex: 0 });
  });
});

@Component({
  imports: [FormField, UiStepper, UiStep, UiStepperNext],
  template: `
    <ui-stepper linear aria-label="Order">
      <ui-step label="Contact" [control]="f.email">
        <input aria-label="Email" [formField]="f.email" />
        <button type="button" uiStepperNext>Next</button>
      </ui-step>
      <ui-step label="Done"><p>Thanks</p></ui-step>
    </ui-stepper>
  `,
})
class SignalHost {
  readonly model = signal({ email: '' });
  readonly f = form(this.model, (p) => {
    required(p.email);
  });
}

describe('UiStepper with Signal Forms', () => {
  it('uses the validity of a field and marks it touched when blocked', async () => {
    const fixture = TestBed.createComponent(SignalHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    expect(root.querySelector('ol')!.getAttribute('aria-label')).toBe('Order');
    expect(root.querySelector('ui-stepper')!.hasAttribute('aria-label')).toBe(false);
    const headers = () => [...root.querySelectorAll<HTMLButtonElement>('.ui-stepper__header')];
    expect(headers()[1].disabled).toBe(true);

    root.querySelector<HTMLButtonElement>('.ui-stepper__content button')!.click();
    await settle(fixture);
    expect(fixture.componentInstance.f.email().touched()).toBe(true);
    expect(headers()[0].getAttribute('aria-current')).toBe('step');

    fixture.componentInstance.model.set({ email: 'dana@vplans.com' });
    await settle(fixture);
    root.querySelector<HTMLButtonElement>('.ui-stepper__content button')!.click();
    await settle(fixture);
    expect(headers()[1].getAttribute('aria-current')).toBe('step');
    expect(root.querySelector('.ui-stepper__content')!.textContent).toContain('Thanks');
    fixture.destroy();
    root.remove();
  });
});

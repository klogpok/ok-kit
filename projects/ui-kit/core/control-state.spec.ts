import { Directive, DoCheck, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { UiControlState, injectControlState } from './control-state';

/** Stands in for a directive on a native input, e.g. `[ui-input]`. */
@Directive({ selector: 'input[uiProbe]', exportAs: 'uiProbe' })
class Probe implements DoCheck {
  readonly state: UiControlState = injectControlState();

  ngDoCheck(): void {
    this.state.sync();
  }
}

/** Stands in for an application validator with a message of its own. */
const mustBeOleg: ValidatorFn = (control) =>
  control.value === 'oleg' ? null : { uiName: { message: 'Only Oleg may pass' } };

@Component({
  imports: [ReactiveFormsModule, Probe],
  template: `
    <input uiProbe #bound="uiProbe" [formControl]="control" />
    <input uiProbe #free="uiProbe" />
    <span>{{ tick() }}</span>
  `,
})
class Host {
  readonly control = new FormControl('', [Validators.required, mustBeOleg]);
  readonly tick = signal(0);
  bound!: Probe;
  free!: Probe;
}

describe('injectControlState', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let bound: UiControlState;
  let free: UiControlState;

  /** Re-renders the host so that `ngDoCheck` of the probes runs. */
  function settle(): void {
    host.tick.update((value) => value + 1);
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    const probes = fixture.debugElement
      .queryAllNodes((node) => node.providerTokens.includes(Probe))
      .map((node) => node.injector.get(Probe));
    [bound, free] = [probes[0].state, probes[1].state];
    settle();
  });

  it('reports a control bound through a forms directive', () => {
    expect(bound.bound).toBe(true);
  });

  it('reports no binding when no forms directive is on the element', () => {
    expect(free.bound).toBe(false);
    expect(free.disabled()).toBe(false);
    expect(free.invalid()).toBe(false);
    expect(free.touched()).toBe(false);
    expect(free.required()).toBe(false);
    expect(free.errorMessages()).toEqual([]);
  });

  it('reads the required validator of the bound control', () => {
    expect(bound.required()).toBe(true);
  });

  it('follows the control into and out of the disabled state', () => {
    expect(bound.disabled()).toBe(false);
    host.control.disable();
    settle();
    expect(bound.disabled()).toBe(true);
    host.control.enable();
    settle();
    expect(bound.disabled()).toBe(false);
  });

  it('follows validity and touched as the control changes', () => {
    expect(bound.invalid()).toBe(true);
    expect(bound.touched()).toBe(false);
    host.control.markAsTouched();
    settle();
    expect(bound.touched()).toBe(true);
    host.control.setValue('oleg');
    settle();
    expect(bound.invalid()).toBe(false);
  });

  it('shows error values that are a string or carry a message', () => {
    expect(bound.errorMessages()).toEqual(['Only Oleg may pass']);
    host.control.setValue('someone');
    host.control.setErrors({ plain: 'Plain message', silent: true, nested: { message: 'Nested' } });
    settle();
    expect(bound.errorMessages()).toEqual(['Plain message', 'Nested']);
  });

  it('picks up validators added after the control was attached, which emit no event', () => {
    host.control.clearValidators();
    host.control.updateValueAndValidity();
    settle();
    expect(bound.required()).toBe(false);
    host.control.setValidators(Validators.required);
    settle();
    expect(bound.required()).toBe(true);
  });
});

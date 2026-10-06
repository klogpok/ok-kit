import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiSliderHarness } from '@vplans/ui-kit/testing';
import { UiRangeSlider, UiSlider, UiSliderMark, UiSliderRange } from './slider';

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function keydown(target: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function pointer(target: Element, type: string, clientX: number, init: MouseEventInit = {}): void {
  const event = new MouseEvent(type, { clientX, bubbles: true, cancelable: true, ...init });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  target.dispatchEvent(event);
}

/** The track spans x = 100…300 (200px), so x = 100 + 2 × percent. */
function layOut(root: HTMLElement): void {
  for (const track of root.querySelectorAll<HTMLElement>('.ui-slider__track')) {
    track.getBoundingClientRect = () => ({ left: 100, width: 200 }) as DOMRect;
  }
  // jsdom has no pointer capture.
  for (const control of root.querySelectorAll<HTMLElement>('.ui-slider__control')) {
    control.setPointerCapture = () => undefined;
    control.hasPointerCapture = () => true;
    control.releasePointerCapture = () => undefined;
  }
}

@Component({
  imports: [UiSlider, UiFormField],
  template: `
    <div [attr.dir]="dir()">
      <ui-form-field label="Opacity" hint="In percent">
        <ui-slider
          [(value)]="value"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [marks]="marks()"
          [valueText]="valueText()"
          [readonly]="readonly()"
          [disabled]="disabled()"
          [invalid]="invalid()"
          (valueCommit)="commits.push($event)"
          (touch)="touched = true"
        />
      </ui-form-field>
    </div>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly value = signal<number | null>(40);
  readonly min = signal(0);
  readonly max = signal(100);
  readonly step = signal(10);
  readonly marks = signal<boolean | readonly UiSliderMark[]>(false);
  readonly valueText = signal<((value: number) => string) | null>(null);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly commits: number[] = [];
  touched = false;
}

describe('UiSlider', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  const input = () => root.querySelector<HTMLInputElement>('input')!;
  const thumb = () => root.querySelector<HTMLElement>('.ui-slider__thumb')!;
  const control = () => root.querySelector<HTMLElement>('.ui-slider__control')!;
  const press = async (key: string) => {
    const event = keydown(input(), key);
    await settle(fixture);
    return event;
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    layOut(root);
  });

  afterEach(() => root.remove());

  it('is a labelled native range input with its limits and value text', () => {
    expect(input().type).toBe('range');
    expect(root.querySelector('label')!.htmlFor).toBe(input().id);
    expect(input().min).toBe('0');
    expect(input().max).toBe('100');
    expect(input().step).toBe('10');
    expect(input().value).toBe('40');
    expect(input().getAttribute('aria-valuetext')).toBe('40');
    expect(input().getAttribute('aria-describedby')).toBe(
      root.querySelector('.ui-form-field__hint')!.id,
    );
    expect(thumb().style.getPropertyValue('--_pos')).toBe('40%');
    const fill = root.querySelector<HTMLElement>('.ui-slider__fill')!;
    expect(fill.style.getPropertyValue('--_start')).toBe('0%');
    expect(fill.style.getPropertyValue('--_size')).toBe('40%');
  });

  it('formats the value text in the locale and takes a custom text', async () => {
    host.max.set(5000);
    host.value.set(1200);
    await settle(fixture);
    expect(input().getAttribute('aria-valuetext')).toBe('1,200');
    host.valueText.set((value) => `${value} ₪`);
    await settle(fixture);
    expect(input().getAttribute('aria-valuetext')).toBe('1200 ₪');
  });

  it('steps with the arrow, page, Home and End keys within the limits', async () => {
    expect((await press('ArrowRight')).defaultPrevented).toBe(true);
    expect(host.value()).toBe(50);
    await press('ArrowUp');
    expect(host.value()).toBe(60);
    await press('ArrowLeft');
    await press('ArrowDown');
    expect(host.value()).toBe(40);
    await press('PageUp');
    expect(host.value()).toBe(100);
    await press('ArrowUp');
    expect(host.value()).toBe(100);
    await press('Home');
    expect(host.value()).toBe(0);
    await press('PageUp');
    expect(host.value()).toBe(100);
    await press('PageDown');
    expect(host.value()).toBe(0);
    await press('End');
    expect(host.value()).toBe(100);
    expect(host.commits).toEqual([50, 60, 50, 40, 100, 0, 100, 0, 100]);
    expect((await press('Tab')).defaultPrevented).toBe(false);
  });

  it('follows the visual direction with ArrowLeft and ArrowRight in RTL', async () => {
    host.dir.set('rtl');
    await settle(fixture);
    await press('ArrowLeft');
    expect(host.value()).toBe(50);
    await press('ArrowRight');
    await press('ArrowRight');
    expect(host.value()).toBe(30);
    await press('ArrowUp');
    expect(host.value()).toBe(40);
  });

  it('keeps the precision of a decimal step', async () => {
    host.max.set(1);
    host.step.set(0.1);
    host.value.set(0.2);
    await settle(fixture);
    await press('ArrowUp');
    expect(host.value()).toBe(0.3);
  });

  it('shows a value off the grid or outside the limits at the nearest allowed value', async () => {
    host.value.set(43);
    await settle(fixture);
    expect(input().value).toBe('40');
    host.value.set(250);
    await settle(fixture);
    expect(input().value).toBe('100');
    expect(host.value()).toBe(250);
    host.value.set(null);
    await settle(fixture);
    expect(input().value).toBe('0');
    await press('Home');
    expect(host.value()).toBe(0);
  });

  it('moves to the clicked point and follows a drag', async () => {
    pointer(control(), 'pointerdown', 100 + 2 * 72, { button: 0 });
    await settle(fixture);
    expect(host.value()).toBe(70);
    expect(document.activeElement).toBe(input());
    pointer(control(), 'pointermove', 100 + 2 * 18);
    await settle(fixture);
    expect(host.value()).toBe(20);
    pointer(control(), 'pointermove', 20);
    await settle(fixture);
    expect(host.value()).toBe(0);
    expect(host.commits).toEqual([]);
    pointer(control(), 'pointerup', 20);
    await settle(fixture);
    expect(host.commits).toEqual([0]);
    pointer(control(), 'pointermove', 300);
    await settle(fixture);
    expect(host.value()).toBe(0);
  });

  it('reads the pointer from the right in RTL', async () => {
    host.dir.set('rtl');
    await settle(fixture);
    pointer(control(), 'pointerdown', 100 + 2 * 30, { button: 0 });
    await settle(fixture);
    expect(host.value()).toBe(70);
  });

  it('ignores other buttons and a click without a move', async () => {
    pointer(control(), 'pointerdown', 300, { button: 2 });
    await settle(fixture);
    expect(host.value()).toBe(40);
    pointer(control(), 'pointerdown', 100 + 2 * 40, { button: 0 });
    pointer(control(), 'pointerup', 100 + 2 * 40);
    await settle(fixture);
    expect(host.commits).toEqual([]);
  });

  it('takes changes from screen readers through the native input', async () => {
    input().value = '70';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(host.value()).toBe(70);
    expect(host.commits).toEqual([70]);
  });

  it('does not change while readonly or disabled', async () => {
    host.readonly.set(true);
    await settle(fixture);
    expect(input().getAttribute('aria-readonly')).toBe('true');
    expect((await press('ArrowUp')).defaultPrevented).toBe(true);
    pointer(control(), 'pointerdown', 300, { button: 0 });
    input().value = '90';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);
    expect(host.value()).toBe(40);
    expect(input().value).toBe('40');
    expect(root.querySelector('ui-slider')!.classList).toContain('ui-slider--readonly');

    host.readonly.set(false);
    host.disabled.set(true);
    await settle(fixture);
    expect(input().disabled).toBe(true);
    pointer(control(), 'pointerdown', 300, { button: 0 });
    await settle(fixture);
    expect(host.value()).toBe(40);
  });

  it('draws a tick at every step, or marks with labels', async () => {
    host.marks.set(true);
    await settle(fixture);
    const ticks = () => [...root.querySelectorAll<HTMLElement>('.ui-slider__tick')];
    expect(ticks()).toHaveLength(11);
    expect(
      ticks().filter((tick) => tick.classList.contains('ui-slider__tick--active')),
    ).toHaveLength(5);
    expect(root.querySelector('.ui-slider__marks')).toBeNull();

    host.step.set(0.5);
    await settle(fixture);
    expect(ticks()).toHaveLength(0);

    host.marks.set([
      { value: 0, label: 'Clear' },
      { value: 50 },
      { value: 100, label: 'Solid' },
      { value: 150, label: 'Outside' },
    ]);
    await settle(fixture);
    expect(ticks()).toHaveLength(3);
    const marks = root.querySelector('.ui-slider__marks')!;
    expect(marks.getAttribute('aria-hidden')).toBe('true');
    expect([...marks.children].map((mark) => mark.textContent)).toEqual(['Clear', 'Solid']);
    expect(
      root.querySelectorAll<HTMLElement>('.ui-slider__mark')[1].style.getPropertyValue('--_pos'),
    ).toBe('100%');

    host.value.set(0);
    await settle(fixture);
    expect(input().getAttribute('aria-valuetext')).toBe('Clear');
  });

  it('shows the error state and marks the control touched when focus leaves', async () => {
    host.invalid.set(true);
    await settle(fixture);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    input().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(host.touched).toBe(true);
  });

  it('focuses the thumb', () => {
    fixture.debugElement
      .query((el) => el.name === 'ui-slider')
      .injector.get(UiSlider)
      .focus();
    expect(document.activeElement).toBe(input());
  });
});

@Component({
  imports: [UiRangeSlider, UiFormField],
  template: `
    <ui-form-field label="Price">
      <ui-range-slider
        [(value)]="value"
        [limits]="limits()"
        step="100"
        [endLabel]="endLabel()"
        (valueCommit)="commits.push($event)"
      />
    </ui-form-field>
    <ui-range-slider aria-label="Floors" min="1" max="10" />
  `,
})
class RangeHost {
  readonly value = signal<UiSliderRange | null>([1000, 3000]);
  readonly limits = signal<UiSliderRange | null>([0, 5000]);
  readonly endLabel = signal<string | null>(null);
  readonly commits: UiSliderRange[] = [];
}

describe('UiRangeSlider', () => {
  let fixture: ComponentFixture<RangeHost>;
  let host: RangeHost;
  let root: HTMLElement;
  const inputs = () => [
    ...root.querySelectorAll<HTMLInputElement>('ui-range-slider')[0].querySelectorAll('input'),
  ];
  const control = () => root.querySelector<HTMLElement>('.ui-slider__control')!;
  const name = (element: Element) =>
    element
      .getAttribute('aria-labelledby')!
      .split(' ')
      .map((id) => document.getElementById(id)!.textContent?.replace('*', '').trim())
      .join(' ');

  beforeEach(async () => {
    fixture = TestBed.createComponent(RangeHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    layOut(root);
  });

  afterEach(() => root.remove());

  it('is a group of two sliders named by the field label and their role', async () => {
    const slider = root.querySelector('ui-range-slider')!;
    expect(slider.getAttribute('role')).toBe('group');
    expect(name(slider)).toBe('Price');
    const [start, end] = inputs();
    expect(name(start)).toBe('Price מינימום');
    expect(name(end)).toBe('Price מקסימום');
    host.endLabel.set('Up to');
    await settle(fixture);
    expect(name(end)).toBe('Price Up to');
    // Each thumb is bounded by the other one.
    expect([start.min, start.max, start.value]).toEqual(['0', '3000', '1000']);
    expect([end.min, end.max, end.value]).toEqual(['1000', '5000', '3000']);
    const fill = root.querySelector<HTMLElement>('.ui-slider__fill')!;
    expect(fill.style.getPropertyValue('--_start')).toBe('20%');
    expect(fill.style.getPropertyValue('--_size')).toBe('40%');
  });

  it('names the group with aria-label without a field', () => {
    const floors = root.querySelectorAll('ui-range-slider')[1];
    expect(floors.hasAttribute('aria-label')).toBe(false);
    expect(name(floors)).toBe('Floors');
    const [start, end] = floors.querySelectorAll('input');
    expect(name(start)).toBe('Floors מינימום');
    expect([start.value, end.value]).toEqual(['1', '10']);
  });

  it('moves each thumb with the keys, never past the other', async () => {
    const [start, end] = inputs();
    keydown(start, 'End');
    await settle(fixture);
    expect(host.value()).toEqual([3000, 3000]);
    keydown(start, 'ArrowRight');
    await settle(fixture);
    expect(host.value()).toEqual([3000, 3000]);
    keydown(end, 'ArrowRight');
    keydown(end, 'PageUp');
    await settle(fixture);
    expect(host.value()).toEqual([3000, 4100]);
    keydown(end, 'Home');
    await settle(fixture);
    expect(host.value()).toEqual([3000, 3000]);
    expect(host.commits).toEqual([
      [3000, 3000],
      [3000, 3100],
      [3000, 4100],
      [3000, 3000],
    ]);
  });

  it('moves the nearest thumb to the clicked point', async () => {
    // 4000 is 80% of the track.
    pointer(control(), 'pointerdown', 100 + 2 * 80, { button: 0 });
    await settle(fixture);
    expect(host.value()).toEqual([1000, 4000]);
    expect(document.activeElement).toBe(inputs()[1]);
    pointer(control(), 'pointermove', 100);
    await settle(fixture);
    expect(host.value()).toEqual([1000, 1000]);
    pointer(control(), 'pointerup', 100);

    pointer(control(), 'pointerdown', 100 + 2 * 10, { button: 0 });
    await settle(fixture);
    expect(host.value()).toEqual([500, 1000]);
    expect(document.activeElement).toBe(inputs()[0]);
    pointer(control(), 'pointerup', 120);
    await settle(fixture);
    expect(host.commits).toEqual([
      [1000, 1000],
      [500, 1000],
    ]);
  });

  it('lets the drag direction pick a thumb where the thumbs overlap', async () => {
    host.value.set([2000, 2000]);
    await settle(fixture);
    pointer(control(), 'pointerdown', 100 + 2 * 40, { button: 0 });
    await settle(fixture);
    expect(host.value()).toEqual([2000, 2000]);
    pointer(control(), 'pointermove', 100 + 2 * 20);
    await settle(fixture);
    expect(host.value()).toEqual([1000, 2000]);
    expect(document.activeElement).toBe(inputs()[0]);
    pointer(control(), 'pointerup', 140);

    host.value.set([2000, 2000]);
    await settle(fixture);
    pointer(control(), 'pointerdown', 100 + 2 * 40, { button: 0 });
    pointer(control(), 'pointermove', 100 + 2 * 60);
    await settle(fixture);
    expect(host.value()).toEqual([2000, 3000]);
    expect(document.activeElement).toBe(inputs()[1]);
  });

  it('shows null as the whole scale and a reversed range in order', async () => {
    host.value.set(null);
    await settle(fixture);
    expect(inputs().map((input) => input.value)).toEqual(['0', '5000']);
    host.value.set([4000, 1000]);
    await settle(fixture);
    expect(inputs().map((input) => input.value)).toEqual(['1000', '4000']);
  });

  it('uses min and max without limits', async () => {
    host.limits.set(null);
    await settle(fixture);
    expect(inputs().map((input) => [input.min, input.max])).toEqual([
      ['0', '100'],
      ['100', '100'],
    ]);
  });
});

/** Stands in for an application validator with a message of its own. */
const quietEnough: ValidatorFn = (control) =>
  typeof control.value === 'number' && control.value > 8
    ? { uiTooLoud: { message: 'Keep it below 9' } }
    : null;

@Component({
  imports: [UiSlider, UiRangeSlider, UiFormField, ReactiveFormsModule, FormsModule],
  template: `
    <ui-form-field label="Volume">
      <ui-slider min="0" max="10" [formControl]="volume" [readonly]="locked()" />
    </ui-form-field>
    <ui-range-slider aria-label="Area" min="0" max="500" step="50" [formControl]="area" />
    <ui-slider aria-label="Zoom" name="zoom" min="1" max="5" [(ngModel)]="zoom" />
  `,
})
class ReactiveHost {
  readonly locked = signal(false);
  readonly volume = new FormControl<number | null>(3, [Validators.required, quietEnough]);
  readonly area = new FormControl<UiSliderRange | null>([100, 200]);
  readonly zoom = signal(2);
}

describe('UiSlider with Reactive and template forms', () => {
  it('binds the values both ways and the disabled and touched states', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const host = fixture.componentInstance;
    const [volume, areaStart, areaEnd, zoom] = [...root.querySelectorAll('input')];
    expect(volume.value).toBe('3');
    expect([areaStart.value, areaEnd.value]).toEqual(['100', '200']);
    expect(zoom.value).toBe('2');
    expect(zoom.name).toBe('zoom');

    keydown(volume, 'ArrowUp');
    keydown(areaEnd, 'ArrowUp');
    keydown(zoom, 'End');
    await settle(fixture);
    expect(host.volume.value).toBe(4);
    expect(host.area.value).toEqual([100, 250]);
    expect(host.zoom()).toBe(5);
    expect(host.volume.dirty).toBe(true);

    areaStart.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: areaEnd }));
    expect(host.area.touched).toBe(false);
    areaEnd.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(host.area.touched).toBe(true);

    host.volume.setValue(8);
    host.area.setValue([0, 500]);
    await settle(fixture);
    expect(volume.value).toBe('8');
    expect([areaStart.value, areaEnd.value]).toEqual(['0', '500']);

    host.area.setValue([1, Number.NaN] as unknown as UiSliderRange);
    host.volume.reset();
    await settle(fixture);
    expect([areaStart.value, areaEnd.value]).toEqual(['0', '500']);
    expect(volume.value).toBe('0');

    host.volume.disable();
    await settle(fixture);
    expect(volume.disabled).toBe(true);
  });
});

describe('UiSlider in a form field with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let host: ReactiveHost;
  let root: HTMLElement;
  let slider: UiSliderHarness;

  /** The message `ui-form-field` shows under the slider. */
  const error = (): string =>
    root.querySelector('.ui-form-field__error')?.textContent?.trim() ?? '';

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    slider = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      UiSliderHarness.with({ label: 'Volume' }),
    );
  });

  afterEach(() => root.remove());

  it('takes its limits from the inputs and steps with the keyboard', async () => {
    expect(await slider.getValue()).toBe(3);
    expect([await slider.getMin(), await slider.getMax()]).toEqual([0, 10]);
    expect(root.querySelector('.ui-form-field__required')).not.toBeNull();

    await slider.increment();
    await settle(fixture);
    expect(host.volume.value).toBe(4);

    await slider.decrement();
    await slider.decrement();
    await settle(fixture);
    expect(host.volume.value).toBe(2);

    host.volume.setValue(7);
    await settle(fixture);
    expect(await slider.getValue()).toBe(7);
  });

  it('disables the slider from the control', async () => {
    host.volume.disable();
    await settle(fixture);
    expect(await slider.isDisabled()).toBe(true);
  });

  it('keeps the value when the control is readonly', async () => {
    host.locked.set(true);
    await settle(fixture);
    expect(await slider.isReadonly()).toBe(true);
    await slider.increment();
    await settle(fixture);
    expect(host.volume.value).toBe(3);
    expect(await slider.getValue()).toBe(3);
  });

  it('marks the control touched when focus leaves', async () => {
    expect(host.volume.touched).toBe(false);
    await slider.focus();
    await slider.blur();
    await settle(fixture);
    expect(host.volume.touched).toBe(true);
  });

  it('shows the validator message only once the control is invalid and touched', async () => {
    host.volume.setValue(10);
    await settle(fixture);
    expect(host.volume.invalid).toBe(true);
    expect(await slider.isInvalid()).toBe(false);
    expect(error()).toBe('');

    await slider.focus();
    await slider.blur();
    await settle(fixture);
    expect(await slider.isInvalid()).toBe(true);
    expect(error()).toContain('Keep it below 9');

    host.volume.setValue(5);
    await settle(fixture);
    expect(await slider.isInvalid()).toBe(false);
    expect(error()).toBe('');
  });
});

describe('UiRangeSlider in English', () => {
  it('names the thumbs from the labels', async () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    const fixture = TestBed.createComponent(RangeHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
    const [start, end] = root.querySelectorAll('ui-range-slider')[0].querySelectorAll('input');
    const ids = (element: Element) => element.getAttribute('aria-labelledby')!.split(' ');
    expect(document.getElementById(ids(start)[1])!.textContent).toBe('Minimum');
    expect(document.getElementById(ids(end)[1])!.textContent).toBe('Maximum');
    root.remove();
  });
});

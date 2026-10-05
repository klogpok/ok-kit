import { DOCUMENT } from '@angular/common';
import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { App } from './app';

/** The playground, with every `@defer (on viewport)` phase section rendered. */
async function renderPlayground(): Promise<ComponentFixture<App>> {
  TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual });
  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  for (const block of await fixture.getDeferBlocks()) {
    await block.render(DeferBlockState.Complete);
  }
  return fixture;
}

/** The messages the form fields of `scope` currently show. */
function errorsIn(root: Element, scope: string): string[] {
  return [...root.querySelectorAll(`${scope} .ui-form-field__error .ui-error`)].map((e) =>
    e.textContent.trim(),
  );
}

/** Clicks the button with this text. */
function click(root: Element, text: string): void {
  const button = [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
  button!.click();
}

describe('App', () => {
  it('renders every playground section', async () => {
    const fixture = await renderPlayground();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('ui-kit playground');
    const sections = [...el.querySelectorAll('section h2')].map((h) => h.textContent.trim());
    expect(sections).toEqual(
      expect.arrayContaining(['Profile (Reactive Forms)', 'Plans', 'Actions']),
    );
    expect(el.querySelector('app-phase-three section')).not.toBeNull();
    expect(el.querySelector('app-phase-six nav[ui-breadcrumbs]')).not.toBeNull();
    expect(el.querySelector('app-phase-seven ui-table-container table[ui-table]')).not.toBeNull();
    expect(el.querySelector('app-phase-seven ui-file-upload')).not.toBeNull();
    expect(el.querySelector('app-phase-eight ui-range-slider')).not.toBeNull();
    expect(el.querySelector('app-phase-eight ui-segmented')).not.toBeNull();
    expect(el.querySelector('app-phase-eight ui-button-toggle-group')).not.toBeNull();
    expect(el.querySelector('app-phase-eight ui-stepper ui-date-range-picker')).not.toBeNull();
  });

  it('switches the direction and the language together', async () => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.dir = 'rtl';
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const toggle = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (b) => b.textContent.trim() === 'LTR',
    )!;
    toggle.click();
    await fixture.whenStable();
    expect(root.dir).toBe('ltr');
    expect(root.lang).toBe('en');
    root.removeAttribute('dir');
    root.removeAttribute('lang');
  });

  it('keeps the profile form from submitting until its fields are filled in', async () => {
    const fixture = await renderPlayground();
    const el = fixture.nativeElement as HTMLElement;
    expect(errorsIn(el, 'form')).toEqual([]);

    click(el, 'Save profile');
    await fixture.whenStable();

    expect(errorsIn(el, 'form')).toEqual([
      'Enter your name',
      'Enter your email',
      'Accept the terms to continue',
    ]);
  });

  it('shows the email message while the address is not one', async () => {
    const fixture = await renderPlayground();
    const el = fixture.nativeElement as HTMLElement;
    const email = el.querySelector<HTMLInputElement>('input[type="email"]')!;
    email.value = 'dana@';
    email.dispatchEvent(new Event('input'));
    click(el, 'Save profile');
    await fixture.whenStable();

    expect(errorsIn(el, 'form')).toContain('Enter a valid email');
  });

  it('keeps the work order from submitting until its fields are filled in', async () => {
    const fixture = await renderPlayground();
    const el = fixture.nativeElement as HTMLElement;
    expect(errorsIn(el, 'app-phase-seven')).toEqual([]);

    click(el, 'Save the work order');
    await fixture.whenStable();

    expect(errorsIn(el, 'app-phase-seven')).toEqual([
      'Enter a city',
      'Pick an owner',
      'Choose a trade',
      'Attach a plan',
    ]);
  });

  it('asks for a meeting date once the field is left empty', async () => {
    const fixture = await renderPlayground();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('app-phase-three ui-datepicker input')!;
    input.focus();
    // The field is touched once focus leaves it, its button and the calendar.
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await fixture.whenStable();

    expect(errorsIn(el, 'app-phase-three')).toEqual(['Choose a meeting date']);
  });

  it("keeps the range picker's own message beside the required one", async () => {
    const fixture = await renderPlayground();
    const el = fixture.nativeElement as HTMLElement;
    const start = el.querySelector<HTMLInputElement>('app-phase-eight ui-date-range-picker input')!;
    start.value = 'not a date';
    start.dispatchEvent(new Event('input'));
    start.dispatchEvent(new FocusEvent('blur'));
    start.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await fixture.whenStable();

    // A projected <ui-error> would drop the picker's own message; a string-valued error does not.
    expect(errorsIn(el, 'app-phase-eight ui-stepper')).toEqual([
      // The playground runs with the default Hebrew labels.
      'תאריך לא תקין',
      'Choose the permit period',
    ]);
  });
});

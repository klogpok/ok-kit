import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { UiDialog } from '@vplans/ui-kit/dialog';
import { UiPopoverPosition, UiPopoverTrigger } from './popover';

// jsdom has no layout, so the real checker treats every element as hidden.
const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]';
const focusable = (el: HTMLElement) => el.matches(FOCUSABLE) && !el.hasAttribute('disabled');
const layoutFreeChecker: Partial<InteractivityChecker> = {
  isFocusable: focusable,
  isTabbable: (el) => focusable(el) && el.tabIndex >= 0,
  isVisible: () => true,
  isDisabled: (el) => el.hasAttribute('disabled'),
};

@Component({
  imports: [UiPopoverTrigger],
  template: `
    <div [attr.dir]="dir()">
      <button
        id="trigger"
        type="button"
        [uiPopoverTriggerFor]="content"
        [uiPopoverPosition]="position()"
        [uiPopoverLabel]="label()"
        [uiPopoverDisabled]="disabled()"
        (opened)="events.push('opened')"
        (closed)="events.push('closed')"
      >
        Filters
      </button>
      <button id="outside" type="button">Outside</button>
    </div>
    <ng-template #content let-close="close">
      <p>Show plans</p>
      <input id="first" aria-label="Owner" />
      <button id="apply" type="button" (click)="close()">Apply</button>
    </ng-template>
  `,
})
class Host {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly position = signal<UiPopoverPosition>('bottom');
  readonly label = signal('');
  readonly disabled = signal(false);
  readonly events: string[] = [];
  readonly trigger = viewChild.required(UiPopoverTrigger);
}

describe('UiPopoverTrigger', () => {
  let fixture: ComponentFixture<Host>;
  const trigger = () => document.querySelector<HTMLButtonElement>('#trigger')!;
  const panel = () => document.querySelector<HTMLElement>('ui-popover-panel');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  };
  const escape = (target: Element) =>
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }),
    );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: InteractivityChecker, useValue: layoutFreeChecker }],
    });
    fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => (fixture.nativeElement as HTMLElement).remove());

  it('links the trigger to the closed popover', () => {
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().hasAttribute('aria-controls')).toBe(false);
    expect(trigger().id).toBe('trigger');
    expect(panel()).toBeNull();
  });

  it('opens a non-modal dialog named by the trigger and focuses the first field', async () => {
    trigger().click();
    await settle();
    const popover = panel()!;
    expect(popover.getAttribute('role')).toBe('dialog');
    expect(popover.hasAttribute('aria-modal')).toBe(false);
    expect(popover.getAttribute('aria-labelledby')).toBe('trigger');
    expect(popover.textContent).toContain('Show plans');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(popover.id);
    expect(document.activeElement?.id).toBe('first');
    expect(fixture.componentInstance.events).toEqual(['opened']);
  });

  it('uses the label as the name when given', async () => {
    fixture.componentInstance.label.set('Plan filters');
    await settle();
    trigger().click();
    await settle();
    expect(panel()?.getAttribute('aria-label')).toBe('Plan filters');
    expect(panel()?.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('closes on a second trigger click', async () => {
    trigger().click();
    await settle();
    trigger().click();
    await settle();
    expect(panel()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.events).toEqual(['opened', 'closed']);
  });

  it('closes on Escape, returns focus and keeps Escape from reaching the page', async () => {
    trigger().click();
    await settle();
    const onDocument = vi.fn();
    document.addEventListener('keydown', onDocument);
    escape(document.querySelector('#first')!);
    await settle();
    document.removeEventListener('keydown', onDocument);
    expect(panel()).toBeNull();
    expect(onDocument).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes from the template with close()', async () => {
    trigger().click();
    await settle();
    document.querySelector<HTMLButtonElement>('#apply')!.click();
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes when focus tabs out, leaving focus where it went', async () => {
    trigger().click();
    await settle();
    const outside = document.querySelector<HTMLButtonElement>('#outside')!;
    // Focus is on the first field; moving it out fires focusout with the new target.
    outside.focus();
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(outside);
    expect(fixture.componentInstance.events).toEqual(['opened', 'closed']);
  });

  it('closes on a click outside', async () => {
    trigger().click();
    await settle();
    const outside = document.querySelector<HTMLButtonElement>('#outside')!;
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(panel()).toBeNull();
  });

  it('opens in code, follows the direction and stays shut when disabled', async () => {
    fixture.componentInstance.dir.set('rtl');
    await settle();
    fixture.componentInstance.trigger().open();
    await settle();
    expect(panel()?.closest('[dir]')?.getAttribute('dir')).toBe('rtl');
    fixture.componentInstance.trigger().close();
    await settle();

    fixture.componentInstance.disabled.set(true);
    await settle();
    trigger().click();
    await settle();
    expect(panel()).toBeNull();
  });

  it('closes only itself on Escape inside a dialog', async () => {
    @Component({
      imports: [UiPopoverTrigger],
      template: `
        <button id="inner" type="button" [uiPopoverTriggerFor]="tpl">More</button>
        <ng-template #tpl><button id="inside" type="button">Inside</button></ng-template>
      `,
    })
    class DialogContent {}

    const ref = TestBed.inject(UiDialog).open(DialogContent);
    await settle();
    document.querySelector<HTMLButtonElement>('#inner')!.click();
    await settle();
    escape(document.querySelector('#inside')!);
    await settle();
    expect(panel()).toBeNull();
    expect(document.querySelector('ui-dialog-container')).not.toBeNull();
    ref.close();
    await settle();
  });
});

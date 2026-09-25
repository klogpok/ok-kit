import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideUiLabels } from '@vplans/ui-kit/core';
import { UiDialog } from './dialog';
import {
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogHeader,
  UiDialogTitle,
} from './dialog-parts';

@Component({
  imports: [UiDialogHeader, UiDialogTitle, UiDialogContent, UiDialogActions, UiDialogClose],
  template: `
    <ui-dialog-header
      ><h2 ui-dialog-title>Rename {{ data.name }}</h2></ui-dialog-header
    >
    <ui-dialog-content><input aria-label="Name" /></ui-dialog-content>
    <ui-dialog-actions>
      <button type="button" uiDialogClose>Cancel</button>
      <button type="button" [uiDialogClose]="'saved'">Save</button>
    </ui-dialog-actions>
  `,
})
class RenameDialog {
  readonly data = inject<{ name: string }>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
}

// jsdom has no layout, so the real checker treats every element as hidden.
const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]';
const focusable = (el: HTMLElement) => el.matches(FOCUSABLE) && !el.hasAttribute('disabled');
const layoutFreeChecker: Partial<InteractivityChecker> = {
  isFocusable: focusable,
  isTabbable: (el) => focusable(el) && el.tabIndex >= 0,
  isVisible: () => true,
  isDisabled: (el) => el.hasAttribute('disabled'),
};

describe('UiDialog', () => {
  let dialog: UiDialog;
  let trigger: HTMLButtonElement;
  const container = () => document.querySelector<HTMLElement>('ui-dialog-container');
  const settle = async () => {
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideUiLabels({ close: 'סגירה' }),
        { provide: InteractivityChecker, useValue: layoutFreeChecker },
      ],
    });
    dialog = TestBed.inject(UiDialog);
    trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
  });

  afterEach(() => {
    dialog.closeAll();
    trigger.remove();
  });

  it('opens a modal dialog labelled by its title', async () => {
    dialog.open(RenameDialog, { data: { name: 'Plan A' } });
    await settle();

    const el = container()!;
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.classList).toContain('ui-dialog-container--md');
    const title = el.querySelector('h2')!;
    expect(title.textContent).toBe('Rename Plan A');
    expect(el.getAttribute('aria-labelledby')).toBe(title.id);
    expect(document.querySelector('.ui-dialog-backdrop')).not.toBeNull();
  });

  it('follows a dir attribute changed at runtime', async () => {
    // The app reads the direction at startup, before the user switches it.
    expect(TestBed.inject(Directionality).value).toBe('ltr');
    document.documentElement.dir = 'rtl';
    try {
      dialog.open(RenameDialog, { data: { name: 'A' } });
      await settle();
      expect(container()!.closest('[dir]')!.getAttribute('dir')).toBe('rtl');
    } finally {
      document.documentElement.removeAttribute('dir');
    }
  });

  it('applies the size and moves focus into the dialog', async () => {
    dialog.open(RenameDialog, { data: { name: 'A' }, size: 'lg' });
    await settle();
    expect(container()!.classList).toContain('ui-dialog-container--lg');
    // The close button is the first tabbable element.
    expect(document.activeElement).toBe(container()!.querySelector('.ui-dialog-header__close'));
  });

  it('closes with the uiDialogClose result and restores focus', async () => {
    const ref = dialog.open<string>(RenameDialog, { data: { name: 'A' } });
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    await settle();

    container()!
      .querySelectorAll('ui-dialog-actions button')[1]
      .dispatchEvent(new MouseEvent('click'));
    await settle();
    expect(closed).toHaveBeenCalledWith('saved');
    expect(container()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes without a result from a bare uiDialogClose', async () => {
    const ref = dialog.open(RenameDialog, { data: { name: 'A' } });
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    await settle();
    container()!.querySelector<HTMLButtonElement>('ui-dialog-actions button')!.click();
    expect(closed).toHaveBeenCalledWith(undefined);
  });

  it('has a translated close button in the header', async () => {
    const ref = dialog.open(RenameDialog, { data: { name: 'A' } });
    const closed = vi.fn();
    ref.closed.subscribe(closed);
    await settle();
    const close = container()!.querySelector<HTMLButtonElement>('.ui-dialog-header__close')!;
    expect(close.getAttribute('aria-label')).toBe('סגירה');
    close.click();
    expect(closed).toHaveBeenCalled();
  });

  it('closes on Escape unless disableClose is set', async () => {
    const escape = () =>
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
      );

    dialog.open(RenameDialog, { data: { name: 'A' }, disableClose: true });
    await settle();
    escape();
    await settle();
    expect(container()).not.toBeNull();
    dialog.closeAll();
    await settle();

    dialog.open(RenameDialog, { data: { name: 'A' } });
    await settle();
    escape();
    await settle();
    expect(container()).toBeNull();
  });

  describe('confirm', () => {
    it('resolves true on confirm', async () => {
      const result = dialog.confirm({
        title: 'Send the plan?',
        message: 'The owner gets an email.',
      });
      await settle();
      const el = container()!;
      expect(el.getAttribute('role')).toBe('alertdialog');
      expect(el.classList).toContain('ui-dialog-container--sm');
      expect(el.textContent).toContain('The owner gets an email.');
      expect(el.querySelector('.ui-dialog-header__close')).toBeNull();

      const [cancel, confirm] = el.querySelectorAll<HTMLButtonElement>('ui-dialog-actions button');
      expect(cancel.textContent!.trim()).toBe('ביטול');
      expect(document.activeElement).toBe(confirm);
      confirm.click();
      await expect(result).resolves.toBe(true);
    });

    it('focuses Cancel first for a destructive action and resolves false', async () => {
      const result = dialog.confirm({ title: 'Delete?', tone: 'danger', confirmLabel: 'Delete' });
      await settle();
      const [cancel, confirm] = container()!.querySelectorAll<HTMLButtonElement>(
        'ui-dialog-actions button',
      );
      expect(confirm.textContent!.trim()).toBe('Delete');
      expect(confirm.classList).toContain('ui-button--danger');
      expect(document.activeElement).toBe(cancel);
      cancel.click();
      await expect(result).resolves.toBe(false);
    });

    it('resolves false when dismissed', async () => {
      const result = dialog.confirm({ title: 'Leave?' });
      await settle();
      dialog.closeAll();
      await expect(result).resolves.toBe(false);
    });
  });
});

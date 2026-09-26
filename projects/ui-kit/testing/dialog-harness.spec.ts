import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiButton } from '@vplans/ui-kit/button';
import { UI_LABELS_HE } from '@vplans/ui-kit/core';
import {
  UiDialog,
  UiDialogActions,
  UiDialogContent,
  UiDialogHeader,
  UiDialogTitle,
} from '@vplans/ui-kit/dialog';
import { UiButtonHarness } from './button-harness';
import { UiDialogHarness } from './dialog-harness';

@Component({
  imports: [UiDialogHeader, UiDialogTitle, UiDialogContent, UiDialogActions, UiButton],
  template: `
    <ui-dialog-header><h2 ui-dialog-title>Rename plan</h2></ui-dialog-header>
    <ui-dialog-content>Pick a new name.</ui-dialog-content>
    <ui-dialog-actions><button ui-button>Save</button></ui-dialog-actions>
  `,
})
class RenameDialog {}

@Component({ template: '<p>No parts</p>' })
class BareDialog {}

@Component({ template: '' })
class Host {
  readonly dialog = inject(UiDialog);
}

describe('UiDialogHarness', () => {
  let fixture: ComponentFixture<Host>;
  let loader: HarnessLoader;
  let dialog: UiDialog;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    dialog = fixture.componentInstance.dialog;
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  });

  afterEach(() => dialog.closeAll());

  it('reads a dialog and its parts', async () => {
    dialog.open(RenameDialog, { size: 'lg' });
    const rename = await loader.getHarness(UiDialogHarness.with({ title: 'Rename plan' }));
    expect(await rename.getRole()).toBe('dialog');
    expect(await rename.isModal()).toBe(true);
    expect(await rename.getAriaLabelledby()).toMatch(/ui-dialog-title/);
    expect(await rename.getContentText()).toBe('Pick a new name.');
    expect(await rename.getActionsText()).toBe('Save');
    expect(await rename.isDrawer()).toBe(false);
    expect(await rename.getPosition()).toBeNull();
    expect(await rename.getSize()).toBe('lg');
    const buttons = await rename.getAllHarnesses(UiButtonHarness);
    expect(await Promise.all(buttons.map((button) => button.getLabel()))).toEqual([
      UI_LABELS_HE.close,
      null,
    ]);
    expect(await buttons[1].getText()).toBe('Save');
  });

  it('reads a confirm dialog', async () => {
    void dialog.confirm({ title: 'Delete the plan?', message: 'This cannot be undone.' });
    const confirm = await loader.getHarness(UiDialogHarness);
    expect(await confirm.getRole()).toBe('alertdialog');
    expect(await confirm.getAriaDescribedby()).toMatch(/ui-confirm-message-/);
    await expect(confirm.clickCloseButton()).rejects.toThrow(/no close button/);
  });

  it('reads a drawer', async () => {
    dialog.openDrawer(RenameDialog, { position: 'start', size: 'sm' });
    dialog.open(BareDialog);
    const drawer = await loader.getHarness(UiDialogHarness.with({ drawer: true }));
    expect(await drawer.getPosition()).toBe('start');
    expect(await drawer.getSize()).toBe('sm');

    const bare = await loader.getHarness(UiDialogHarness.with({ drawer: false }));
    expect(await bare.getTitleText()).toBe('');
    expect(await bare.getContentText()).toBe('');
    expect(await bare.getActionsText()).toBe('');
  });

  it('closes with Escape and with the close button', async () => {
    dialog.open(RenameDialog);
    await (await loader.getHarness(UiDialogHarness)).close();
    expect(await loader.getAllHarnesses(UiDialogHarness)).toHaveLength(0);

    dialog.open(RenameDialog);
    await (await loader.getHarness(UiDialogHarness)).clickCloseButton();
    expect(await loader.getAllHarnesses(UiDialogHarness)).toHaveLength(0);
  });
});

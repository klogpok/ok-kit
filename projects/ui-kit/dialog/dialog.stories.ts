import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiInput } from '@vplans/ui-kit/input';
import {
  UI_DIALOG_DATA,
  UiDialog,
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogHeader,
  UiDialogRef,
  UiDialogSize,
  UiDialogTitle,
} from './public-api';

@Component({
  selector: 'ui-story-rename-dialog',
  imports: [
    UiDialogHeader,
    UiDialogTitle,
    UiDialogContent,
    UiDialogActions,
    UiDialogClose,
    UiButton,
    UiFormField,
    UiInput,
  ],
  template: `
    <ui-dialog-header>
      <h2 ui-dialog-title>Rename plan</h2>
    </ui-dialog-header>
    <ui-dialog-content>
      <ui-form-field label="Plan name" hint="Shown to the owner and the coordinator">
        <input ui-input [value]="name()" (input)="onInput($event)" />
      </ui-form-field>
    </ui-dialog-content>
    <ui-dialog-actions>
      <button ui-button variant="secondary" uiDialogClose>Cancel</button>
      <button ui-button (click)="ref.close(name())">Save</button>
    </ui-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RenameDialog {
  protected readonly data = inject<{ name: string }>(UI_DIALOG_DATA);
  protected readonly ref = inject<UiDialogRef<string>>(UiDialogRef);
  protected readonly name = signal(this.data.name);

  protected onInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }
}

@Component({
  selector: 'ui-story-long-dialog',
  imports: [
    UiDialogHeader,
    UiDialogTitle,
    UiDialogContent,
    UiDialogActions,
    UiDialogClose,
    UiButton,
  ],
  template: `
    <ui-dialog-header><h2 ui-dialog-title>Terms of use</h2></ui-dialog-header>
    <ui-dialog-content>
      @for (p of paragraphs; track $index) {
        <p>
          Section {{ p }}. The content scrolls while the header and the actions stay in place. Lorem
          ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua.
        </p>
      }
    </ui-dialog-content>
    <ui-dialog-actions>
      <button ui-button [uiDialogClose]="true">Accept</button>
    </ui-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LongDialog {
  protected readonly paragraphs = Array.from({ length: 20 }, (_, i) => i + 1);
}

@Component({
  selector: 'ui-story-dialog-demo',
  imports: [UiButton],
  template: `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button ui-button (click)="rename()">Rename plan</button>
      <button ui-button variant="secondary" (click)="long()">Long content</button>
      <button ui-button variant="secondary" (click)="confirm()">Confirm</button>
      <button ui-button variant="danger" (click)="remove()">Delete plan</button>
    </div>
    <p aria-live="polite">{{ result() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogDemo {
  private readonly dialog = inject(UiDialog);
  readonly size = input<UiDialogSize>('md');
  protected readonly result = signal('');

  protected rename(): void {
    this.dialog
      .open<string>(RenameDialog, { data: { name: 'Tower B, floor 4' }, size: this.size() })
      .closed.subscribe((name) => this.result.set(name ? `Renamed to "${name}"` : 'Cancelled'));
  }

  protected long(): void {
    this.dialog.open(LongDialog, { size: this.size() });
  }

  protected async confirm(): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Send the plan to the owner?',
      message: 'The owner gets an email with a link to sign it.',
      confirmLabel: 'Send',
    });
    this.result.set(ok ? 'Sent' : 'Not sent');
  }

  protected async remove(): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Delete the plan?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    this.result.set(ok ? 'Deleted' : 'Kept');
  }
}

const meta: Meta<DialogDemo> = {
  title: 'Overlays/Dialog',
  component: DialogDemo,
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  args: { size: 'md' },
  // The derived snippet would show the story-only demo component; show how an app calls the service.
  parameters: {
    docs: {
      source: {
        code: `import { Component, inject } from '@angular/core';
import { UiButton } from '@vplans/ui-kit/button';
import { UiDialog } from '@vplans/ui-kit/dialog';
import { RenameDialog } from './rename-dialog';

@Component({
  selector: 'app-demo',
  imports: [UiButton],
  template: \`
    <button ui-button (click)="rename()">Rename plan</button>
    <button ui-button variant="danger" (click)="remove()">Delete plan</button>\`,
})
export class DemoComponent {
  private readonly dialog = inject(UiDialog);

  rename(): void {
    this.dialog
      .open<string>(RenameDialog, { data: { name: 'Tower B, floor 4' }, size: 'md' })
      .closed.subscribe((name) => console.log(name));
  }

  async remove(): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Delete the plan?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (ok) {
      // delete the plan
    }
  }
}`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DialogDemo>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };

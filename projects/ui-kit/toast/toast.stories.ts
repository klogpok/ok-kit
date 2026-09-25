import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiDialog } from '@vplans/ui-kit/dialog';
import { UiToast } from './toast';

@Component({
  selector: 'ui-story-toast-demo',
  imports: [UiButton],
  template: `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button ui-button (click)="toast.success('The plan was sent to the owner')">Success</button>
      <button ui-button variant="secondary" (click)="info()">Info with title</button>
      <button
        ui-button
        variant="secondary"
        (click)="toast.warning('The signature expires tomorrow')"
      >
        Warning
      </button>
      <button ui-button variant="danger" (click)="error()">Error (stays)</button>
      <button ui-button variant="secondary" (click)="undo()">With action</button>
      <button ui-button variant="secondary" (click)="fromDialog()">From a dialog</button>
      <button ui-button variant="ghost" (click)="toast.dismissAll()">Dismiss all</button>
    </div>
    <p aria-live="polite">{{ status() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ToastDemo {
  protected readonly toast = inject(UiToast);
  private readonly dialog = inject(UiDialog);
  protected readonly status = signal('');

  protected info(): void {
    this.toast.info('Coordinator approval usually takes one business day.', {
      title: 'Waiting for approval',
    });
  }

  protected error(): void {
    this.toast.error('Check the connection and try again.', {
      title: 'Upload failed',
      duration: 0,
    });
  }

  protected undo(): void {
    this.toast
      .show({ message: 'Plan deleted', action: 'Undo', duration: 8000 })
      .onAction.subscribe(() => this.status.set('Restored'));
  }

  protected async fromDialog(): Promise<void> {
    if (await this.dialog.confirm({ title: 'Send a reminder?', confirmLabel: 'Send' })) {
      this.toast.success('Reminder sent');
    }
  }
}

const meta: Meta<ToastDemo> = {
  title: 'Feedback/Toast',
  component: ToastDemo,
};

export default meta;
type Story = StoryObj<ToastDemo>;

export const Default: Story = {};

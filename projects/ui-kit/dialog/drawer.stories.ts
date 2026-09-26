import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiInput } from '@vplans/ui-kit/input';
import {
  UiDialog,
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogHeader,
  UiDialogSize,
  UiDialogTitle,
  UiDrawerPosition,
} from './public-api';

@Component({
  selector: 'ui-story-filters-drawer',
  imports: [
    UiDialogHeader,
    UiDialogTitle,
    UiDialogContent,
    UiDialogActions,
    UiDialogClose,
    UiButton,
    UiCheckbox,
    UiFormField,
    UiInput,
  ],
  template: `
    <ui-dialog-header><h2 ui-dialog-title>Filters</h2></ui-dialog-header>
    <ui-dialog-content>
      <div style="display:grid;gap:16px">
        <ui-form-field label="Owner"><input ui-input /></ui-form-field>
        <ui-checkbox>Only my plans</ui-checkbox>
        <ui-checkbox>Waiting for signature</ui-checkbox>
      </div>
    </ui-dialog-content>
    <ui-dialog-actions>
      <button ui-button variant="secondary" uiDialogClose>Cancel</button>
      <button ui-button [uiDialogClose]="true">Apply</button>
    </ui-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FiltersDrawer {}

@Component({
  selector: 'ui-story-drawer-demo',
  imports: [UiButton],
  template: `
    <button ui-button variant="secondary" (click)="open()">Filters</button>
    <p aria-live="polite">{{ result() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DrawerDemo {
  private readonly dialog = inject(UiDialog);
  readonly position = input<UiDrawerPosition>('end');
  readonly size = input<UiDialogSize>('md');
  protected readonly result = signal('');

  protected open(): void {
    this.dialog
      .openDrawer<boolean>(FiltersDrawer, { position: this.position(), size: this.size() })
      .closed.subscribe((applied) => this.result.set(applied ? 'Filters applied' : 'Cancelled'));
  }
}

const meta: Meta<DrawerDemo> = {
  title: 'Overlays/Drawer',
  component: DrawerDemo,
  argTypes: {
    position: { control: 'inline-radio', options: ['start', 'end'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  args: { position: 'end', size: 'md' },
  parameters: {
    docs: {
      source: {
        code: `private readonly dialog = inject(UiDialog);

openFilters(): void {
  this.dialog
    .openDrawer<boolean>(FiltersDrawer, { position: 'end', size: 'md' })
    .closed.subscribe((applied) => ...);
}`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<DrawerDemo>;

export const End: Story = {};
export const Start: Story = { args: { position: 'start' } };
export const Large: Story = { args: { size: 'lg' } };

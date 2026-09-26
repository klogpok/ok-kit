import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiAlert } from '@vplans/ui-kit/alert';
import { UiAvatar, UiAvatarGroup } from '@vplans/ui-kit/avatar';
import { UiBadge } from '@vplans/ui-kit/badge';
import { UiBreadcrumb, UiBreadcrumbs } from '@vplans/ui-kit/breadcrumbs';
import { UiButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiDatepicker } from '@vplans/ui-kit/datepicker';
import {
  UiDialog,
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogHeader,
  UiDialogTitle,
} from '@vplans/ui-kit/dialog';
import { UiDivider } from '@vplans/ui-kit/divider';
import { UiEmptyState } from '@vplans/ui-kit/empty-state';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import {
  UiMenu,
  UiMenuGroup,
  UiMenuItem,
  UiMenuItemCheckbox,
  UiMenuItemRadio,
  UiMenuTrigger,
} from '@vplans/ui-kit/menu';
import { UiPopoverTrigger } from '@vplans/ui-kit/popover';
import { UiProgressBar } from '@vplans/ui-kit/progress';
import { UiOption, UiSelect } from '@vplans/ui-kit/select';

const PEOPLE = [
  { id: 'dana', name: 'Dana Levi', role: 'Coordinator' },
  { id: 'yossi', name: 'Yossi Peretz', role: 'Owner' },
  { id: 'noa', name: 'Noa Friedman', role: 'Architect' },
  { id: 'david', name: 'David Cohen', role: 'Engineer' },
  { id: 'tal', name: 'Tal Mor', role: 'Inspector' },
];

/** Drawer content: the plan details. */
@Component({
  selector: 'app-plan-drawer',
  imports: [
    UiDialogHeader,
    UiDialogTitle,
    UiDialogContent,
    UiDialogActions,
    UiDialogClose,
    UiButton,
    UiFormField,
    UiDatepicker,
    UiBadge,
  ],
  template: `
    <ui-dialog-header><h2 ui-dialog-title>Tower B, floor 4</h2></ui-dialog-header>
    <ui-dialog-content>
      <div class="stack">
        <ui-badge tone="warning">ממתין לחתימה</ui-badge>
        <ui-form-field label="Signing date"><ui-datepicker /></ui-form-field>
      </div>
    </ui-dialog-content>
    <ui-dialog-actions>
      <button ui-button variant="secondary" uiDialogClose>Close</button>
      <button ui-button [uiDialogClose]="true">Save</button>
    </ui-dialog-actions>
  `,
  styles: `
    .stack {
      display: grid;
      gap: var(--ui-space-lg);
      justify-items: start;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PlanDrawer {}

/** Phase 6 components: feedback, navigation and overlays, and the extended controls. */
@Component({
  selector: 'app-phase-six',
  imports: [
    UiAlert,
    UiAvatar,
    UiAvatarGroup,
    UiBadge,
    UiBreadcrumbs,
    UiBreadcrumb,
    UiButton,
    UiCheckbox,
    UiDivider,
    UiEmptyState,
    UiFormField,
    UiIcon,
    UiMenu,
    UiMenuGroup,
    UiMenuItem,
    UiMenuItemCheckbox,
    UiMenuItemRadio,
    UiMenuTrigger,
    UiPopoverTrigger,
    UiProgressBar,
    UiSelect,
    UiOption,
  ],
  templateUrl: './phase-six.html',
  styleUrl: './phase-three.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaseSix {
  private readonly dialog = inject(UiDialog);

  protected readonly people = PEOPLE;
  protected readonly alertShown = signal(true);
  protected readonly uploaded = signal(3);
  protected readonly coordinator = signal<string | null>('dana');
  protected readonly onlyMine = signal(false);
  protected readonly sort = signal<'name' | 'date'>('name');
  protected readonly archived = signal(false);
  protected readonly drawerResult = signal('');

  protected upload(): void {
    this.uploaded.update((mb) => (mb >= 8 ? 0 : mb + 1));
  }

  protected openDrawer(): void {
    this.dialog
      .openDrawer<boolean>(PlanDrawer)
      .closed.subscribe((saved) => this.drawerResult.set(saved ? 'Saved' : 'Closed'));
  }
}

import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiBadge, UiBadgeTone } from '@vplans/ui-kit/badge';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import {
  UiCard,
  UiCardFooter,
  UiCardHeader,
  UiCardSubtitle,
  UiCardTitle,
} from '@vplans/ui-kit/card';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiDialog } from '@vplans/ui-kit/dialog';
import { UiDivider } from '@vplans/ui-kit/divider';
import { UiError, UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiInput, UiTextarea } from '@vplans/ui-kit/input';
import { UiRadio, UiRadioGroup } from '@vplans/ui-kit/radio';
import { UiOption, UiSelect } from '@vplans/ui-kit/select';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import { UiSwitch } from '@vplans/ui-kit/switch';
import { UiTab, UiTabGroup, UiTabLabel } from '@vplans/ui-kit/tabs';
import { ThemeService } from '@vplans/ui-kit/theme';
import { UiToast } from '@vplans/ui-kit/toast';
import { UiTooltip } from '@vplans/ui-kit/tooltip';
import { FileCard, StoredFile } from './file-card';
import { PhaseEight } from './phase-eight';
import { PhaseSeven } from './phase-seven';
import { PhaseSix } from './phase-six';
import { PhaseThree } from './phase-three';

interface Plan {
  name: string;
  updated: string;
  status: string;
  tone: UiBadgeTone;
}

@Component({
  selector: 'app-root',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    UiButton,
    UiIconButton,
    UiCheckbox,
    UiError,
    UiFormField,
    UiIcon,
    UiInput,
    UiTextarea,
    UiRadioGroup,
    UiRadio,
    UiSpinner,
    UiSwitch,
    UiBadge,
    UiCard,
    UiCardHeader,
    UiCardTitle,
    UiCardSubtitle,
    UiCardFooter,
    UiDivider,
    UiSelect,
    UiOption,
    UiTabGroup,
    UiTab,
    UiTabLabel,
    UiTooltip,
    FileCard,
    PhaseThree,
    PhaseSix,
    PhaseSeven,
    PhaseEight,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly dialog = inject(UiDialog);
  private readonly toast = inject(UiToast);

  protected readonly teams = ['Design', 'Engineering', 'Operations', 'Sales', 'Support'];
  protected readonly planGroups: { label: string; plans: Plan[] }[] = [
    {
      label: 'Open',
      plans: [
        {
          name: 'Tower B, floor 4',
          updated: 'Updated 2 hours ago',
          status: 'ממתין לאישור מתאם',
          tone: 'primary',
        },
        {
          name: 'Tower A, lobby',
          updated: 'Updated yesterday',
          status: 'ממתין לחתימה',
          tone: 'warning',
        },
      ],
    },
    {
      label: 'Drafts',
      plans: [
        {
          name: 'Parking level -1',
          updated: 'Created today',
          status: 'לא הוגדר לו"ז',
          tone: 'neutral',
        },
      ],
    },
  ];

  protected readonly files = signal<StoredFile[]>([
    {
      name: 'Google.pdf',
      size: 71_373,
      version: 1,
      uploadedAt: new Date(2026, 7, 27, 16, 7, 50),
      uploadedBy: 'תמיכה VPlans',
    },
    {
      name: 'תוכנית קומה 4 - גרסה סופית למתאם.pdf',
      size: 2_480_000,
      version: 3,
      uploadedAt: new Date(2026, 8, 20, 9, 12, 4),
      uploadedBy: 'דנה לוי',
    },
  ]);

  // The VPlans apps are Hebrew: index.html starts in RTL.
  protected readonly rtl = signal(this.document.documentElement.dir === 'rtl');
  protected readonly saving = signal(false);
  protected readonly profile = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    team: new FormControl('', { nonNullable: true }),
    role: new FormControl('developer', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
    notifications: new FormControl(true, { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }),
  });
  /** The form's value as a signal, for the Model panel. */
  protected readonly model = toSignal(
    this.profile.valueChanges.pipe(map(() => this.profile.getRawValue())),
    { initialValue: this.profile.getRawValue() },
  );

  protected toggleDirection(): void {
    this.rtl.update((rtl) => !rtl);
    const root = this.document.documentElement;
    root.dir = this.rtl() ? 'rtl' : 'ltr';
    root.lang = this.rtl() ? 'he' : 'en';
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    // The messages show only on a touched field, so an empty submit has to touch them all.
    if (this.profile.invalid) {
      this.profile.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    this.saving.set(false);
    this.toast.success('Profile saved');
  }

  protected async reset(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Reset the form?',
      message: 'Unsaved changes will be lost.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (confirmed) this.profile.reset();
  }

  protected renameFile(file: StoredFile, name: string): void {
    this.updateFile(file, { name });
    this.toast.success(`The file was renamed to ${name}`);
  }

  protected replaceFile(file: StoredFile, upload: File): void {
    this.updateFile(file, {
      size: upload.size,
      version: file.version + 1,
      uploadedAt: new Date(),
      uploadedBy: 'אני',
    });
    this.toast.success(`Version ${file.version + 1} of ${file.name} was uploaded`);
  }

  protected async removeFile(file: StoredFile): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: `Delete ${file.name}?`,
      message: 'All versions of the file will be deleted.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (confirmed) this.files.update((files) => files.filter((f) => f !== file));
  }

  private updateFile(file: StoredFile, changes: Partial<StoredFile>): void {
    this.files.update((files) => files.map((f) => (f === file ? { ...f, ...changes } : f)));
  }

  protected remind(plan: string): void {
    this.toast.info(`A reminder was sent for ${plan}`);
  }

  protected async remove(plan: string): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: `Delete ${plan}?`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (confirmed) this.toast.show({ message: `${plan} was deleted`, action: 'Undo' });
  }
}

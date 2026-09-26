import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
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
import { UiFormField } from '@vplans/ui-kit/form-field';
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
    FormField,
    UiButton,
    UiIconButton,
    UiCheckbox,
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
    PhaseThree,
    PhaseSix,
    PhaseSeven,
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

  // The VPlans apps are Hebrew: index.html starts in RTL.
  protected readonly rtl = signal(this.document.documentElement.dir === 'rtl');
  protected readonly saving = signal(false);
  protected readonly model = signal({
    name: '',
    email: '',
    team: '',
    role: 'developer',
    bio: '',
    notifications: true,
    terms: false,
  });
  protected readonly profile = form(this.model, (p) => {
    required(p.name, { message: 'Enter your name' });
    required(p.email, { message: 'Enter your email' });
    email(p.email, { message: 'Enter a valid email' });
    required(p.terms, { message: 'Accept the terms to continue' });
  });

  protected toggleDirection(): void {
    this.rtl.update((rtl) => !rtl);
    const root = this.document.documentElement;
    root.dir = this.rtl() ? 'rtl' : 'ltr';
    root.lang = this.rtl() ? 'he' : 'en';
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.profile, async () => {
      this.saving.set(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      this.saving.set(false);
      this.toast.success('Profile saved');
    });
  }

  protected async reset(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Reset the form?',
      message: 'Unsaved changes will be lost.',
      confirmLabel: 'Reset',
      tone: 'danger',
    });
    if (confirmed) this.profile().reset();
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

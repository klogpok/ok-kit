import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { UiButton, UiIconButton } from '@vplans/ui-kit/button';
import { UiCheckbox } from '@vplans/ui-kit/checkbox';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiIcon } from '@vplans/ui-kit/icon';
import { UiInput, UiTextarea } from '@vplans/ui-kit/input';
import { UiRadio, UiRadioGroup } from '@vplans/ui-kit/radio';
import { UiSpinner } from '@vplans/ui-kit/spinner';
import { UiSwitch } from '@vplans/ui-kit/switch';
import { ThemeService } from '@vplans/ui-kit/theme';

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
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);

  protected readonly rtl = signal(false);
  protected readonly saving = signal(false);
  protected readonly model = signal({
    name: '',
    email: '',
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
    this.document.documentElement.dir = this.rtl() ? 'rtl' : 'ltr';
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.profile, async () => {
      this.saving.set(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      this.saving.set(false);
    });
  }
}

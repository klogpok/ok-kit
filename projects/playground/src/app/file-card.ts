import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { UiBadge } from '@vplans/ui-kit/badge';
import { UiIconButton } from '@vplans/ui-kit/button';
import { UiCard, UiCardFooter, UiCardSubtitle, UiCardTitle } from '@vplans/ui-kit/card';
import { UiDivider } from '@vplans/ui-kit/divider';
import { formatFileSize } from '@vplans/ui-kit/file-upload';
import { UiIcon, UiIconDefinition } from '@vplans/ui-kit/icon';
import { UiInput } from '@vplans/ui-kit/input';
import { UiTooltip } from '@vplans/ui-kit/tooltip';

/** A stored file version as the VPlans API returns it. */
export interface StoredFile {
  name: string;
  size: number;
  version: number;
  uploadedAt: Date;
  uploadedBy: string;
}

/** A filled document with a "PDF" label, colored by `color` (the kit only has an outline file icon). */
const pdfIcon: UiIconDefinition = {
  name: 'app-file-pdf',
  svg:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<path fill="currentColor" d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>' +
    '<path fill="#fff" fill-opacity=".45" d="M14 2l6 6h-4a2 2 0 0 1-2-2z"/>' +
    '<text x="12" y="18" fill="#fff" font-family="Arial, sans-serif" font-size="6" font-weight="700" text-anchor="middle">PDF</text>' +
    '</svg>',
};

/**
 * Card of an uploaded file: type icon, name, size and version, the file actions and who uploaded it.
 * Built only from kit components; lives in the playground as a composition example.
 */
@Component({
  selector: 'app-file-card',
  imports: [
    DatePipe,
    UiBadge,
    UiCard,
    UiCardTitle,
    UiCardSubtitle,
    UiCardFooter,
    UiDivider,
    UiIcon,
    UiIconButton,
    UiInput,
    UiTooltip,
  ],
  templateUrl: './file-card.html',
  styleUrl: './file-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileCard {
  readonly file = input.required<StoredFile>();
  /** Blocks the delete button and explains why in a tooltip. */
  readonly deleteDisabled = input(false, { transform: booleanAttribute });

  readonly remove = output();
  readonly replace = output<File>();
  /** The new name, emitted when an inline rename is confirmed with Enter or blur. */
  readonly rename = output<string>();

  protected readonly pdfIcon = pdfIcon;
  protected readonly size = computed(() => formatFileSize(this.file().size, 'he'));

  protected readonly editing = signal(false);
  private readonly nameInput = viewChild<string, ElementRef<HTMLInputElement>>('nameInput', {
    read: ElementRef,
  });
  private readonly editButton = viewChild.required<string, ElementRef<HTMLButtonElement>>(
    'editButton',
    { read: ElementRef },
  );

  constructor() {
    effect(() => this.nameInput()?.nativeElement.select());
  }

  /** Saves the typed name. `refocus` returns focus to the edit button (Enter), not on blur. */
  protected commit(refocus = false): void {
    const input = this.nameInput()?.nativeElement;
    if (!this.editing() || !input) return;
    this.editing.set(false);
    const name = input.value.trim();
    if (name && name !== this.file().name) this.rename.emit(name);
    if (refocus) this.editButton().nativeElement.focus();
  }

  /** The edit button opens the rename field and, while it is open, saves and closes it. */
  protected toggleEditing(): void {
    if (this.editing()) this.commit(true);
    else this.editing.set(true);
  }

  /**
   * Keeps focus in the rename field when the edit button is pressed. Otherwise the field's blur
   * closes it on mousedown and the click opens it again.
   */
  protected keepFocus(event: MouseEvent): void {
    if (this.editing()) event.preventDefault();
  }

  protected cancel(): void {
    this.editing.set(false);
    this.editButton().nativeElement.focus();
  }

  protected pick(input: HTMLInputElement): void {
    const file = input.files?.[0];
    // Clear the value so picking the same file again still fires `change`.
    input.value = '';
    if (file) this.replace.emit(file);
  }
}

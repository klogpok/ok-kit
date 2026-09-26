import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { LiveAnnouncer, _IdGenerator } from '@angular/cdk/a11y';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { transformedValue } from '@angular/forms/signals';
import {
  UI_FORM_FIELD_CONTROL,
  UI_LABELS,
  UiFormControlBase,
  UiFormFieldControl,
} from '@vplans/ui-kit/core';
import { UiIcon, uiIconAlertCircle, uiIconFile, uiIconUpload, uiIconX } from '@vplans/ui-kit/icon';
import { UiProgressBar } from '@vplans/ui-kit/progress';
import { UiFileProblem, fileProblem, formatFileSize, sameFile } from './file-utils';

/** Look of the picker: a large drop area, or a compact button. */
export type UiFileUploadVariant = 'dropzone' | 'button';

/** A problem found in the value, as a forms error. */
interface FileError {
  kind: 'uiFileType' | 'uiFileSize' | 'uiFileCount';
  message: string;
}

const optionalNumber = (value: unknown): number | null =>
  value == null || value === '' ? null : numberAttribute(value, Number.NaN);

/**
 * Picks files with a drop area (a button: click, Enter or Space opens the file dialog, and files
 * can be dropped on it) and lists them with their size, a remove button and an optional upload
 * progress.
 *
 * - `accept` (like `<input type="file">`), `maxSize` (bytes) and `maxFiles` do not reject files:
 *   the files stay in the list, marked, and the control reports `uiFileType`, `uiFileSize` or
 *   `uiFileCount` errors with messages to Signal Forms or Reactive Forms, so the form is invalid
 *   until the user removes them. `ui-form-field` shows the messages.
 * - Without `multiple`, a new file replaces the old one.
 * - The kit does not upload anything. Upload the files yourself and pass the progress per file
 *   (0–100) in `progress`.
 *
 * The value is a new `File[]` on every change. Implements `FormValueControl` (Signal Forms) and
 * `ControlValueAccessor`.
 *
 * @example
 * <ui-form-field label="Plans" hint="PDF, up to 10 MB">
 *   <ui-file-upload [formField]="form.files" accept=".pdf" multiple [maxSize]="10 * 1024 * 1024"
 *                   [progress]="uploads()" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-file-upload',
  imports: [UiIcon, UiProgressBar],
  template: `
    <button
      #control
      type="button"
      class="ui-file-upload__zone"
      [class.ui-file-upload__zone--over]="dragOver()"
      [id]="controlId()"
      [disabled]="isDisabled()"
      [attr.aria-disabled]="readonly() ? 'true' : null"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabel() ? null : labelledBy()"
      [attr.aria-required]="isRequired() ? 'true' : null"
      [attr.aria-invalid]="invalidState() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      (click)="browse()"
      (dragenter)="onDragOver($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
      (blur)="onBlur()"
    >
      <ui-icon class="ui-file-upload__icon" [icon]="icons.upload" />
      <span [id]="promptId">
        {{ variant() === 'button' ? labels().chooseFiles : labels().dropFiles }}
      </span>
    </button>
    <input
      #picker
      type="file"
      hidden
      [disabled]="isDisabled()"
      [accept]="accept()"
      [multiple]="multiple()"
      (change)="onPicked($event)"
    />

    @if (value().length) {
      <ul class="ui-file-upload__list">
        @for (file of value(); track file) {
          <li
            class="ui-file-upload__file"
            [class.ui-file-upload__file--invalid]="problems().get(file)"
          >
            <ui-icon
              class="ui-file-upload__file-icon"
              [icon]="problems().get(file) ? icons.alert : icons.file"
            />
            <span class="ui-file-upload__file-text">
              <bdi class="ui-file-upload__name">{{ file.name }}</bdi>
              <bdi class="ui-file-upload__size">{{ size(file) }}</bdi>
              @if (progressOf(file); as percent) {
                <ui-progress-bar
                  class="ui-file-upload__progress"
                  size="sm"
                  [value]="percent.value"
                  [label]="file.name"
                  [tone]="percent.value >= 100 ? 'success' : 'primary'"
                />
              }
            </span>
            @if (editable()) {
              <button
                type="button"
                class="ui-file-upload__remove"
                [attr.aria-label]="labels().removeFile(file.name)"
                (click)="remove(file)"
              >
                <ui-icon [icon]="icons.remove" />
              </button>
            }
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: forwardRef(() => UiFileUpload) }],
  host: {
    class: 'ui-file-upload',
    '[class]': '"ui-file-upload--" + variant()',
    '[class.ui-file-upload--disabled]': 'isDisabled()',
    '[class.ui-file-upload--readonly]': 'readonly()',
    '[class.ui-file-upload--invalid]': 'invalidState()',
    '[attr.id]': 'id()',
    // The inner control carries the label and descriptions; static attributes stay on the host too.
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiFileUpload extends UiFormControlBase<readonly File[]> implements UiFormFieldControl {
  protected readonly labels = inject(UI_LABELS);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly value = model<readonly File[]>([]);
  /** Allowed files, like `accept` of `<input type="file">`: `.pdf,image/*`. */
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Largest allowed file, in bytes. */
  readonly maxSize = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Most files allowed with `multiple`. */
  readonly maxFiles = input<number | null, unknown>(null, { transform: optionalNumber });
  /** Upload progress per file, 0–100. Files without an entry show no bar. */
  readonly progress = input<ReadonlyMap<File, number> | null>(null);
  readonly variant = input<UiFileUploadVariant>('dropzone');
  /** Host id; the drop area gets `${id}-control`. */
  readonly id = input(inject(_IdGenerator).getId('ui-file-upload-'));
  readonly ariaLabel = input('', { alias: 'aria-label' });

  private readonly control = viewChild.required<ElementRef<HTMLButtonElement>>('control');
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  protected readonly icons = {
    upload: uiIconUpload,
    file: uiIconFile,
    alert: uiIconAlertCircle,
    remove: uiIconX,
  };
  protected readonly promptId = inject(_IdGenerator).getId('ui-file-upload-prompt-');
  protected readonly dragOver = signal(false);

  // The drop area is named by the field label and its own text ("Plans, drop files or click").
  readonly labelStrategy = 'labelledby' as const;
  readonly controlId = computed(() => `${this.id()}-control`);
  protected readonly labelledBy = computed(() =>
    [this.formField?.labelledBy(), this.promptId].filter(Boolean).join(' '),
  );
  protected readonly editable = computed(() => !this.isDisabled() && !this.readonly());
  private readonly locale = computed(() => this.labels().locale);

  /** The problem of each file in the value. */
  protected readonly problems = computed(() => {
    const map = new Map<File, UiFileProblem>();
    for (const file of this.value()) {
      const problem = fileProblem(file, this.accept(), this.maxSize());
      if (problem) map.set(file, problem);
    }
    return map;
  });

  /** Errors of the current value, with messages. */
  private readonly fileErrors = computed<FileError[]>(() => this.errorsOf(this.value()));

  /**
   * Through `transformedValue` Signal Forms receives the file errors of a user change; they
   * clear when the value changes elsewhere or the form is reset.
   */
  private readonly picked = transformedValue(this.value, {
    parse: (files: readonly File[]) => ({ value: files, error: this.errorsOf(files) }),
    format: (files: readonly File[]) => files,
  });

  protected readonly invalidState = computed(
    () => this.showError() || (!this.controlState.bound && this.fileErrors().length > 0),
  );

  /** Reports the file errors to Reactive / template forms, which read them only from validators. */
  private readonly fileValidator: ValidatorFn = (): ValidationErrors | null => {
    const errors = this.fileErrors();
    if (!errors.length) return null;
    return Object.fromEntries(errors.map((error) => [error.kind, { message: error.message }]));
  };

  private validatedControl: AbstractControl | null = null;

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.releaseValidator());
  }

  /** Without a forms directive, the field itself shows the file errors. */
  protected override ownErrors(): readonly string[] {
    return this.controlState.bound ? [] : this.fileErrors().map((error) => error.message);
  }

  writeValue(value: readonly File[] | null | undefined): void {
    this.value.set(value ?? []);
  }

  override registerOnChange(fn: (value: readonly File[]) => void): void {
    const control = this.ngControl?.control ?? null;
    if (control !== this.validatedControl) {
      this.releaseValidator();
      if (control && !control.hasValidator(this.fileValidator)) {
        control.addValidators(this.fileValidator);
      }
      this.validatedControl = control;
    }
    super.registerOnChange(fn);
  }

  focus(options?: FocusOptions): void {
    this.control().nativeElement.focus(options);
  }

  /** Opens the file dialog of the browser. */
  browse(): void {
    if (this.editable()) this.picker().nativeElement.click();
  }

  /** Adds files like a pick or a drop: they replace the value without `multiple`. */
  addFiles(files: readonly File[]): void {
    if (!this.editable() || !files.length) return;
    const current = this.multiple() ? this.value() : [];
    const added = (this.multiple() ? files : files.slice(0, 1)).filter(
      (file) => !current.some((known) => sameFile(known, file)),
    );
    if (added.length || !this.multiple()) this.setValue([...current, ...added]);
  }

  /** Removes a file from the value and announces it. */
  remove(file: File): void {
    if (!this.editable()) return;
    const files = this.value();
    const index = files.indexOf(file);
    if (index < 0) return;
    const focusInList = !!this.host
      .querySelector('.ui-file-upload__list')
      ?.contains(this.host.ownerDocument.activeElement);
    this.setValue(files.filter((f) => f !== file));
    void this.announcer.announce(this.labels().fileRemoved(file.name), 'polite');
    // Keep focus in the component: on the next remove button, or on the drop area.
    if (focusInList) {
      afterNextRender(
        () => {
          const buttons = this.host.querySelectorAll<HTMLElement>('.ui-file-upload__remove');
          (buttons[Math.min(index, buttons.length - 1)] ?? this.control().nativeElement).focus();
        },
        { injector: this.injector },
      );
    }
  }

  protected size(file: File): string {
    return formatFileSize(file.size, this.locale());
  }

  protected progressOf(file: File): { value: number } | null {
    const value = this.progress()?.get(file);
    return value == null ? null : { value: Math.min(100, Math.max(0, value)) };
  }

  protected onPicked(event: Event): void {
    const picker = event.target as HTMLInputElement;
    this.addFiles([...(picker.files ?? [])]);
    // The same file can be picked again after it was removed.
    picker.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.editable()) return;
    // Allows the drop.
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.addFiles([...(event.dataTransfer?.files ?? [])]);
  }

  protected onBlur(): void {
    this.notifyTouched();
  }

  private errorsOf(files: readonly File[]): FileError[] {
    const labels = this.labels();
    const errors: FileError[] = [];
    for (const file of files) {
      const problem = fileProblem(file, this.accept(), this.maxSize());
      if (problem === 'type') {
        errors.push({ kind: 'uiFileType', message: labels.fileTypeNotAllowed(file.name) });
      } else if (problem === 'size') {
        const max = formatFileSize(this.maxSize() ?? 0, this.locale());
        errors.push({ kind: 'uiFileSize', message: labels.fileTooLarge(file.name, max) });
      }
    }
    const maxFiles = this.maxFiles();
    if (maxFiles !== null && files.length > maxFiles) {
      errors.push({ kind: 'uiFileCount', message: labels.tooManyFiles(maxFiles) });
    }
    return errors;
  }

  private setValue(files: readonly File[]): void {
    this.picked.set(files);
    this.notifyChange(this.value());
  }

  private releaseValidator(): void {
    const control = this.validatedControl;
    this.validatedControl = null;
    if (!control?.hasValidator(this.fileValidator)) return;
    control.removeValidators(this.fileValidator);
    control.updateValueAndValidity();
  }
}

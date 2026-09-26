import { Component, OnInit, input, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiFileUpload, UiFileUploadVariant } from './file-upload';

const MB = 1024 * 1024;
/** A small file that reports a large size, so the stories do not allocate megabytes. */
const sized = (name: string, bytes: number, type = 'application/pdf') => {
  const created = new File(['x'], name, { type, lastModified: 1 });
  Object.defineProperty(created, 'size', { value: bytes });
  return created;
};

/** A field wired the way an app would do it, with files already picked. */
@Component({
  selector: 'ui-story-file-upload',
  imports: [UiFileUpload, UiFormField],
  template: `
    <div style="max-inline-size:28rem">
      <ui-form-field label="תוכניות" hint="PDF, עד 10 MB לקובץ">
        <ui-file-upload
          [(value)]="files"
          accept=".pdf"
          multiple
          [maxSize]="10 * mb"
          [variant]="variant()"
          [progress]="progress"
          [disabled]="disabled()"
          [readonly]="readonly()"
        />
      </ui-form-field>
    </div>
  `,
})
class FileUploadDemo implements OnInit {
  readonly withFiles = input(false);
  readonly variant = input<UiFileUploadVariant>('dropzone');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly mb = MB;
  private readonly sample = [
    sized('קומה 4 - חשמל.pdf', 2.4 * MB),
    sized('חתך א-א.pdf', 820 * 1024),
    sized('הדמיה.png', 14 * MB, 'image/png'),
  ];
  readonly files = signal<readonly File[]>([]);
  readonly progress = new Map<File, number>([
    [this.sample[0], 100],
    [this.sample[1], 45],
  ]);

  ngOnInit(): void {
    if (this.withFiles()) this.files.set(this.sample);
  }
}

const meta: Meta<UiFileUpload> = {
  title: 'Forms/File upload',
  component: UiFileUpload,
  decorators: [moduleMetadata({ imports: [UiFormField, FileUploadDemo] })],
};

export default meta;
type Story = StoryObj<UiFileUpload>;

/** The drop area is a button: click, Enter or Space open the file dialog; files can be dropped. */
export const Default: Story = {
  render: () => ({ template: `<ui-story-file-upload dir="rtl" lang="he" />` }),
};

/**
 * Picked files with their size and the upload progress the app passes in. A file that breaks
 * `accept` or `maxSize` stays in the list, marked, and the field shows why.
 */
export const WithFiles: Story = {
  render: () => ({ template: `<ui-story-file-upload dir="rtl" lang="he" [withFiles]="true" />` }),
};

/** The compact look for dialogs and dense forms. */
export const ButtonVariant: Story = {
  render: () => ({
    template: `<ui-story-file-upload dir="rtl" lang="he" variant="button" [withFiles]="true" />`,
  }),
};

export const States: Story = {
  render: () => ({
    template: `
      <div dir="rtl" lang="he" style="display:grid;gap:24px">
        <ui-story-file-upload [disabled]="true" />
        <ui-story-file-upload [readonly]="true" [withFiles]="true" />
      </div>`,
  }),
};

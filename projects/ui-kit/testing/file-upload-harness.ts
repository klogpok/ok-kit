import {
  BaseHarnessFilters,
  ComponentHarnessConstructor,
  EventData,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import { UiHarness } from './harness';

export interface UiFileUploadHarnessFilters extends BaseHarnessFilters {
  /** `aria-label` or the text of the field label (`ui-form-field`). */
  label?: string | RegExp;
  disabled?: boolean;
}

/** A file in the list of `ui-file-upload`. */
export interface UiFileUploadItem {
  name: string;
  /** The size as shown, e.g. "12.5 KB". */
  size: string;
  /** The file breaks `accept` or `maxSize`. */
  invalid: boolean;
  /** Upload progress (0–100), or `null` without a bar. */
  progress: number | null;
}

/** Harness for `ui-file-upload`. */
export class UiFileUploadHarness extends UiHarness {
  static hostSelector = '.ui-file-upload';

  private readonly zone = this.locatorFor('.ui-file-upload__zone');

  static with<T extends UiFileUploadHarness>(
    this: ComponentHarnessConstructor<T>,
    options: UiFileUploadHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  protected override focusTarget(): Promise<TestElement> {
    return this.zone();
  }

  /** The `aria-label`, else the text of the field label. */
  async getLabel(): Promise<string | null> {
    const zone = await this.zone();
    const ariaLabel = await zone.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    const [labelId] = ((await zone.getAttribute('aria-labelledby')) ?? '').split(' ');
    const label = labelId
      ? await this.documentRootLocatorFactory().locatorForOptional(`label[id="${labelId}"]`)()
      : null;
    return label
      ? label.text({ exclude: '.ui-form-field__required, .ui-form-field__required-text' })
      : null;
  }

  /** Drops files on the drop area, like a user dragging them from the desktop. */
  async dropFiles(files: File[]): Promise<void> {
    const zone = await this.zone();
    // A file is not `EventData`; the drop only reads it from `dataTransfer.files`.
    await zone.dispatchEvent('drop', { dataTransfer: { files } } as unknown as Record<
      string,
      EventData
    >);
  }

  async getFiles(): Promise<UiFileUploadItem[]> {
    const count = (await this.locatorForAll('.ui-file-upload__file')()).length;
    return Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const row = `.ui-file-upload__file:nth-child(${i + 1})`;
        const [item, name, size, bar] = await Promise.all([
          this.locatorFor(row)(),
          this.locatorFor(`${row} .ui-file-upload__name`)(),
          this.locatorFor(`${row} .ui-file-upload__size`)(),
          this.locatorForOptional(`${row} [role=progressbar]`)(),
        ]);
        const now = bar ? await bar.getAttribute('aria-valuenow') : null;
        return {
          name: await name.text(),
          size: await size.text(),
          invalid: await item.hasClass('ui-file-upload__file--invalid'),
          progress: now === null ? null : Number(now),
        };
      }),
    );
  }

  /** Clicks the remove button of the first file with this name. */
  async removeFile(name: string): Promise<void> {
    const buttons = await this.locatorForAll('.ui-file-upload__remove')();
    for (const button of buttons) {
      if ((await button.getAttribute('aria-label'))?.includes(name)) {
        await button.click();
        return;
      }
    }
    throw Error(`No removable file named ${name}.`);
  }

  async isDisabled(): Promise<boolean> {
    return (await this.zone()).getProperty<boolean>('disabled');
  }

  async isReadonly(): Promise<boolean> {
    return (await (await this.zone()).getAttribute('aria-disabled')) === 'true';
  }

  async isInvalid(): Promise<boolean> {
    return (await (await this.zone()).getAttribute('aria-invalid')) === 'true';
  }
}

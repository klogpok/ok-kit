import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { MockInstance } from 'vitest';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiFileUploadHarness } from '@vplans/ui-kit/testing';
import { UiFileUpload } from './file-upload';
import { acceptsFile, fileProblem, formatFileSize, sameFile } from './file-utils';

const file = (name: string, size = 1000, type = '') =>
  new File([new Uint8Array(size)], name, { type, lastModified: 1 });

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/** Sets the files of the hidden picker and fires its change event. */
function pick(root: HTMLElement, files: File[]): void {
  const picker = root.querySelector<HTMLInputElement>('input[type=file]')!;
  Object.defineProperty(picker, 'files', { configurable: true, value: files });
  picker.dispatchEvent(new Event('change'));
}

function drop(target: Element, files: File[], type = 'drop'): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  target.dispatchEvent(event);
  return event;
}

describe('file utils', () => {
  it('matches extensions, wildcards and MIME types', () => {
    expect(acceptsFile(file('Plan.PDF'), '.pdf')).toBe(true);
    expect(acceptsFile(file('a.png', 1, 'image/png'), 'image/*')).toBe(true);
    expect(acceptsFile(file('a.pdf', 1, 'application/pdf'), 'application/pdf, .dwg')).toBe(true);
    expect(acceptsFile(file('a.exe'), '.pdf,image/*')).toBe(false);
    expect(acceptsFile(file('a.exe'), '')).toBe(true);
  });

  it('finds the problem of a file', () => {
    expect(fileProblem(file('a.exe'), '.pdf', null)).toBe('type');
    expect(fileProblem(file('a.pdf', 2000), '.pdf', 1000)).toBe('size');
    expect(fileProblem(file('a.pdf', 500), '.pdf', 1000)).toBeNull();
  });

  it('formats sizes and compares files', () => {
    expect(formatFileSize(800, 'en-US')).toBe('800 bytes');
    expect(formatFileSize(12.5 * 1024, 'en-US')).toBe('12.5 kB');
    expect(formatFileSize(3 * 1024 * 1024, 'en-US')).toBe('3 MB');
    expect(sameFile(file('a'), file('a'))).toBe(true);
    expect(sameFile(file('a'), file('b'))).toBe(false);
  });
});

@Component({
  imports: [UiFileUpload, UiFormField],
  template: `
    <ui-form-field label="Plans">
      <ui-file-upload
        [(value)]="files"
        accept=".pdf"
        [multiple]="multiple()"
        [maxSize]="2000"
        [maxFiles]="maxFiles()"
        [progress]="progress()"
        [disabled]="disabled()"
        [readonly]="readonly()"
      />
    </ui-form-field>
  `,
})
class Host {
  readonly files = signal<readonly File[]>([]);
  readonly multiple = signal(true);
  readonly maxFiles = signal<number | null>(null);
  readonly progress = signal<ReadonlyMap<File, number> | null>(null);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
}

describe('UiFileUpload', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;
  let announce: MockInstance<LiveAnnouncer['announce']>;
  const zone = () => root.querySelector<HTMLButtonElement>('.ui-file-upload__zone')!;
  const names = () =>
    [...root.querySelectorAll('.ui-file-upload__name')].map((n) => n.textContent?.trim());
  const errors = () => root.querySelector('.ui-form-field__error')!.textContent;

  beforeEach(async () => {
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    await settle(fixture);
  });

  afterEach(() => root.remove());

  it('is a button named by the field label and its text', () => {
    const label = root.querySelector('label')!;
    expect(zone().type).toBe('button');
    const [labelId, promptId] = zone().getAttribute('aria-labelledby')!.split(' ');
    expect(labelId).toBe(label.id);
    expect(document.getElementById(promptId)!.textContent?.trim()).toBe(
      'גררו קבצים לכאן או לחצו לבחירה',
    );
    const picker = root.querySelector<HTMLInputElement>('input[type=file]')!;
    expect(picker.hidden).toBe(true);
    expect(picker.accept).toBe('.pdf');
    expect(picker.multiple).toBe(true);
  });

  it('opens the file dialog on click', () => {
    const picker = root.querySelector<HTMLInputElement>('input[type=file]')!;
    const click = vi.spyOn(picker, 'click').mockImplementation(() => undefined);
    zone().click();
    expect(click).toHaveBeenCalled();
  });

  it('adds picked and dropped files and lists them with their size', async () => {
    pick(root, [file('a.pdf', 1024)]);
    await settle(fixture);
    const dropped = drop(zone(), [file('b.pdf'), file('a.pdf', 1024)]);
    await settle(fixture);
    expect(dropped.defaultPrevented).toBe(true);
    expect(host.files().map((f) => f.name)).toEqual(['a.pdf', 'b.pdf']);
    expect(names()).toEqual(['a.pdf', 'b.pdf']);
    expect(root.querySelector('.ui-file-upload__size')!.textContent).toContain('1');
  });

  it('replaces the file without multiple', async () => {
    host.multiple.set(false);
    await settle(fixture);
    pick(root, [file('a.pdf')]);
    await settle(fixture);
    pick(root, [file('b.pdf'), file('c.pdf')]);
    await settle(fixture);
    expect(host.files().map((f) => f.name)).toEqual(['b.pdf']);
  });

  it('marks drag over and allows the drop', async () => {
    const over = drop(zone(), [], 'dragover');
    await settle(fixture);
    expect(over.defaultPrevented).toBe(true);
    expect(zone().classList).toContain('ui-file-upload__zone--over');
    zone().dispatchEvent(new Event('dragleave'));
    await settle(fixture);
    expect(zone().classList).not.toContain('ui-file-upload__zone--over');
  });

  it('keeps files that break the rules and reports them', async () => {
    host.maxFiles.set(1);
    await settle(fixture);
    pick(root, [file('big.pdf', 5000), file('virus.exe')]);
    await settle(fixture);
    expect(names()).toEqual(['big.pdf', 'virus.exe']);
    expect(root.querySelectorAll('.ui-file-upload__file--invalid')).toHaveLength(2);
    expect(zone().getAttribute('aria-invalid')).toBe('true');
    expect(errors()).toMatch(/big.pdf.* גדול מ-/);
    expect(errors()).toMatch(/סוג הקובץ .virus.exe. אינו נתמך/);
    expect(errors()).toContain('אפשר לצרף עד 1 קבצים');
  });

  it('removes a file, announces it and keeps focus in the list', async () => {
    pick(root, [file('a.pdf'), file('b.pdf')]);
    await settle(fixture);
    const [first] = root.querySelectorAll<HTMLButtonElement>('.ui-file-upload__remove');
    expect(first.getAttribute('aria-label')).toBe('הסרת a.pdf');
    first.focus();
    first.click();
    await settle(fixture);
    await settle(fixture);
    expect(host.files().map((f) => f.name)).toEqual(['b.pdf']);
    expect(announce).toHaveBeenCalledWith('a.pdf הוסר', 'polite');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('הסרת b.pdf');

    root.querySelector<HTMLButtonElement>('.ui-file-upload__remove')!.click();
    await settle(fixture);
    await settle(fixture);
    expect(document.activeElement).toBe(zone());
  });

  it('shows the upload progress of a file', async () => {
    pick(root, [file('a.pdf'), file('b.pdf')]);
    await settle(fixture);
    const [a, b] = host.files();
    host.progress.set(
      new Map([
        [a, 40],
        [b, 100],
      ]),
    );
    await settle(fixture);
    const bars = root.querySelectorAll('[role=progressbar]');
    expect(bars).toHaveLength(2);
    expect(bars[0].getAttribute('aria-valuenow')).toBe('40');
    expect(bars[0].getAttribute('aria-label')).toBe('a.pdf');
  });

  it('does not change while readonly or disabled', async () => {
    pick(root, [file('a.pdf')]);
    host.readonly.set(true);
    await settle(fixture);
    expect(zone().getAttribute('aria-disabled')).toBe('true');
    expect(root.querySelector('.ui-file-upload__remove')).toBeNull();
    drop(zone(), [file('b.pdf')]);
    await settle(fixture);
    expect(host.files()).toHaveLength(1);

    host.readonly.set(false);
    host.disabled.set(true);
    await settle(fixture);
    expect(zone().disabled).toBe(true);
  });
});

/** Reactive forms show the message of an error value that is a string. */
const attachAPlan: ValidatorFn = (control) =>
  (control.value as readonly File[] | null)?.length ? null : { plans: 'Attach a plan' };

@Component({
  imports: [UiFileUpload, UiFormField, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ui-form-field label="Plans">
        <ui-file-upload formControlName="plans" accept=".pdf" multiple variant="button" />
      </ui-form-field>
      <ui-form-field label="Scans">
        <ui-file-upload
          formControlName="scans"
          accept=".pdf"
          multiple
          [maxSize]="2000"
          [maxFiles]="1"
        />
      </ui-form-field>
    </form>
  `,
})
class ReactiveHost {
  readonly form = new FormGroup({
    plans: new FormControl<readonly File[]>([], attachAPlan),
    scans: new FormControl<readonly File[]>([]),
  });
}

describe('UiFileUpload with Reactive Forms', () => {
  let fixture: ComponentFixture<ReactiveHost>;
  let host: ReactiveHost;
  let controls: ReactiveHost['form']['controls'];
  let loader: HarnessLoader;
  const upload = (label: string) => loader.getHarness(UiFileUploadHarness.with({ label }));
  /** The message `ui-form-field` shows under the field with this label. */
  const errorOf = (label: string): string => {
    const fields = [...(fixture.nativeElement as HTMLElement).querySelectorAll('ui-form-field')];
    const owner = fields.find((it) => it.querySelector('label')?.textContent?.includes(label));
    return owner?.querySelector('.ui-form-field__error')?.textContent?.trim() ?? '';
  };

  beforeEach(async () => {
    fixture = TestBed.createComponent(ReactiveHost);
    host = fixture.componentInstance;
    controls = host.form.controls;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('binds the value both ways and shows the compact button', async () => {
    const plans = await upload('Plans');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.ui-file-upload__zone')!.textContent,
    ).toContain('בחירת קבצים');

    await plans.dropFiles([file('a.pdf')]);
    await settle(fixture);
    expect(controls.plans.value!.map((f) => f.name)).toEqual(['a.pdf']);
    expect((await plans.getFiles()).map((f) => f.name)).toEqual(['a.pdf']);

    controls.plans.setValue([file('b.pdf')]);
    await settle(fixture);
    expect((await plans.getFiles()).map((f) => f.name)).toEqual(['b.pdf']);
  });

  it('disables the drop area from the control', async () => {
    const plans = await upload('Plans');
    controls.plans.disable();
    await settle(fixture);
    expect(await plans.isDisabled()).toBe(true);
    await plans.dropFiles([file('a.pdf')]);
    await settle(fixture);
    expect(await plans.getFiles()).toEqual([]);
  });

  it('marks the control touched when the user leaves the drop area', async () => {
    const plans = await upload('Plans');
    expect(controls.plans.touched).toBe(false);
    await plans.focus();
    await plans.blur();
    expect(controls.plans.touched).toBe(true);
  });

  it('shows the validator message only once the control is invalid and touched', async () => {
    const plans = await upload('Plans');
    expect(controls.plans.invalid).toBe(true);
    expect(await plans.isInvalid()).toBe(false);
    expect(errorOf('Plans')).toBe('');

    await plans.blur();
    await settle(fixture);
    expect(await plans.isInvalid()).toBe(true);
    expect(errorOf('Plans')).toContain('Attach a plan');

    await plans.dropFiles([file('a.pdf')]);
    await settle(fixture);
    expect(controls.plans.valid).toBe(true);
    expect(errorOf('Plans')).toBe('');
  });

  it('says why a file is rejected without failing the control', async () => {
    const scans = await upload('Scans');
    await scans.dropFiles([file('big.pdf', 5000), file('virus.exe')]);
    await settle(fixture);
    expect(controls.scans.value!.map((f) => f.name)).toEqual(['big.pdf', 'virus.exe']);
    expect((await scans.getFiles()).map((f) => f.invalid)).toEqual([true, true]);
    expect(await scans.isInvalid()).toBe(true);
    expect(errorOf('Scans')).toMatch(/big.pdf.* גדול מ-/);
    expect(errorOf('Scans')).toMatch(/סוג הקובץ .virus.exe. אינו נתמך/);
    expect(errorOf('Scans')).toContain('אפשר לצרף עד 1 קבצים');

    expect(controls.scans.errors).toBeNull();
    expect(controls.scans.valid).toBe(true);
  });

  it('drops the message when the rejected file is removed', async () => {
    const scans = await upload('Scans');
    await scans.dropFiles([file('a.pdf', 100), file('virus.exe')]);
    await settle(fixture);
    expect(errorOf('Scans')).not.toBe('');

    await scans.removeFile('virus.exe');
    await settle(fixture);
    expect(await scans.isInvalid()).toBe(false);
    expect(errorOf('Scans')).toBe('');
  });

  it('leaves the errors of a bound control to its own validators', async () => {
    const plans = await upload('Plans');
    await plans.dropFiles([file('virus.exe')]);
    await settle(fixture);
    expect(controls.plans.errors).toBeNull();
    expect(host.form.valid).toBe(true);
    expect(errorOf('Plans')).toMatch(/סוג הקובץ .virus.exe. אינו נתמך/);

    await plans.removeFile('virus.exe');
    await settle(fixture);
    expect(controls.plans.errors).toEqual({ plans: 'Attach a plan' });
  });

  it('drops the message when the control writes files that pass', async () => {
    const scans = await upload('Scans');
    await scans.dropFiles([file('virus.exe')]);
    await settle(fixture);
    expect(errorOf('Scans')).not.toBe('');

    controls.scans.setValue([file('a.pdf', 100)]);
    await settle(fixture);
    expect(await scans.isInvalid()).toBe(false);
    expect(errorOf('Scans')).toBe('');
  });
});

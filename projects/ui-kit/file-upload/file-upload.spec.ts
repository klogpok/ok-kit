import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, minLength } from '@angular/forms/signals';
import { UiFormField } from '@vplans/ui-kit/form-field';
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
  let announce: ReturnType<typeof vi.spyOn>;
  const zone = () => root.querySelector<HTMLButtonElement>('.ui-file-upload__zone')!;
  const names = () =>
    [...root.querySelectorAll('.ui-file-upload__name')].map((n) => n.textContent.trim());
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
    expect(document.getElementById(promptId)!.textContent.trim()).toBe(
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

@Component({
  imports: [UiFileUpload, UiFormField, ReactiveFormsModule],
  template: `
    <ui-form-field label="Plans">
      <ui-file-upload [formControl]="files" accept=".pdf" multiple variant="button" />
    </ui-form-field>
  `,
})
class ReactiveHost {
  readonly files = new FormControl<readonly File[]>([], Validators.required);
}

describe('UiFileUpload with forms', () => {
  it('works with Reactive Forms and reports file errors', async () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const { files } = fixture.componentInstance;
    expect(root.querySelector('.ui-file-upload__zone')!.textContent).toContain('בחירת קבצים');
    expect(files.invalid).toBe(true);
    pick(root, [file('a.pdf')]);
    await settle(fixture);
    expect(files.value!.map((f) => f.name)).toEqual(['a.pdf']);
    expect(files.valid).toBe(true);

    pick(root, [file('b.exe')]);
    await settle(fixture);
    expect(files.hasError('uiFileType')).toBe(true);

    files.setValue([]);
    await settle(fixture);
    expect(root.querySelector('.ui-file-upload__list')).toBeNull();
    root
      .querySelector<HTMLButtonElement>('.ui-file-upload__zone')!
      .dispatchEvent(new FocusEvent('blur'));
    expect(files.touched).toBe(true);
    fixture.destroy();
    expect(files.hasError('uiFileType')).toBe(false);
  });

  it('works with Signal Forms and reports file errors', async () => {
    @Component({
      imports: [UiFileUpload, UiFormField, FormField],
      template: `
        <ui-form-field label="Plans">
          <ui-file-upload [formField]="plan.files" [maxSize]="10" multiple />
        </ui-form-field>
      `,
    })
    class SignalHost {
      readonly model = signal<{ files: readonly File[] }>({ files: [] });
      readonly plan = form(this.model, (p) => {
        minLength(p.files, 1, { message: 'Attach a plan' });
      });
    }
    const fixture = TestBed.createComponent(SignalHost);
    const root = fixture.nativeElement as HTMLElement;
    await settle(fixture);
    const host = fixture.componentInstance;
    pick(root, [file('a.pdf', 100)]);
    await settle(fixture);
    expect(host.model().files).toHaveLength(1);
    expect(
      host.plan
        .files()
        .errors()
        .map((e) => e.kind),
    ).toContain('uiFileSize');
    root.querySelector<HTMLButtonElement>('.ui-file-upload__remove')!.click();
    await settle(fixture);
    expect(
      host.plan
        .files()
        .errors()
        .map((e) => e.kind),
    ).toEqual(['minLength']);
    fixture.destroy();
  });
});

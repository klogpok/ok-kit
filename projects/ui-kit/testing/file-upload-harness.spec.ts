import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { UiFileUpload } from '@vplans/ui-kit/file-upload';
import { UiFormField } from '@vplans/ui-kit/form-field';
import { UiFileUploadHarness } from './file-upload-harness';

const file = (name: string, size = 1000) => new File([new Uint8Array(size)], name);

@Component({
  imports: [UiFileUpload, UiFormField],
  template: `
    <ui-form-field label="Plans">
      <ui-file-upload [(value)]="files" accept=".pdf" multiple [progress]="progress()" />
    </ui-form-field>
    <ui-file-upload aria-label="Locked" disabled />
  `,
})
class Host {
  readonly files = signal<readonly File[]>([]);
  readonly progress = signal<ReadonlyMap<File, number> | null>(null);
}

describe('UiFileUploadHarness', () => {
  let loader: HarnessLoader;
  let host: Host;

  beforeEach(() => {
    const fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('finds file uploads by label and state', async () => {
    expect(await loader.getAllHarnesses(UiFileUploadHarness)).toHaveLength(2);
    const locked = await loader.getHarness(UiFileUploadHarness.with({ disabled: true }));
    expect(await locked.getLabel()).toBe('Locked');
    const plans = await loader.getHarness(UiFileUploadHarness.with({ label: 'Plans' }));
    expect(await plans.isDisabled()).toBe(false);
    expect(await plans.isReadonly()).toBe(false);
  });

  it('drops, lists and removes files', async () => {
    const plans = await loader.getHarness(UiFileUploadHarness.with({ label: 'Plans' }));
    await plans.dropFiles([file('a.pdf'), file('b.exe')]);
    expect(host.files().map((f) => f.name)).toEqual(['a.pdf', 'b.exe']);
    host.progress.set(new Map([[host.files()[0], 60]]));
    const files = await plans.getFiles();
    expect(files.map((f) => [f.name, f.invalid, f.progress])).toEqual([
      ['a.pdf', false, 60],
      ['b.exe', true, null],
    ]);
    expect(files[0].size).toBeTruthy();
    expect(await plans.isInvalid()).toBe(true);
    await plans.removeFile('b.exe');
    expect(host.files().map((f) => f.name)).toEqual(['a.pdf']);
    await expect(plans.removeFile('c.pdf')).rejects.toThrow('No removable file');
  });
});

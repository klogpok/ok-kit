import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiProgressBar, UiProgressTone } from './progress-bar';

@Component({
  imports: [UiProgressBar],
  template: `
    <ui-progress-bar id="bar" [value]="value()" [max]="max()" [tone]="tone()" [label]="label()" />
    <span id="caption">Uploading plan.pdf</span>
    <ui-progress-bar id="named" value="30" size="sm" aria-labelledby="caption" />
  `,
})
class Host {
  readonly value = signal<number | null>(40);
  readonly max = signal(100);
  readonly tone = signal<UiProgressTone>('primary');
  readonly label = signal('');
}

describe('UiProgressBar', () => {
  let fixture: ComponentFixture<Host>;
  const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)!;
  const indicator = (id: string) =>
    el(id).querySelector<HTMLElement>('.ui-progress-bar__indicator')!;
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    fixture = TestBed.createComponent(Host);
    await render();
  });

  it('is a determinate progressbar with the value range', () => {
    const bar = el('bar');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(indicator('bar').style.inlineSize).toBe('40%');
    expect(bar.classList).not.toContain('ui-progress-bar--indeterminate');
  });

  it('scales the value to max and clamps it', async () => {
    fixture.componentInstance.max.set(8);
    fixture.componentInstance.value.set(2);
    await render();
    expect(indicator('bar').style.inlineSize).toBe('25%');
    expect(el('bar').getAttribute('aria-valuemax')).toBe('8');
    fixture.componentInstance.value.set(12);
    await render();
    expect(el('bar').getAttribute('aria-valuenow')).toBe('8');
    expect(indicator('bar').style.inlineSize).toBe('100%');
    fixture.componentInstance.value.set(-3);
    await render();
    expect(el('bar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('falls back to a max of 100 when max is not positive', async () => {
    fixture.componentInstance.max.set(0);
    await render();
    expect(el('bar').getAttribute('aria-valuemax')).toBe('100');
  });

  it('is indeterminate without a value', async () => {
    fixture.componentInstance.value.set(null);
    await render();
    expect(el('bar').hasAttribute('aria-valuenow')).toBe(false);
    expect(el('bar').classList).toContain('ui-progress-bar--indeterminate');
    expect(indicator('bar').style.inlineSize).toBe('');
  });

  it('is named by label, else by the loading label', async () => {
    expect(el('bar').getAttribute('aria-label')).toBe('Loading');
    fixture.componentInstance.label.set('Uploading plan.pdf');
    await render();
    expect(el('bar').getAttribute('aria-label')).toBe('Uploading plan.pdf');
  });

  it('uses aria-labelledby instead of a label, and parses attribute values', () => {
    expect(el('named').getAttribute('aria-labelledby')).toBe('caption');
    expect(el('named').hasAttribute('aria-label')).toBe(false);
    expect(el('named').getAttribute('aria-valuenow')).toBe('30');
    expect(el('named').classList).toContain('ui-progress-bar--sm');
  });

  it('follows the tone', async () => {
    fixture.componentInstance.tone.set('success');
    await render();
    expect(el('bar').classList).toContain('ui-progress-bar--success');
  });
});

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UI_LABELS_EN, provideUiLabels } from '@vplans/ui-kit/core';
import { UiAlert, UiAlertLive, UiAlertTone } from './alert';

@Component({
  imports: [UiAlert],
  template: `
    <ui-alert id="default">The plan was saved.</ui-alert>
    <ui-alert
      id="custom"
      title="Not signed"
      [tone]="tone()"
      [live]="live()"
      [dismissible]="dismissible()"
      (dismissed)="dismissals.set(dismissals() + 1)"
    >
      Send it to the owner.
      <button uiAlertActions type="button">Send</button>
    </ui-alert>
  `,
})
class Host {
  readonly tone = signal<UiAlertTone>('warning');
  readonly live = signal<UiAlertLive>('off');
  readonly dismissible = signal(true);
  readonly dismissals = signal(0);
}

describe('UiAlert', () => {
  let fixture: ComponentFixture<Host>;
  const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)!;
  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    fixture = TestBed.createComponent(Host);
    await render();
  });

  it('renders an info alert without a title, actions or close button by default', () => {
    const alert = el('default');
    expect(alert.classList).toContain('ui-alert--info');
    expect(alert.querySelector('.ui-alert__message')?.textContent).toBe('The plan was saved.');
    expect(alert.querySelector('.ui-alert__title')).toBeNull();
    expect(alert.querySelector('.ui-alert__actions')?.children.length).toBe(0);
    expect(alert.querySelector('.ui-alert__close')).toBeNull();
    expect(alert.querySelector('ui-icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the title and projects actions into their slot', () => {
    const alert = el('custom');
    expect(alert.querySelector('.ui-alert__title')?.textContent).toBe('Not signed');
    expect(alert.querySelector('.ui-alert__actions button')?.textContent).toBe('Send');
    expect(alert.hasAttribute('title')).toBe(false);
  });

  it('follows the tone', async () => {
    expect(el('custom').classList).toContain('ui-alert--warning');
    fixture.componentInstance.tone.set('danger');
    await render();
    expect(el('custom').classList).toContain('ui-alert--danger');
    expect(el('custom').classList).not.toContain('ui-alert--warning');
  });

  it('is not a live region unless asked', async () => {
    expect(el('custom').hasAttribute('role')).toBe(false);
    fixture.componentInstance.live.set('polite');
    await render();
    expect(el('custom').getAttribute('role')).toBe('status');
    fixture.componentInstance.live.set('assertive');
    await render();
    expect(el('custom').getAttribute('role')).toBe('alert');
  });

  it('emits dismissed from the close button, labelled by the dismiss label', async () => {
    const close = el('custom').querySelector<HTMLButtonElement>('.ui-alert__close')!;
    expect(close.getAttribute('aria-label')).toBe('Dismiss');
    close.click();
    expect(fixture.componentInstance.dismissals()).toBe(1);
    fixture.componentInstance.dismissible.set(false);
    await render();
    expect(el('custom').querySelector('.ui-alert__close')).toBeNull();
  });
});

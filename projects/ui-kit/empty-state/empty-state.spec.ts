import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiIcon, provideUiIcons, uiIconFile } from '@vplans/ui-kit/icon';
import { UiEmptyState } from './empty-state';

@Component({
  imports: [UiEmptyState, UiIcon],
  template: `
    <ui-empty-state id="full" title="No plans yet" headingLevel="2" [size]="size()">
      <ui-icon icon="file" />
      Plans you create show up here.
      <button uiEmptyStateActions type="button">Create a plan</button>
    </ui-empty-state>
    <ui-empty-state id="bare">
      <img uiEmptyStateMedia src="data:," alt="" />
    </ui-empty-state>
  `,
})
class Host {
  readonly size = signal<'sm' | 'md'>('md');
}

describe('UiEmptyState', () => {
  let fixture: ComponentFixture<Host>;
  const el = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)!;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideUiIcons([uiIconFile])] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('projects the icon, description and actions into their slots', () => {
    const state = el('full');
    expect(state.querySelector('.ui-empty-state__icon ui-icon')).not.toBeNull();
    expect(state.querySelector('.ui-empty-state__description')?.textContent?.trim()).toBe(
      'Plans you create show up here.',
    );
    expect(state.querySelector('.ui-empty-state__actions button')?.textContent).toBe(
      'Create a plan',
    );
  });

  it('renders the title as a heading of the given level', () => {
    const title = el('full').querySelector('.ui-empty-state__title')!;
    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('2');
    expect(title.textContent?.trim()).toBe('No plans yet');
    expect(el('full').hasAttribute('title')).toBe(false);
  });

  it('puts an illustration in the media slot and leaves out an empty title', () => {
    const state = el('bare');
    expect(state.querySelector('.ui-empty-state__media img')).not.toBeNull();
    expect(state.querySelector('.ui-empty-state__icon')?.children.length).toBe(0);
    expect(state.querySelector('.ui-empty-state__title')).toBeNull();
  });

  it('follows the size', async () => {
    expect(el('full').classList).toContain('ui-empty-state--md');
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el('full').classList).toContain('ui-empty-state--sm');
  });
});

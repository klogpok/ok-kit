import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
  UiCardSubtitle,
  UiCardTitle,
} from './card';

@Component({
  imports: [UiCard, UiCardHeader, UiCardTitle, UiCardSubtitle, UiCardContent, UiCardFooter],
  template: `
    <ui-card id="card" [appearance]="appearance()" [padding]="padding()">
      <ui-card-header>
        <h3 ui-card-title>Project Alpha</h3>
        <p ui-card-subtitle>Updated today</p>
        <span uiCardHeaderAside id="aside">Active</span>
      </ui-card-header>
      <ui-card-content>Body</ui-card-content>
      <ui-card-footer align="start"><button type="button">Open</button></ui-card-footer>
    </ui-card>
  `,
})
class Host {
  readonly appearance = signal<'outlined' | 'elevated'>('outlined');
  readonly padding = signal<'none' | 'sm' | 'md' | 'lg'>('md');
}

describe('UiCard', () => {
  let fixture: ComponentFixture<Host>;
  let root: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    root = fixture.nativeElement as HTMLElement;
  });

  it('renders the parts with their classes', () => {
    expect(root.querySelector('h3')!.classList).toContain('ui-card-title');
    expect(root.querySelector('p')!.classList).toContain('ui-card-subtitle');
    expect(root.querySelector('ui-card-content')!.textContent).toBe('Body');
    expect(root.querySelector('ui-card-footer')!.classList).toContain('ui-card-footer--start');
  });

  it('keeps the title in a text column and the aside after it', () => {
    const header = root.querySelector('ui-card-header')!;
    const text = header.querySelector('.ui-card-header__text')!;
    expect(text.querySelector('h3')).not.toBeNull();
    expect(text.querySelector('#aside')).toBeNull();
    expect(header.lastElementChild!.id).toBe('aside');
  });

  it('applies appearance and padding', () => {
    const card = root.querySelector('#card')!;
    expect(card.classList).toContain('ui-card--outlined');
    expect(card.classList).toContain('ui-card--padding-md');

    fixture.componentInstance.appearance.set('elevated');
    fixture.componentInstance.padding.set('none');
    fixture.detectChanges();
    expect(card.classList).toContain('ui-card--elevated');
    expect(card.classList).toContain('ui-card--padding-none');
    expect(card.classList).not.toContain('ui-card--outlined');
  });
});

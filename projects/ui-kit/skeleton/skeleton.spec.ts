import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiSkeleton, UiSkeletonShape } from './skeleton';

@Component({
  imports: [UiSkeleton],
  template: `
    <ui-skeleton id="default" />
    <ui-skeleton id="lines" [lines]="lines()" width="12rem" />
    <ui-skeleton id="custom" [shape]="shape()" width="4rem" height="3rem" lines="3" />
    <ui-skeleton id="avatar" shape="circle" height="2rem" />
  `,
})
class Host {
  readonly lines = signal(3);
  readonly shape = signal<UiSkeletonShape>('rect');
}

describe('UiSkeleton', () => {
  let fixture: ComponentFixture<Host>;
  const el = (id: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`#${id}`)!;
  const bones = (id: string) => el(id).querySelectorAll('.ui-skeleton__bone').length;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders one text line by default', () => {
    expect(el('default').classList).toContain('ui-skeleton--text');
    expect(bones('default')).toBe(1);
    expect(el('default').style.inlineSize).toBe('');
  });

  it('renders one bone per line and follows the lines input', () => {
    expect(bones('lines')).toBe(3);
    expect(el('lines').style.inlineSize).toBe('12rem');
    fixture.componentInstance.lines.set(5);
    fixture.detectChanges();
    expect(bones('lines')).toBe(5);
    fixture.componentInstance.lines.set(0);
    fixture.detectChanges();
    expect(bones('lines')).toBe(1);
  });

  it('draws a single block for rect and circle, ignoring lines', () => {
    expect(el('custom').classList).toContain('ui-skeleton--rect');
    expect(bones('custom')).toBe(1);
    expect(el('custom').style.inlineSize).toBe('4rem');
    expect(el('custom').style.blockSize).toBe('3rem');
    fixture.componentInstance.shape.set('circle');
    fixture.detectChanges();
    expect(el('custom').classList).toContain('ui-skeleton--circle');
    expect(el('custom').style.getPropertyValue('--_circle-size')).toBe('4rem');
  });

  it('sizes a circle from height when width is not set', () => {
    expect(el('avatar').style.getPropertyValue('--_circle-size')).toBe('2rem');
    expect(el('avatar').style.blockSize).toBe('');
  });

  it('is always hidden from assistive technologies', () => {
    for (const id of ['default', 'lines', 'custom', 'avatar']) {
      expect(el(id).getAttribute('aria-hidden')).toBe('true');
      expect(el(id).hasAttribute('role')).toBe(false);
    }
  });
});

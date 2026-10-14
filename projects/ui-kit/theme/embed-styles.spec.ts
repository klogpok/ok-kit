import { Component, ViewEncapsulation, reflectComponentType } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiEmbedStyles } from './embed-styles';

@Component({
  imports: [UiEmbedStyles],
  template: `<p>Host content</p>
    <ui-embed-styles />`,
})
class Host {}

describe('UiEmbedStyles', () => {
  it('renders a hidden element without content', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element = (fixture.nativeElement as HTMLElement).querySelector('ui-embed-styles');
    expect(element).not.toBeNull();
    expect(element?.hidden).toBe(true);
    expect(element?.childNodes.length).toBe(0);
  });

  it('is not encapsulated, so its stylesheet reaches :root and the overlays', () => {
    const def = (UiEmbedStyles as unknown as { ɵcmp: { encapsulation: ViewEncapsulation } }).ɵcmp;
    expect(def.encapsulation).toBe(ViewEncapsulation.None);
    expect(reflectComponentType(UiEmbedStyles)?.selector).toBe('ui-embed-styles');
  });
});

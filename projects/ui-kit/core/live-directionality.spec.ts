import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Directionality } from '@angular/cdk/bidi';
import { provideUiLiveDirectionality } from './live-directionality';

@Component({
  selector: 'ui-test-dir',
  template: '',
  providers: [provideUiLiveDirectionality()],
})
class DirProbe {
  readonly dir = inject(Directionality);
}

@Component({
  imports: [DirProbe],
  template: '<div id="box"><ui-test-dir /></div>',
})
class Host {}

describe('UiLiveDirectionality', () => {
  it('follows the closest dir attribute at read time', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const probe = fixture.debugElement.query((d) => d.name === 'ui-test-dir')
      .componentInstance as DirProbe;
    const box = (fixture.nativeElement as HTMLElement).querySelector('#box')!;

    expect(probe.dir.value).toBe('ltr');
    box.setAttribute('dir', 'rtl');
    expect(probe.dir.value).toBe('rtl');
    box.setAttribute('dir', 'LTR');
    expect(probe.dir.value).toBe('ltr');
  });
});

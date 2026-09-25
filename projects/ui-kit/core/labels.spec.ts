import { TestBed } from '@angular/core/testing';
import { UI_DEFAULT_LABELS, UI_LABELS, provideUiLabels } from './labels';

describe('UI_LABELS', () => {
  it('defaults to English', () => {
    expect(TestBed.inject(UI_LABELS)).toEqual(UI_DEFAULT_LABELS);
  });

  it('merges overrides with the defaults', () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels({ close: 'סגירה' })] });
    expect(TestBed.inject(UI_LABELS)).toEqual({ ...UI_DEFAULT_LABELS, close: 'סגירה' });
  });
});

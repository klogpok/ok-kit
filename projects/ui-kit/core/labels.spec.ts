import { InjectionToken, Signal, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UI_LABELS, UI_LABELS_EN, UI_LABELS_HE, UiLabels, provideUiLabels } from './labels';

describe('UI_LABELS', () => {
  it('defaults to Hebrew', () => {
    expect(TestBed.inject(UI_LABELS)()).toEqual(UI_LABELS_HE);
  });

  it('merges fixed overrides with the defaults', () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels({ close: 'Dismiss' })] });
    expect(TestBed.inject(UI_LABELS)()).toEqual({ ...UI_LABELS_HE, close: 'Dismiss' });
  });

  it('switches to English with UI_LABELS_EN', () => {
    TestBed.configureTestingModule({ providers: [provideUiLabels(UI_LABELS_EN)] });
    expect(TestBed.inject(UI_LABELS)()).toEqual(UI_LABELS_EN);
  });

  it('follows a signal, e.g. a runtime language switch', () => {
    const texts = signal<Partial<UiLabels>>({ close: 'Close' });
    TestBed.configureTestingModule({ providers: [provideUiLabels(texts)] });
    const labels = TestBed.inject(UI_LABELS);
    expect(labels().close).toBe('Close');
    texts.set({ close: 'Fermer' });
    expect(labels().close).toBe('Fermer');
  });

  it('runs a factory in an injection context', () => {
    const TRANSLATIONS = new InjectionToken<Signal<Partial<UiLabels>>>('translations');
    TestBed.configureTestingModule({
      providers: [
        { provide: TRANSLATIONS, useValue: signal({ cancel: 'Abbrechen' }) },
        provideUiLabels(() => inject(TRANSLATIONS)),
      ],
    });
    expect(TestBed.inject(UI_LABELS)().cancel).toBe('Abbrechen');
  });
});

describe('UI_LABELS_HE', () => {
  it('isolates the numeric page range so RTL keeps its order', () => {
    expect(UI_LABELS_HE.pageRange(51, 75, 480)).toBe('⁦51–75⁩ מתוך 480');
    expect(UI_LABELS_EN.pageRange(51, 75, 480)).toBe('51–75 of 480');
  });
});

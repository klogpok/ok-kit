import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { ThemeService, provideUiTheme } from './theme.service';

describe('ThemeService', () => {
  let root: HTMLElement;

  function create(options?: Parameters<typeof provideUiTheme>[0]): ThemeService {
    TestBed.configureTestingModule({ providers: options ? [provideUiTheme(options)] : [] });
    root = TestBed.inject(DOCUMENT).documentElement;
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system mode without a data-theme attribute', () => {
    const service = create();
    expect(service.mode()).toBe('system');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  it('stores nothing until the mode is chosen, so a new default applies', () => {
    create({ defaultMode: 'light' });
    expect(localStorage.getItem('ui-theme')).toBeNull();
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('applies and persists an explicit mode', () => {
    const service = create();
    service.setMode('dark');
    TestBed.tick();
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('ui-theme')).toBe('dark');
  });

  it('restores the persisted mode', () => {
    localStorage.setItem('ui-theme', 'dark');
    const service = create();
    expect(service.mode()).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('applies the persisted mode on startup without injecting the service', () => {
    localStorage.setItem('ui-theme', 'dark');
    TestBed.configureTestingModule({ providers: [provideUiTheme({})] });
    TestBed.inject(DOCUMENT);
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('ignores invalid persisted values', () => {
    localStorage.setItem('ui-theme', 'purple');
    expect(create().mode()).toBe('system');
  });

  it('toggles between light and dark', () => {
    const service = create({ defaultMode: 'light' });
    service.toggle();
    expect(service.mode()).toBe('dark');
    service.toggle();
    expect(service.mode()).toBe('light');
  });

  it('does not persist when storageKey is null', () => {
    const service = create({ storageKey: null });
    service.setMode('light');
    TestBed.tick();
    expect(localStorage.length).toBe(0);
  });

  it('reads and writes a custom storage key', () => {
    localStorage.setItem('app-theme', 'dark');
    const service = create({ storageKey: 'app-theme' });
    expect(service.mode()).toBe('dark');
    service.setMode('light');
    expect(localStorage.getItem('app-theme')).toBe('light');
    expect(localStorage.getItem('ui-theme')).toBeNull();
  });

  it('follows a mode changed in another tab', () => {
    const service = create();
    window.dispatchEvent(new StorageEvent('storage', { key: 'ui-theme', newValue: 'dark' }));
    TestBed.tick();
    expect(service.mode()).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    window.dispatchEvent(new StorageEvent('storage', { key: 'ui-theme', newValue: null }));
    expect(service.mode()).toBe('system');
  });

  it('follows prefers-color-scheme in system mode and stops listening on destroy', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const media = {
      matches: false,
      addEventListener: vi.fn((_: string, fn: typeof listener) => (listener = fn)),
      removeEventListener: vi.fn(),
    };
    const original = window.matchMedia;
    window.matchMedia = () => media as unknown as MediaQueryList;
    try {
      const service = create();
      expect(service.theme()).toBe('light');
      listener!({ matches: true } as MediaQueryListEvent);
      expect(service.theme()).toBe('dark');
      TestBed.resetTestingModule();
      expect(media.removeEventListener).toHaveBeenCalledWith('change', listener);
    } finally {
      window.matchMedia = original;
    }
  });
});

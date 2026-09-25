import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  computed,
  effect,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';

/** `system` follows `prefers-color-scheme`. */
export type UiThemeMode = 'light' | 'dark' | 'system';
export type UiResolvedTheme = 'light' | 'dark';

export interface UiThemeOptions {
  /** Mode used when nothing is persisted. Default: `system`. */
  defaultMode?: UiThemeMode;
  /** localStorage key; `null` disables persistence. Default: `ui-theme`. */
  storageKey?: string | null;
}

export const UI_THEME_OPTIONS = new InjectionToken<UiThemeOptions>('UiThemeOptions', {
  factory: () => ({}),
});

/**
 * Configures the ThemeService and applies the stored mode on startup, so the theme is right even
 * when nothing injects the service until later (e.g. only a settings page does). Without it the
 * service still works with defaults, but applies the mode only once it is first injected.
 */
export function provideUiTheme(options: UiThemeOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: UI_THEME_OPTIONS, useValue: options },
    provideEnvironmentInitializer(() => inject(ThemeService)),
  ]);
}

const MODES: readonly UiThemeMode[] = ['light', 'dark', 'system'];
const isMode = (value: unknown): value is UiThemeMode => MODES.includes(value as UiThemeMode);

/**
 * Switches between light/dark themes by setting `data-theme` on `<html>`.
 * In `system` mode the attribute is removed so the CSS `prefers-color-scheme` fallback applies.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly options = inject(UI_THEME_OPTIONS);
  private readonly storageKey =
    this.options.storageKey === undefined ? 'ui-theme' : this.options.storageKey;
  // No window on the server; jsdom has no matchMedia.
  private readonly media = this.mediaQuery('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.media?.matches ?? false);
  private readonly modeState = signal<UiThemeMode>(
    this.readStored() ?? this.options.defaultMode ?? 'system',
  );

  /** Selected mode, including `system`. */
  readonly mode = this.modeState.asReadonly();
  /** The theme actually rendered. */
  readonly theme = computed<UiResolvedTheme>(() => {
    const mode = this.modeState();
    if (mode === 'system') return this.systemDark() ? 'dark' : 'light';
    return mode;
  });

  constructor() {
    if (this.media) {
      const listener = (event: MediaQueryListEvent): void => this.systemDark.set(event.matches);
      this.media.addEventListener('change', listener);
      inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', listener));
    }

    // Another tab of the app changed the mode.
    const view = this.document.defaultView;
    if (view && this.storageKey) {
      const onStorage = (event: StorageEvent): void => {
        if (event.key !== this.storageKey) return;
        this.modeState.set(
          isMode(event.newValue) ? event.newValue : (this.options.defaultMode ?? 'system'),
        );
      };
      view.addEventListener('storage', onStorage);
      inject(DestroyRef).onDestroy(() => view.removeEventListener('storage', onStorage));
    }

    effect(() => {
      const mode = this.modeState();
      const root = this.document.documentElement;
      if (mode === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', mode);
    });
  }

  /** Sets and stores the mode. Until then nothing is stored, so a new `defaultMode` applies. */
  setMode(mode: UiThemeMode): void {
    this.modeState.set(mode);
    this.writeStored(mode);
  }

  /** Toggles between light and dark, leaving `system` mode. */
  toggle(): void {
    this.setMode(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private mediaQuery(query: string): MediaQueryList | undefined {
    const view = this.document.defaultView;
    return typeof view?.matchMedia === 'function' ? view.matchMedia(query) : undefined;
  }

  private readStored(): UiThemeMode | null {
    if (!this.storageKey) return null;
    try {
      const value = this.document.defaultView?.localStorage.getItem(this.storageKey);
      return isMode(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeStored(mode: UiThemeMode): void {
    if (!this.storageKey) return;
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, mode);
    } catch {
      // Storage unavailable (private mode, SSR): theme still applies for this session.
    }
  }
}

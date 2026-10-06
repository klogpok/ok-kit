import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { UI_ICONS_ALL, provideUiIcons } from '@vplans/ui-kit/icon';
import { provideUiTheme } from '@vplans/ui-kit/theme';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideUiIcons(UI_ICONS_ALL),
    provideUiTheme({ storageKey: 'playground-theme' }),
  ],
};

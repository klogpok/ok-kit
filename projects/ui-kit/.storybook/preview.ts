import { applicationConfig, type Decorator, type Preview } from '@storybook/angular-vite';
import { UI_ICONS_ALL, provideUiIcons } from '@vplans/ui-kit/icon';

/** Applies the toolbar theme and direction to <html>, exactly like an application would. */
const withThemeAndDirection: Decorator = (story, context) => {
  const root = document.documentElement;
  const theme = context.globals['theme'] as string;
  const dir = context.globals['dir'] as string;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  root.setAttribute('dir', dir);
  root.setAttribute('lang', dir === 'rtl' ? 'he' : 'en');
  return story();
};

const preview: Preview = {
  decorators: [
    applicationConfig({ providers: [provideUiIcons(UI_ICONS_ALL)] }),
    withThemeAndDirection,
  ],
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'browser' },
        ],
        dynamicTitle: true,
      },
    },
    dir: {
      description: 'Text direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'LTR' },
          { value: 'rtl', title: 'RTL (Hebrew)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', dir: 'ltr' },
  parameters: {
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default preview;

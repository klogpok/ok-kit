import { applicationConfig, type Decorator, type Preview } from '@storybook/angular';
import { UI_ICONS_ALL, provideUiIcons } from '@vplans/ui-kit/icon';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';

/** Applies the toolbar theme, direction and density to <html>, exactly like an application would. */
function applyGlobals(globals: Record<string, unknown>): void {
  const root = document.documentElement;
  const theme = globals['theme'] as string;
  const dir = globals['dir'] as string;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  root.setAttribute('dir', dir);
  root.setAttribute('lang', dir === 'rtl' ? 'he' : 'en');
  if (globals['density'] === 'compact') root.setAttribute('data-density', 'compact');
  else root.removeAttribute('data-density');
}

const withThemeAndDirection: Decorator = (story, context) => {
  applyGlobals(context.globals);
  return story();
};

// Docs pages without a story never run the decorator; the toolbar reaches them as channel events.
const channel = addons.getChannel();
const onGlobals = ({ globals }: { globals: Record<string, unknown> }): void => {
  applyGlobals(globals);
};
channel.on(SET_GLOBALS, onGlobals);
channel.on(GLOBALS_UPDATED, onGlobals);

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
    density: {
      description: 'Control density (data-density on the root element)',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'compact', title: 'Compact' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', dir: 'ltr', density: 'default' },
  parameters: {
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    layout: 'padded',
    options: {
      storySort: {
        order: [
          'Docs',
          ['Getting started', 'Theming', 'RTL', 'Forms', 'Tokens', 'Contributing'],
          'Foundations',
          ['Tokens', 'Density', 'Layout', 'Icon'],
          'Actions',
          'Forms',
          'Layout',
          'Navigation',
          'Overlays',
          'Feedback',
          'Data display',
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;

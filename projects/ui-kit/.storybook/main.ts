import type { StorybookConfig } from '@storybook/angular';

/** The entry that webpack's hot module replacement client is pulled in through. */
const isHotReloadEntry = (entry: unknown) =>
  typeof entry === 'string' && entry.includes('webpack-hot-middleware');

/**
 * The story files import the framework under the name of the Vite package the workbench used to
 * run on; `framework.d.ts` maps the same name for TypeScript.
 */
const FRAMEWORK_ALIAS = { '@storybook/angular-vite$': '@storybook/angular' };

const config: StorybookConfig = {
  stories: ['../**/*.mdx', '../**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/angular', options: {} },
  webpackFinal: (webpackConfig) => {
    const alias = webpackConfig.resolve?.alias;
    return {
      ...webpackConfig,
      // Hot module replacement is off: under the Angular webpack configuration the hot middleware
      // and the compilation that serves the preview report different hashes, so the preview asks
      // for an update that does not exist, reloads, and never renders a story. Without it the dev
      // server still rebuilds on change and the page is reloaded by hand.
      entry: Array.isArray(webpackConfig.entry)
        ? webpackConfig.entry.filter((entry) => !isHotReloadEntry(entry))
        : webpackConfig.entry,
      plugins: (webpackConfig.plugins ?? []).filter(
        (plugin) => plugin?.constructor.name !== 'HotModuleReplacementPlugin',
      ),
      resolve: {
        ...webpackConfig.resolve,
        alias: Array.isArray(alias)
          ? [...alias, { name: '@storybook/angular-vite', alias: '@storybook/angular' }]
          : { ...alias, ...FRAMEWORK_ALIAS },
      },
    };
  },
};

export default config;

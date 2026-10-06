import type { StorybookConfig } from '@storybook/angular';

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

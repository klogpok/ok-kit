import type { StorybookConfig } from '@storybook/angular-vite';
import { fileURLToPath } from 'node:url';

const libRoot = fileURLToPath(new URL('..', import.meta.url));

const config: StorybookConfig = {
  stories: ['../**/*.mdx', '../**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/angular-vite', options: {} },
  // Stories import the library by its public entry points, resolved to sources.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [
        { find: /^@vplans\/ui-kit\/(.+)$/, replacement: `${libRoot}$1/public-api.ts` },
        { find: /^@vplans\/ui-kit$/, replacement: `${libRoot}src/public-api.ts` },
      ],
    },
  }),
};

export default config;

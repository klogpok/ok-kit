// The story files import the framework under the name of the Vite package the workbench used to
// run on. The workbench now runs on the webpack package, which exports the same API; `main.ts`
// maps the name for the bundler and this declaration maps it for TypeScript.
//
// It is a `declare module` rather than a `paths` entry on purpose: the Angular webpack builder
// feeds this tsconfig to `tsconfig-paths-webpack-plugin`, which resolves earlier than the alias in
// `main.ts` and would hand webpack the type declarations instead of the implementation.
declare module '@storybook/angular-vite' {
  export * from '@storybook/angular';
}

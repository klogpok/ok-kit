---
paths:
  - "projects/**/*.stories.ts"
  - "projects/ui-kit/.storybook/**"
---

# Storybook

- Storybook runs on `@storybook/angular`, the webpack framework, because the Vite one requires Angular 21. Its builders in `angular.json` need `experimentalZoneless: true` (otherwise the builder pushes `zone.js` into the polyfills), `compodoc: false` (compodoc is not installed) and, on the dev builder only, a `browserTarget` — it throws `AngularLegacyBuildOptionsError` when that option is absent, so it points at `ui-kit:build-storybook`, whose options are the same ones.
- The story files import the framework as `@storybook/angular-vite`. The name is mapped to `@storybook/angular` for TypeScript in `.storybook/framework.d.ts` and for the bundler in `main.ts`. The TypeScript side is a `declare module` and not a `paths` entry on purpose: the builder feeds the tsconfig to `tsconfig-paths-webpack-plugin`, which resolves before the alias and would hand webpack the type declarations.
- Hot module replacement is switched off in `main.ts`. With it on, the hot middleware and the compilation that serves the preview report different compilation hashes, the preview requests an update that was never emitted, reloads, and no story ever renders. The dev server still rebuilds on change; the page has to be refreshed by hand.
- Storybook writes args onto the `component` instance when an arg name matches a field. For directives this replaced signal inputs. Use arg names that differ from the class fields (see `tooltip.stories.ts`).
  Protected and private fields count too: args `time` and `current` replaced computed signals of `ui-time-input` and `ui-stepper` ("is not a function" once the list or the steps render).
- The docs snippet ("Show code") is derived statically and shows an "Incomplete snippet" warning when a story has args that its template does not bind and that are not component inputs, when the template reads `props` that are not args, or when args are not literals (`fn()`, `new Date()`). Put args only on the stories that bind them (others spread `...Default`), keep template state in literal args, and write `parameters.docs.source.code` by hand for dates, functions and service demos.
- Storybook dev runs components in JIT, which has declaration-order traps in component files. See `.claude/rules/components.md` ("Storybook JIT").
- New or intentionally changed stories need new visual baselines (`pnpm test-visual:update`); see `.claude/rules/visual.md`.

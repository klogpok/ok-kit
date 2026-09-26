---
paths:
  - "projects/**/*.stories.ts"
  - "projects/ui-kit/.storybook/**"
---

# Storybook

- Storybook uses `@storybook/angular-vite`. `@analogjs/vite-plugin-angular` must be >= 2.7.5, older versions fail with the `initializeHash` error.
- Storybook writes args onto the `component` instance when an arg name matches a field. For directives this replaced signal inputs. Use arg names that differ from the class fields (see `tooltip.stories.ts`).
- The docs snippet ("Show code") is derived statically and shows an "Incomplete snippet" warning when a story has args that its template does not bind and that are not component inputs, when the template reads `props` that are not args, or when args are not literals (`fn()`, `new Date()`). Put args only on the stories that bind them (others spread `...Default`), keep template state in literal args, and write `parameters.docs.source.code` by hand for dates, functions and service demos.
- Storybook dev runs components in JIT, which has declaration-order traps in component files. See `.claude/rules/components.md` ("Storybook JIT").
- New or intentionally changed stories need new visual baselines (`pnpm test-visual:update`); see `.claude/rules/visual.md`.

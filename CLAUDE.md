# @vplans/ui-kit workspace

This repo holds an in-house Angular design system. The full brief is in [docs/SPEC.md](docs/SPEC.md).
Usage and contribution rules are in [projects/ui-kit/README.md](projects/ui-kit/README.md); follow them.

## Decisions (these override the brief)

- The stack is Angular 22.2 with pnpm 12. No CI. The package is not published; it is consumed inside the monorepo.
- The package is `@vplans/ui-kit` and selectors use the `ui-` prefix (`ui-button`, `button[ui-button]`).
- Form controls support **Signal Forms natively** and Reactive/template forms through CVA:
  - custom controls extend `UiFormControlBase` (`@vplans/ui-kit/core`);
  - native inputs use `injectControlState()`.
- Brand colors come from the VPlans app:
  - primary blue `#2490ed` (buttons use `#1a74c9` so text meets AA contrast);
  - cool gray text `#2b3549` and borders `#e4e7ed`;
  - success green `#008752`, olive status `#a19329`.
- The font stack is `Assistant, Roboto, "Helvetica Neue", sans-serif`.
- The app is Hebrew and RTL.
- Current sizes are accepted for now.
- Phase 2 badges and tabs must match the VPlans screenshot:
  - status pills: blue "ממתין לאישור מתאם", olive "ממתין לחתימה", gray "לא הוגדר לו"ז";
  - underlined active tab in the primary blue.

## Status

- **Phase 1 is done.** Delivered: tokens, typography, icon, spinner, button, icon-button, input, textarea, form-field with `uiPrefix`/`uiSuffix`, checkbox, radio group, switch, ThemeService, Storybook, playground.
- **Phase 2 is built and awaits approval** (2026-09-25). Delivered: divider, badge, card, tabs, tooltip, dialog (+ `confirm()`), toast, select (+ `searchable`), `provideUiLabels()`, `resolveDirection()`.
- **Next:** Phase 3 (table, pagination, date picker, menu/dropdown, accordion, skeleton), after approval.

## Workflow per phase

1. Build components one at a time, each in its own secondary entry point (see README → "Adding a component").
2. Commit each component separately (`feat(<name>): ...`). Include tests and stories.
3. Before reporting a phase, run: `pnpm tokens && pnpm lint && pnpm test && pnpm build && pnpm build-storybook`, and type-check the stories with `pnpm exec ngc -p projects/ui-kit/.storybook/tsconfig.json --noEmit`.
4. Check the stories in a real browser for light and dark themes and for RTL. `playwright-core` with `channel: 'msedge'` works without downloading browsers.
5. End the phase with a report: what was done, what is left, which decisions the user must make. Wait for approval before starting the next phase.

## Gotchas

- A template listener that returns `false` calls `preventDefault()`. Keep handlers returning void.
- `model()` has no transform. Under `strictTemplates` a bare boolean attribute on a model is a compile error. Coerce on read where needed.
- Signal Forms' `[formField]` sets the inputs `disabled`, `invalid`, `required`, `touched` and `name` on **every** directive of the host.
- If a component provides `NG_VALUE_ACCESSOR`, `[formField]` falls back to CVA interop. This is why `UiFormControlBase` assigns `ngControl.valueAccessor` manually.
- pnpm 12: dependencies that need build scripts must be listed under `allowBuilds` in `pnpm-workspace.yaml`. Do not use `pnpm dlx` for such CLIs.
- The CDK `Directionality` reads `dir` once at startup. Every overlay must resolve the direction when it opens (`resolveDirection()` + `overlayRef.setDirection()`, or `direction` for CDK Dialog), otherwise it renders LTR after a runtime switch to RTL.
- CDK overlays use the Popover API (top layer) by default, so `z-index` does not order them. Opening order does.
- In Vitest (jsdom): the CDK key managers read `keyCode`, so pass it in `KeyboardEvent`. `InteractivityChecker` sees every element as hidden (no layout), so dialog focus tests need a fake checker (see `dialog.spec.ts`).
- Storybook writes args onto the `component` instance when an arg name matches a field. For directives this replaced signal inputs. Use arg names that differ from the class fields (see `tooltip.stories.ts`).
- Storybook uses `@storybook/angular-vite`. `@analogjs/vite-plugin-angular` must be >= 2.7.5, older versions fail with the `initializeHash` error.

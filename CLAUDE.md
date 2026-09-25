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
- Phase 2 review answers (2026-09-25):
  - badges default to `solid`;
  - built-in texts default to Hebrew (`UI_LABELS_HE`). Apps may use any i18n library; `provideUiLabels()` takes values, a signal or a factory;
  - toast defaults stay: `bottom-end`, 5 s, max 3;
  - dialogs focus the first form field on open;
  - the playground bundle warning is 700 kB;
  - multi-select belongs to phase 3.

## Status

- **Phase 1 is done.** Delivered: tokens, typography, icon, spinner, button, icon-button, input, textarea, form-field with `uiPrefix`/`uiSuffix`, checkbox, radio group, switch, ThemeService, Storybook, playground.
- **Phase 2 is done and approved** (2026-09-25). Delivered: divider, badge, card, tabs + `ui-tab-nav` (router links), tooltip, dialog (+ `confirm()`), toast, select (+ `searchable`), `provideUiLabels()`, `resolveDirection()`.
- **Phase 3 is done and approved** (2026-09-25). Delivered: skeleton, accordion, menu (+ submenus), pagination, table (`table[ui-table]`, `[uiSort]`, `th[ui-sort-header]`, message/skeleton rows, `uiSortData()`), multi-select (shared `UiSelectBase`), calendar + date picker, `UiLiveDirectionality`, new labels (pagination, dates, `locale`), icons `chevrons-*` and `arrow-up`/`arrow-down`, and the "Phase 3" playground section.
- Phase 3 review answers (2026-09-25): keep all current behavior. The table loading indicator stays a pulsing line under the header; lazy accordion content is kept after closing; the date placeholder stays `DD.MM.YYYY`; invalid or out-of-range typed dates set the value to `null`.
- **Phase 4 (fixes) is done and waits for the user's review** (2026-09-25). All 34 audit items are fixed, one commit each. The audit list (34 items, P1–P3) was approved in full. Decisions: an unparsable or out-of-range date keeps the text, sets the value to `null` and reports a `uiDateParse` form error shown by `ui-form-field` (`labels().invalidDate`); component tokens are also generated on `.ui-theme-scope` so semantic tokens can be overridden locally; option labels track text changes with a `MutationObserver`. Two deviations: component-token overrides survive a nested `[data-theme]` only when written on `ui.$theme-scopes` (no automatic way without rewriting every SCSS `var()`); dark `surface-hover` still equals `surface-muted`, as in light. English sample texts in the accordion/tabs stories keep the normal bidi punctuation in RTL.

## Phase 3 design (as built)

- **Skeleton.** `ui-skeleton` with `shape` text/rect/circle, `width`/`height`, `lines`. It is always `aria-hidden`; the loading container sets `aria-busy`. No shimmer under reduced motion.
- **Accordion.** `ui-accordion` / `ui-accordion-item` with `@angular/cdk/accordion` as host directives. Follow the APG pattern: heading (`headingLevel`), button with `aria-expanded`/`aria-controls`, region panel. Name the item input `label`, not `title` (that shows a native tooltip). Offer lazy content via `ng-template uiAccordionContent`.
- **Menu.** `@angular/cdk/menu` as host directives: `[uiMenuTriggerFor]`, `ui-menu`, `button[ui-menu-item]` (`disabled`, `triggered`, `danger`), with submenus. CDK Menu reads `Directionality.value` for arrow keys and position. Add a `UiLiveDirectionality` to core: it extends `Directionality` and overrides `get value()` to return `resolveDirection(host)`. Provide it at element level on the trigger and the menu.
- **Pagination.** `ui-pagination` with `length`, `pageSize`, a `pageIndex` model, `pageSizeOptions` (uses `ui-select`), a `page` output, first/prev/next/last and page buttons with ellipsis. It is a `nav` with `aria-current="page"`, and the chevrons flip in RTL. Add new labels to `UiLabels`, including a range formatter.
- **Table.** Style native tables (no CdkTable): `table[ui-table]` with global styles scoped under `.ui-table`, `loading` (`aria-busy`), density and a sticky header. Add `[uiSort]` with a `sort` model, `th[ui-sort-header]` (a button inside, `aria-sort`), `tr[ui-table-message]` for empty/error rows, `tr[ui-table-skeleton]`, and a `uiSortData()` helper.
- **Multi-select.** `ui-multi-select` with a `readonly T[]` value model. Share the logic with `ui-select` through an abstract base. Use `aria-multiselectable`; toggling keeps the list open.
- **Date picker.** `ui-calendar` (APG grid: arrows mirrored in RTL, PageUp/Down, Home/End, min/max, `dateFilter`) plus `ui-datepicker`: text field with locale parsing through `Intl`, calendar button, overlay panel with a focus trap. The locale comes from labels (default `he-IL`); the first day of the week comes from `Intl.Locale` week info.

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
- Angular 22 components are OnPush by default, including test hosts. Use signals for host state in specs.
- A static attribute that an input consumes (`<button ui-menu-item disabled>`) still stays on the native element. Bind `'[attr.disabled]': 'null'` when the native state is wrong (menu items must stay focusable).
- Signal Forms `required()` treats only `null`, `''` and `false` as empty. An empty array needs `minLength(path, 1)`. `[formField]` also binds `min`/`max` (a `Date` for `minDate()`/`maxDate()`), so date inputs must accept `Date | null | undefined`.
- In RTL text a numeric range such as "51–75" is shown as "75–51". Wrap it in LRI/PDI (`⁦…⁩`).
- In sed and perl replacements `\u` upper-cases the next character. Write `⁦` escapes with Node or the Edit tool.
- Stylelint allows only logical `text-align` values (`start`, `end`, `center`).
- The Storybook docs snippet ("Show code") is derived statically and shows an "Incomplete snippet" warning when a story has args that its template does not bind and that are not component inputs, when the template reads `props` that are not args, or when args are not literals (`fn()`, `new Date()`). Put args only on the stories that bind them (others spread `...Default`), keep template state in literal args, and write `parameters.docs.source.code` by hand for dates, functions and service demos.
- Storybook uses `@storybook/angular-vite`. `@analogjs/vite-plugin-angular` must be >= 2.7.5, older versions fail with the `initializeHash` error.
- Signal Forms `transformedValue()` reports parse errors to `[formField]` and to Reactive Forms only in its custom-control mode. Our CVA path (`UiFormControlBase` assigns `valueAccessor`) does not get them, so the datepicker also adds a validator to `ngControl.control`.
- Vitest does not load component styles, so `getComputedStyle` tests of component CSS pass either way. Check CSS fixes in the browser.
- A `computed()` over DOM reads (`textContent`, header cells) runs once. Track DOM changes with a `MutationObserver` into a signal.
- The package is consumed through tsconfig paths, not `node_modules`. App SCSS uses `@use 'ui-kit/styles' as ui` with `stylePreprocessorOptions.includePaths: ["projects"]`.
- Internal cross-component calls (option → select, radio → group, item → accordion, container → toast) go through a non-exported `@Injectable()` provided by the parent, so they stay out of the public class API.

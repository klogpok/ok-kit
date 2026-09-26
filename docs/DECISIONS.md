# Phase history and review decisions

What each phase delivered and what the user decided in its review. Check this file before you change
an existing default or behavior: most of them were chosen on purpose. The plan for the next phases is
in [ROADMAP.md](ROADMAP.md); the full list of changes is in
[projects/ui-kit/CHANGELOG.md](../projects/ui-kit/CHANGELOG.md).

## Phase 1: foundations (done)

Delivered: tokens, typography, icon, spinner, button, icon-button, input, textarea, form-field with
`uiPrefix`/`uiSuffix`, checkbox, radio group, switch, ThemeService, Storybook, playground.

## Phase 2: core components (approved 2026-09-25)

Delivered: divider, badge, card, tabs + `ui-tab-nav` (router links), tooltip, dialog (+ `confirm()`),
toast, select (+ `searchable`), `provideUiLabels()`, `resolveDirection()`.

Badges and tabs match the VPlans screenshot:

- status pills: blue "ממתין לאישור מתאם", olive "ממתין לחתימה", gray "לא הוגדר לו"ז";
- underlined active tab in the primary blue.

Review answers:

- badges default to `solid`;
- built-in texts default to Hebrew (`UI_LABELS_HE`). Apps may use any i18n library;
  `provideUiLabels()` takes values, a signal or a factory;
- toast defaults stay: `bottom-end`, 5 s, max 3;
- dialogs focus the first form field on open;
- budgets: the playground bundle warning is 900 kB (raised in the phase 6 and 7 reviews) and the
  component style warning is 6 kB (raised in the phase 6 review); errors stay at 1 MB and 8 kB;
- multi-select belongs to phase 3.

## Phase 3: data and navigation (approved 2026-09-25)

Delivered: skeleton, accordion, menu (+ submenus), pagination, table (`table[ui-table]`, `[uiSort]`,
`th[ui-sort-header]`, message/skeleton rows, `uiSortData()`), multi-select (shared `UiSelectBase`),
calendar + date picker, `UiLiveDirectionality`, new labels (pagination, dates, `locale`), icons
`chevrons-*` and `arrow-up`/`arrow-down`, and the "Phase 3" playground section.

Review answers: keep all current behavior. The table loading indicator stays a pulsing line under the
header; lazy accordion content is kept after closing; the date placeholder stays `DD.MM.YYYY`; invalid
or out-of-range typed dates set the value to `null`.

### Design (as built)

- **Skeleton.** `ui-skeleton` with `shape` text/rect/circle, `width`/`height`, `lines`. It is always
  `aria-hidden`; the loading container sets `aria-busy`. No shimmer under reduced motion.
- **Accordion.** `ui-accordion` / `ui-accordion-item` with `@angular/cdk/accordion` as host
  directives. Follow the APG pattern: heading (`headingLevel`), button with
  `aria-expanded`/`aria-controls`, region panel. Name the item input `label`, not `title` (that shows
  a native tooltip). Offer lazy content via `ng-template uiAccordionContent`.
- **Menu.** `@angular/cdk/menu` as host directives: `[uiMenuTriggerFor]`, `ui-menu`,
  `button[ui-menu-item]` (`disabled`, `triggered`, `danger`), with submenus. CDK Menu reads
  `Directionality.value` for arrow keys and position. `UiLiveDirectionality` in core extends
  `Directionality` and overrides `get value()` to return `resolveDirection(host)`. It is provided at
  element level on the trigger and the menu.
- **Pagination.** `ui-pagination` with `length`, `pageSize`, a `pageIndex` model, `pageSizeOptions`
  (uses `ui-select`), a `page` output, first/prev/next/last and page buttons with ellipsis. It is a
  `nav` with `aria-current="page"`, and the chevrons flip in RTL. Its texts are `UiLabels`, including
  a range formatter.
- **Table.** Native tables are styled (no CdkTable): `table[ui-table]` with global styles scoped
  under `.ui-table`, `loading` (`aria-busy`), density and a sticky header. `[uiSort]` has a `sort`
  model, `th[ui-sort-header]` (a button inside, `aria-sort`), `tr[ui-table-message]` for empty/error
  rows, `tr[ui-table-skeleton]`, and a `uiSortData()` helper.
- **Multi-select.** `ui-multi-select` with a `readonly T[]` value model. It shares the logic with
  `ui-select` through an abstract base. Uses `aria-multiselectable`; toggling keeps the list open.
- **Date picker.** `ui-calendar` (APG grid: arrows mirrored in RTL, PageUp/Down, Home/End, min/max,
  `dateFilter`) plus `ui-datepicker`: text field with locale parsing through `Intl`, calendar button,
  overlay panel with a focus trap. The locale comes from labels (default `he-IL`); the first day of
  the week comes from `Intl.Locale` week info.

## Phase 4: fixes of the first audit (done 2026-09-25)

All 34 audit items (P1–P3) are fixed, one commit each. The list was approved in full.

Decisions:

- an unparsable or out-of-range date keeps the text, sets the value to `null` and reports a
  `uiDateParse` form error shown by `ui-form-field` (`labels().invalidDate`);
- component tokens are also generated on `.ui-theme-scope`, so semantic tokens can be overridden
  locally;
- option labels track text changes with a `MutationObserver`.

Deviations:

- component-token overrides survive a nested `[data-theme]` only when written on `ui.$theme-scopes`
  (no automatic way without rewriting every SCSS `var()`);
- English sample texts in the accordion/tabs stories keep the normal bidi punctuation in RTL.

## Phase 5: second audit (done 2026-09-25)

Plan: 3 P1, ~22 P2, ~70 P3; see the CHANGELOG. The user chose `compareWith(option, selected)`
everywhere (breaking).

Deliberately skipped: a shared overlay helper in core, `hidden="until-found"` in the accordion (breaks
the close animation), hiding `UiOption` internals. Link items and position presets in `ui-menu` moved
to phase 6.

Review answers:

- unused tokens removed (`text-subtle`, `z-*` except `z-sticky`, unused `info-*`,
  `primary-subtle-hover`);
- `writeValue` keeps emitting the model output (documented);
- ESLint uses the full `strictTypeChecked` + `stylisticTypeChecked`;
- roadmap order: 6.0 → 6 → 7 → 8 → 9 (the user then asked for phase 6 before 6.0).

## Phase 6: everyday blocks (approved 2026-09-26)

Delivered: `ui-alert`, `ui-empty-state`, `ui-progress-bar`, `ui-avatar` + `ui-avatar-group`,
`nav[ui-breadcrumbs]`, `[uiPopoverTriggerFor]`, `UiDialog.openDrawer()`, badge
`info`/`lg`/`dot`/`count`, select `clearable`/`loading`/option slots, calendar month and year views +
datepicker Today/Clear, menu link items, groups, checkbox/radio items and position presets, and the
"Phase 6" playground section.

Review answers: all deviations listed in the roadmap are accepted (`dismiss` and `moreCount` labels,
8 avatar accents, screen-reader-only text of dot/count badges, breadcrumb menu items as buttons,
popover closes on Tab out, drawer size from `provideUiDialog()`, 24 years per year-view page); the
budget warnings are raised instead of slimming the bundle.

## Phase 6.0: visual regression and harnesses (approved 2026-09-26)

Delivered: visual regression (`pnpm test-visual` / `pnpm test-visual:update`,
`scripts/check-visual.mjs`, shared `scripts/storybook-pages.mjs`, baselines in `visual/`) and the
`@vplans/ui-kit/testing` entry point with `UiHarness`, `UiButtonHarness`, `UiInputHarness`,
`UiCheckboxHarness`, `UiSelectHarness` + `UiOptionHarness`, `UiDialogHarness`. New components need a
harness (README → "Adding a component"); harnesses for the other existing components are roadmap
phase 9.

Review answers: keep the baselines in git, the 0.1% threshold and the 1024×768 viewport; one
`UiDialogHarness` for dialogs and drawers; `UiButtonHarness` also finds icon buttons.

## Phase 7: data entry and table features (approved 2026-09-26)

Delivered: table row selection (`[(uiTableSelection)]`, `th[ui-table-select-all]`,
`td[ui-table-select-row]`, Shift ranges), expandable rows (`tr[uiExpandableRow]`, `td[ui-row-toggle]`,
`tr[ui-row-detail]`), `ui-table-container` + `th/td[uiSticky]`, sort announcements;
`ui-number-input` (`number-input`), `ui-chip` / `button[ui-filter-chip]` / `ui-chip-set` /
`ui-chip-input` (`chip`), `ui-autocomplete` (`autocomplete`), `ui-file-upload` (`file-upload`);
multi-select `chips`, `selectAll`, `maxSelections`; the shared option panel `ɵUiOptionPanel` in
`select`; harnesses for every new control; the "Phase 7" playground section; 630 baselines.

Review answers: all deviations in the roadmap are accepted (element `ui-number-input` that clamps on
blur, array selection model with `th[ui-table-select-all]`/`td[ui-table-select-row]`, invalid files
kept in the list, `addOnBlur` and Backspace in `ui-chip-input`, pick-only autocomplete clears unpicked
text); the bundle warning is raised to 900 kB.

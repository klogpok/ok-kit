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
  component style warning is 7 kB (raised in the phase 6 and 8.6 reviews); errors stay at 1 MB and 8 kB;
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

## Phase 8.4: slider (approved 2026-09-26)

Only 8.4 of phase 8 was built, at the user's request; 8.1–8.3 and 8.5–8.7 are not started.

Delivered: `ui-slider` and `ui-range-slider` (`slider`) on transparent native range inputs, with
track clicks and drags, arrow keys that follow the visual direction in RTL, `step`, ticks and
labelled `marks`, `valueText`, `valueCommit`, `limits` on the range slider; `UiSliderHarness`; the
`rangeStart` / `rangeEnd` labels; `--ui-slider-*` tokens; the "Phase 8" playground section; 660
baselines.

Review answers: all deviations in the roadmap are accepted (two components instead of a `range`
flag, `limits` for the range slider with Signal Forms, `null` shown at `min` / as the whole scale,
off-grid values shown snapped but not rewritten, `max` off the step grid not reachable, overlapping
range thumbs picked by the drag direction). No vertical orientation, value tooltip or minimum
distance between thumbs for now.

## Phase 8.1–8.3: date range picker, time input, stepper (approved 2026-09-26)

Delivered: `ui-date-range-picker` (`datepicker`) with presets and a two-month calendar dialog;
`ui-calendar` `range` / `[(selectedRange)]` / `months`; `ui-time-input` (`time`) with a typing mask
and a list of times, `uiDateWithTime()` / `uiTimeOf()`; `ui-stepper` + `ui-step` (`stepper`) with
linear mode and form validity; `UiDateRangePickerHarness`, `UiTimeInputHarness`,
`UiStepperHarness` / `UiStepHarness`; calendar range and stepper tokens; an inspection request
wizard in the "Phase 8" playground section; 729 baselines.

Review answers: all deviations in the roadmap are accepted:

- the range value is `{ start, end } | null`, and a range with one open end is valid;
- the limits are `minDate`/`maxDate` and `minTime`/`maxTime` (NG8022);
- presets are an input list whose ranges may be functions;
- an end before the start reports `uiDateRangeOrder` in the field typed last;
- the time format follows the locale's hour cycle, and hours without AM/PM are read as 24-hour;
- the time input has no toggle button, and the typed text does not filter the list;
- date and time are joined with helpers, not a combined component;
- the stepper is our own component, not CDK Stepper; going back is always allowed, and
  `reset()` does not reset the forms.

The playground bundle went over 900 kB. Instead of raising the budget, the phase sections are
loaded lazily with `@defer (on viewport)`.

## Phase 8.5: segmented control and button toggles (approved 2026-09-26)

Delivered: `ui-segmented` + `ui-segment` and `ui-button-toggle-group` +
`button[ui-button-toggle]` (`segmented`), `--ui-segmented-*` tokens, `UiSegmentedHarness` /
`UiSegmentHarness` and `UiButtonToggleGroupHarness` / `UiButtonToggleHarness`, deal and feature
filters in the "Phase 8" playground section; 789 baselines.

Review answers: all deviations in the roadmap are accepted:

- two components in one entry point: `ui-segmented` picks one value (`T | null`),
  `ui-button-toggle-group` picks several (`readonly T[]`); no single mode for the toggle group
  and no standalone toggle button;
- `ui-segmented` uses native radios, but the component handles the arrow keys, so ←/→ follow the
  visual direction in RTL in every browser; an arrow selects at once;
- the selected segment is solid primary; a pressed toggle is `primary-subtle` with a check mark
  (the button grows by the mark);
- the toggle value keeps the press order, like `ui-multi-select`;
- a readonly toggle group sets `aria-disabled` on its focusable buttons, and a required one is a
  validator only (`aria-readonly` and `aria-required` are not allowed on `group`).

Added after the review: `orientation="vertical"` for both controls and Home/End in
`ui-segmented`.

## Angular 20 migration: parse messages and `ui-form-field` (decided 2026-10-05)

Tickets 02–06 move the "cannot read the typed text" messages of `ui-number-input`,
`ui-time-input`, `ui-datepicker`, `ui-date-range-picker` and `ui-file-upload` off Signal Forms:
the field writes `null` to the bound control and returns the message from `ownErrors()`, which
the base class merges into `errorMessages()`. The control itself therefore never fails.

Review answer: **keep the current `ui-form-field` behaviour.** `ui-form-field` drops the
control's own `errorMessages()` as soon as a `<ui-error>` is projected, so a consumer who
projects one does not see `invalidDate`, `invalidDateRange` or the other parse messages. The user
was asked whether the two should be merged and chose to leave it as is. Do not add a merge of own
and projected messages without asking again.

## Angular 20 migration: Signal Forms is reversed (decided 2026-10-06)

**The decision of phase 2 — "form controls support Signal Forms natively" — is reversed.** It is
not edited out of this log: it was the right call for a library on Angular 22, and the record of
why it was taken stays where it is. From this entry on it no longer holds.

Reason: the single application that consumes the kit runs on Angular 20 and will not be upgraded;
the decision is organisational, not technical. Signal Forms does not exist in Angular 20 — it
arrived as an experimental feature in Angular 21 and became public API in 22. The application takes
the kit as copied source, so every source file has to compile under its Angular 20 compiler, and
anything importing `@angular/forms/signals` could not. Nothing of Signal Forms is kept: no entry
point, no flag, no compatibility shim and no local reimplementation.

What the forms contract is now:

- `ControlValueAccessor` is the only forms contract. Controls work with `formControl`,
  `formControlName` and `ngModel`; rendered behaviour is unchanged.
- Every concrete custom control provides `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => X), multi: true }`
  itself, instead of the base class assigning itself to `NgControl.valueAccessor`. Angular does not
  inherit `providers` metadata into a subclass that carries its own decorator, so the provider is
  repeated on each of the sixteen controls; `UiFormControlBase` stays the only implementation of
  the accessor methods.
- A control that provides the token cannot inject `NgControl` while it is being constructed
  (NG0200). `injectControlState()` therefore takes an `Injector` and resolves `NgControl` on the
  first `sync()`, and `UiControlState.bound` is a `Signal<boolean>` rather than a plain boolean.
  That is the only change to the interface.
- The text-parsing controls (`ui-number-input`, `ui-time-input`, `ui-datepicker`,
  `ui-date-range-picker`, `ui-file-upload`) keep their "cannot read the typed text" messages in
  `ownErrors()`, which the base class merges into `errorMessages()`. A parse error never reaches
  the consumer's form control and never makes the form invalid by itself.
- `ui-stepper`'s step `control` is an `AbstractControl` only; the signal-field branch is gone.
- Where Signal Forms needed `minLength(path, 1)` for a non-empty list, use a validator — the
  playground's `uiAtLeastOne` is the example.

Do not re-add Signal Forms, in any shape, without reading this entry first.

## Angular 20 migration: the toolchain (recorded 2026-10-06)

- Angular and the Angular CLI/build packages are on `^20.3.0`, `@angular/cdk` on `^20.2.0` — the
  CDK's v20 line stops at 20.2.14, there is no 20.3 release of it. TypeScript is `~5.8.3`, Vitest
  `^3.2.0`, Vite `^7.1.11`, `ng-packagr` `^20.3.0`.
- Angular 20 is zone-based by default, so each project hands the TestBed a `providersFile` with
  `provideZonelessChangeDetection()` and the playground's `appConfig` provides it too. The library
  stays zoneless.
- Storybook stays on 10.6.0 but moved from `@storybook/angular-vite` to `@storybook/angular`, the
  webpack framework: the Vite one requires Angular 21 or newer. Zoneless survives through the
  builder's own `experimentalZoneless` option, and the visual baselines did not need re-taking —
  the webpack builder renders every story pixel-identically.
- Lint is on `angular-eslint` 20.7.0 with ESLint 9; `typescript-eslint` stayed on 8.69.0, so the
  `strictTypeChecked` rule set is unchanged. Three rules ESLint 10 had in its recommended set are
  now enabled by hand in `eslint.config.js`.

## Angular 20 migration: coverage thresholds come back through a script (decided 2026-10-07)

The Angular 20 `@angular/build:unit-test` builder has no threshold option and starts Vitest with
`config: false`, so neither `angular.json` nor a `vitest.config.ts` can set them; after the
migration `pnpm test:coverage` only reported coverage.

Review answer: **enforce them again.** The builder writes a `json-summary` report
(`codeCoverageReporters` in `angular.json`), and `scripts/check-coverage.mjs`, run at the end of
`pnpm test:coverage`, fails when a total is below its threshold.

The thresholds are the pre-migration ones (statements 94, functions 88, lines 96) except
**branches, which is 80 instead of 90**. The suite did not lose branch coverage: it is the same
729 tests. Before the migration Vitest 5's v8 coverage remapped through the AST and reported
93.2% of branches; Vitest 3.2 remaps the compiled output, counts more branches and reports
81.1% for the same code, and the builder offers no way to switch the remapping on. 80 is the new
floor for that measure. Raise it again if the toolchain moves to a Vitest that remaps through the
AST.

## Angular 20 migration: `elements-content` stays at the v20 default (decided 2026-10-07)

`@angular-eslint/template/elements-content` is slightly stricter than before the migration:
v20's default `allowList` does not include `textContent`, v22's does, so a `<button>`, `<a>` or
heading whose only content is a `[textContent]` binding is now reported. No template in the
repository is affected.

Review answer: **leave the v20 default.** If a template ever needs `[textContent]` as its only
content, add `textContent` to the rule's `allowList` in `eslint.config.js` then.

## Angular 20 migration: Storybook hot module replacement is back (decided 2026-10-07)

Ticket 17 switched hot module replacement off in `.storybook/main.ts` because the preview never
rendered with it: the hot middleware reported a compilation hash the served bundle did not have,
the client asked for a `hot-update.json` that was never emitted, and the page reloaded in a loop.

The cause was not the webpack builder. While ticket 17 was being worked, eight Storybook dev
servers were started one after another and never stopped. Every dev server writes the preview to
the same directory, `node_modules/.cache/storybook/<version>/<hash>/public`, and serves it from
there; on any source change all of them rebuilt and overwrote each other's bundles. The servers
started earlier also still resolved `@storybook/angular` to copies that the install had since
replaced, so the overwritten `main.iframe.bundle.js` waited for a vendor chunk that `iframe.html`
did not load, and the preview stayed blank without an error.

Review answer: **turn it back on.** With a single dev server, a story edit is applied in place, an
edit to a component's template or stylesheet is applied and followed by one automatic reload (the
component module does not accept updates itself), and a global stylesheet edit is applied in
place. Run one Storybook dev server at a time.

## Angular 20 migration: `core/control-state.spec.ts` stays (decided 2026-10-07)

The migration spec forbade it in so many words: "No new seam is introduced. In particular the
control-state helper is not given its own unit tests: its lazy resolution is observable through the
error, disabled and required behaviour of any control that uses it." The reason was that tests
should assert what a user of a control observes, not how the control obtained its form state —
the internals the migration was rewriting.

The file was written anyway: ticket 13 created it (a probe directive on a native input, bound and
unbound), and ticket 14 added three cases for a probe that provides `NG_VALUE_ACCESSOR` and would
have thrown NG0200 before the change — 10 `it` blocks in all.

Review answer: **keep the tests.** `injectControlState()` is exported from `@vplans/ui-kit/core`
and native inputs use it directly, so it is public API and a legitimate seam of its own, not an
internal. The tests assert the `UiControlState` signals (`bound`, required, disabled, invalid,
touched), not when or how `NgControl` was injected, and the NG0200 cases pin the migration's main
risk directly instead of through a whole control failing.

## Phase 8.6: virtual scroll (approved 2026-10-07)

Delivered: `items` / `UiOptionItem` / `virtualThreshold` on `ui-select`, `ui-multi-select` and
`ui-autocomplete` with a `cdk-virtual-scroll-viewport` from 100 items, and
`cdk-virtual-scroll-viewport[uiTableViewport]` for table rows; 801 baselines.

Review answers: the deviations in the roadmap are accepted, and the component style warning is
raised from 6 kB to 7 kB (`select.scss` is 6.07 kB; the error stays at 8 kB).

Decided in the code review of 8.6, before the phase report:

- **The options as data.** `ui-select`, `ui-multi-select` and `ui-autocomplete` take `items`
  (`UiOptionItem<T>`: `value`, `label`, `description?`, `disabled?`) instead of projected
  `ui-option`s, with `virtualThreshold` (100 by default). The new API is accepted as built.
- **Only `items` are virtualized.** Projected `ui-option`s are never put in a viewport, whatever
  their number; groups (`ui-option-group`) and option icons need projected options. Virtualizing
  projected options with groups and icons would be a large job of its own, and nothing needs it
  yet.

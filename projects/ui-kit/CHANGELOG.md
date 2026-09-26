# Changelog

All notable changes to `@vplans/ui-kit`. The package is consumed from source inside the monorepo,
so versions mark review points rather than releases.

## Unreleased (phase 7: data)

### Added

- **table:** a click on `th[ui-sort-header]` announces the new order through `LiveAnnouncer`.
- **labels:** `sortedAscending`, `sortedDescending`, `sortedNone`.
- **table:** row selection: `[(uiTableSelection)]` on the table, `th[ui-table-select-all]`
  (tri-state) and `td[ui-table-select-row]`, Shift+click ranges, `selectionCompareWith`,
  `selectionDisabled`; selected rows get `aria-selected` and `ui-table-row--selected`.
- **tokens:** `--ui-table-row-selected-bg`.
- **labels:** `selectAll`, `selectRow`.
- **table:** expandable rows: `tr[uiExpandableRow]` (`expanded` model), `td[ui-row-toggle]` and
  `tr[ui-row-detail]` spanning every column.
- **tokens:** `--ui-table-detail-bg`.
- **labels:** `rowDetails`.
- **table:** `ui-table-container` scrolls wide tables sideways with edge shadows and becomes a
  focusable, named region while it overflows; `th/td[uiSticky]` (`start` or `end`) sticks
  columns, several per side.
- **tokens:** `--ui-table-scroll-shadow`, `--ui-table-scroll-shadow-size`.
- **labels:** `scrollableTable`.

## Unreleased (phase 6.0: test infrastructure)

### Added

- **tooling:** visual regression. `pnpm test-visual` compares a screenshot of every built story
  in light/rtl, dark/rtl and light/ltr with the baselines in `visual/` (`pixelmatch`, 0.1% of
  the pixels); `pnpm test-visual:update` writes new or changed baselines. The Storybook server
  and story list are shared with `test-storybook` (`scripts/storybook-pages.mjs`).
- **testing:** new entry point `@vplans/ui-kit/testing` with CDK component harnesses:
  `UiHarness` (base with focus helpers), `UiButtonHarness`, `UiInputHarness`,
  `UiCheckboxHarness`, `UiSelectHarness` + `UiOptionHarness` and `UiDialogHarness` (dialogs and
  drawers). New components come with a harness.

## Unreleased (phase 6: everyday blocks)

### Added

- **alert:** `ui-alert` with tones, title, `[uiAlertActions]`, `dismissible` and an opt-in live
  region (`live`).
- **tokens:** `--ui-color-info-subtle` and `--ui-color-info-text` are back (used by the alert).
- **labels:** `dismiss`.
- **empty-state:** `ui-empty-state` with icon or illustration slots, a heading title, description
  and actions; `size="sm"` for cards and `tr[ui-table-message]`.
- **progress:** `ui-progress-bar`, determinate or indeterminate, with sizes and tones.
- **avatar:** `ui-avatar` (image, initials or icon; 8 colors from the name) and
  `ui-avatar-group` with `max` and a "+N" counter.
- **tokens:** `--ui-color-accent-1-*` … `--ui-color-accent-8-*` (bg/text pairs) and
  `--ui-media-size-*`.
- **labels:** `moreCount`.
- **breadcrumbs:** `nav[ui-breadcrumbs]` and `a[ui-breadcrumb]` with CSS separators that turn in
  RTL and a "…" menu for collapsed links (`maxItems`).
- **labels:** `breadcrumbs`, `showMore`.
- **popover:** `[uiPopoverTriggerFor]` opens a non-modal dialog from an `ng-template` with
  `uiPopoverPosition`, `open()`/`close()`, `opened`/`closed` and a `close()` in the template context.
- **dialog:** `UiDialog.openDrawer()` opens a drawer at the `start` or `end` side (`UiDrawerOptions`)
  with the dialog parts, focus handling and `provideUiDialog()` defaults.
- **badge:** the `info` tone, `size="lg"`, `dot`, and `count` with `max` ("99+"); the text
  of a dot or count badge is read by screen readers only.
- **select / multi-select:** `clearable`, `loading` (spinner and `aria-busy`), and the option
  slots `[uiOptionIcon]` and `[uiOptionDescription]`.
- **labels:** `clear`.
- **calendar / datepicker:** month and year views from the calendar title, and Today and Clear
  buttons in the datepicker dialog.
- **labels:** `chooseMonth`, `chooseYear`, `today`.
- **menu:** `a[ui-menu-item]` link items, `ui-menu-group` with a label, `ui-menu-item-checkbox`
  and `ui-menu-item-radio`, and `uiMenuPosition` presets (`bottom-start`, `bottom-end`,
  `top-start`, `top-end`).

## Phase 5: second audit

### Breaking

- **radio:** `compareWith` is called as `compareWith(option, selected)`, like `ui-select` and
  `ui-multi-select`. It was `(selected, option)`. It is typed `(option: T, selected: T) => boolean`
  on all three controls and is never called with `null`: a `null` value matches only `null`.
- **tokens:** unused tokens are removed: `--ui-color-text-subtle` (use `--ui-color-text-muted`, the
  same value), `--ui-color-primary-subtle-hover`, `--ui-color-info-contrast`,
  `--ui-color-info-subtle`, `--ui-color-info-text`, and every `--ui-z-*` except `--ui-z-sticky`
  (overlays use the browser top layer, so z-index does not order them).

### Changed behavior

- **select / multi-select:** `searchChange` also emits `''` when the list closes after a search.
- **datepicker:** a two-digit year is the one within 50 years from now (`85` → 1985).
- **calendar:** header buttons at `min`/`max` use `aria-disabled` and stay focusable.
- **button:** a disabled or loading `a[ui-button]` has no `href`; `loading` announces the
  `loading` label.
- **theme:** `provideUiTheme()` creates `ThemeService` on startup, so the stored mode applies
  right away.
- **tokens (dark theme):** `surface-hover` is the new `gray.750` (`#364054`) and `danger-text`
  is `red.200`, for visible hover on raised surfaces and AA contrast. The light skeleton uses the
  new `surface-emphasis` token.
- **tokens:** app overrides on `:root` now also win in system dark mode.

### Added

- `readonly` on every custom form control, bound by Signal Forms `readonly()`.
- `aria-describedby` passthrough on every custom form control.
- A `required` checkbox or switch is invalid until checked in Reactive and template forms
  (`provideUiCheckedValidator()`); `UiCheckableBase` shares the checkbox/switch logic.
- **select:** `displayWith`; the selected label survives server-side results; option size follows
  the select size; Home/End open the list.
- **dialog:** `provideUiDialog()` / `UI_DIALOG_DEFAULT_OPTIONS`; `confirm()` takes `injector` and
  `viewContainerRef`.
- **theme:** follows a mode changed in another tab.
- **icon:** 21 icons and the `UiIconName` type.
- **tokens:** `surface-emphasis`, `--ui-menu-max-height`, `--ui-badge-font-size-md`.
- **labels:** `required`.
- Tooling: coverage thresholds (`pnpm test:coverage`), the story accessibility check
  (`pnpm test-storybook`), ESLint `strictTypeChecked`, stricter Stylelint, playground smoke tests.

### Fixed

- **datepicker:** the parse validator no longer stays on the form control after destroy; a Signal
  Forms reset drops invalid typed text; the typed date stays LTR in RTL.
- **menu:** Escape in a menu no longer closes the surrounding dialog.
- **core:** overlays opened from `dir="auto"` elements take the page direction; runtime
  validators are picked up by custom controls.
- **toast:** new toasts no longer replay the entry animation or steal focus; keyboard focus is
  kept for every removal; mouse close and touch no longer pause the stack; timers pause in a
  hidden tab.
- **tabs:** a disabled tab link keeps no `href` after navigations; the selected tab scrolls into
  view.
- **switch:** the focus ring shows on an invalid switch.
- **a11y:** static `aria-label` no longer stays on generic host elements; the calendar marks only
  the selected day; the form-field label announces "required" when only the field is marked;
  pagination announces the range only for user changes.
- Smaller fixes in accordion, table, tooltip, badge, divider and radio (see `git log`).

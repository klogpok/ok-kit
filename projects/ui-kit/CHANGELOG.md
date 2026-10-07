# Changelog

All notable changes to `@vplans/ui-kit`. The package is consumed from source inside the monorepo,
so versions mark review points rather than releases.

## 0.2.0 - 2026-10-06 (Angular 20 migration)

The library targets Angular 20 and Signal Forms is gone. Both are breaking: the package no longer
compiles or installs against Angular 21 or 22, and every binding written against the Signal Forms
API has to be rewritten as a Reactive or template-driven form. The sections below cover the
migration only; the component work listed under the phase headings further down is unreleased
alongside it.

### Breaking

- **forms:** Signal Forms support is removed from the library entirely - no entry point, no flag,
  no compatibility shim. `ControlValueAccessor` is the only forms contract: bind every control
  with `formControl`, `formControlName` or `ngModel`. `[field]` bindings, the `FormValueControl`
  implementations and every import of `@angular/forms/signals` are gone. Reactive and
  template-driven behaviour is unchanged: value in both directions, `disable()`, `readonly`, the
  required marker, `touched` on blur, and errors shown once a control is both invalid and touched.
- **forms:** custom controls now register through the `NG_VALUE_ACCESSOR` provider instead of
  assigning `NgControl.valueAccessor`. A consumer that subclasses `UiFormControlBase` must declare
  `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => X), multi: true }` on its own
  decorator; Angular does not inherit `providers` metadata into a subclass that carries its own
  decorator.
- **core:** `injectControlState()` takes an `Injector` and resolves `NgControl` lazily, on the
  first `sync()`, because a control that provides `NG_VALUE_ACCESSOR` and injects `NgControl`
  eagerly is a circular dependency (NG0200). `UiControlState` keeps every member; `bound` is now a
  `Signal<boolean>` rather than a plain boolean.
- **stepper:** `ui-step`'s `control` accepts a Reactive Forms control only. The union with a
  Signal Forms field, and the branch that read validity out of it, are removed.
- **number-input / time / datepicker / file-upload:** a parse error is held in the component's own
  error collection instead of a Signal Forms transform. It is displayed as before and never
  reaches the consumer's form control, so typed garbage no longer makes the form invalid by
  itself.

### Changed

- **peer dependencies:** Angular 20 only. `@angular/common`, `@angular/core`, `@angular/forms`,
  `@angular/platform-browser` and the optional `@angular/router` are `^20.3.0`; `@angular/cdk` is
  `^20.2.0`, the last line the CDK published for v20. `rxjs` stays `^7.8.0`. Angular 21 and 22 are
  no longer supported.
- The package name is unchanged: `@vplans/ui-kit`.
- **tooling:** TypeScript 5.8, Vitest 3, ESLint 9 with angular-eslint 20, ng-packagr 20. The
  library remains zoneless; tests and the playground provide `provideZonelessChangeDetection()`
  explicitly, since Angular 20 is zone-based by default.
- **storybook:** the workbench builds through `@storybook/angular` (webpack) instead of
  `@storybook/angular-vite`, which has no Angular 20 release. Stories, autodocs and the visual
  baselines are unchanged - every story renders pixel-identically. Hot module replacement in the
  dev server works as before.
- **tooling:** coverage thresholds are checked by `scripts/check-coverage.mjs` at the end of
  `pnpm test:coverage`, since the Angular 20 unit-test builder has no threshold option. Branches is
  80 instead of 90: Vitest 3 counts branches on the compiled output, so the same suite reads 81%
  where Vitest 5 read 93%.

## Unreleased (phase 8: complex widgets)

### Added

- **slider:** new entry point with `ui-slider` (a `number`) and `ui-range-slider` (a
  `[start, end]` tuple, `limits` for Signal Forms): native range inputs for the role, labels and
  screen reader adjusting; track clicks and drags, arrow keys that follow the visual direction in
  RTL, PageUp/PageDown, Home/End; `step`, ticks and labelled `marks`, `valueText`, a
  `valueCommit` output; `UiSliderHarness` in testing.
- **tokens:** `--ui-slider-*`.
- **labels:** `rangeStart`, `rangeEnd`.
- **datepicker:** `ui-date-range-picker`: a `{ start, end }` value, start and end fields that
  parse typed dates, a calendar dialog with two months (one on narrow screens), a hover and focus
  preview of the range, `presets`, `minDate` / `maxDate` / `dateFilter`, `uiDateParse` and
  `uiDateRangeOrder` errors; `UiDateRangePickerHarness` in testing.
- **datepicker:** `ui-calendar` `range` mode (`[(selectedRange)]`, `rangeSelected`) and `months`
  for several months side by side.
- **tokens:** `--ui-calendar-month-gap`, `--ui-calendar-range-bg`.
- **labels:** `chooseDateRange`, `startDate`, `endDate`, `dateRangePresets`, `invalidDateRange`.
- **time:** new entry point with `ui-time-input`: an `"HH:mm"` value shown in 24-hour or 12-hour
  format by locale, a typing mask, a list of times every `interval` minutes (editable combobox),
  `minTime` / `maxTime`, a `uiTimeParse` error; `uiDateWithTime()` and `uiTimeOf()` to join it
  with a date; `UiTimeInputHarness` in testing.
- **labels:** `invalidTime`.
- **stepper:** new entry point with `ui-stepper` and `ui-step`: a list of step buttons with
  `aria-current="step"`, done/error/current states read after the label, `control` (Reactive
  Forms control or Signal Forms field) for the step validity, `completed`, `error`, `optional`,
  `linear` mode that marks a blocking form touched, horizontal and vertical orientation,
  `button[uiStepperNext]` / `button[uiStepperPrevious]`, `next()` / `previous()` / `select()` /
  `reset()`; `UiStepperHarness` and `UiStepHarness` in testing.
- **tokens:** `--ui-stepper-*`.
- **labels:** `steps`, `optional`, `stepCompleted`, `stepError`.
- **segmented:** new entry point with `ui-segmented` + `ui-segment` (one choice: a
  `radiogroup` of native radios, arrow keys that move and select and follow the visual direction
  in RTL, `uiSegmentIcon`, icon-only segments) and `ui-button-toggle-group` +
  `button[ui-button-toggle]` (several choices: `aria-pressed` buttons with a check mark, a
  `readonly T[]` value); both with `size`, `fullWidth`, `compareWith`, `readonly` and a
  vertical `orientation`; Home/End in `ui-segmented`;
  `UiSegmentedHarness` and `UiButtonToggleGroupHarness` in testing.
- **tokens:** `--ui-segmented-*`.
- **select / autocomplete:** `items` (`UiOptionItem[]`: `value`, `label`, `description`,
  `disabled`) gives the options as data instead of projected `ui-option`s. From
  `virtualThreshold` items on (100 by default) the list is a `cdk-virtual-scroll-viewport` that
  renders only the options in view; the keyboard, typeahead, search and "select all" still reach
  every item, `aria-activedescendant` names the active option once it is rendered, and each
  option reports its `aria-posinset` / `aria-setsize` in the whole list. The listbox itself
  scrolls, and "select all" stays at its top while the rows scroll under it.
- **table:** `cdk-virtual-scroll-viewport[uiTableViewport]` for thousands of rows with
  `*cdkVirtualFor`: `aria-rowcount` on the table and `aria-rowindex` on each rendered row, a
  focusable region named by the caption, and a `stickyHeader` that stays at the top of the
  viewport.

## Unreleased (phase 7: data)

### Added

- **icon:** `file-upload` (`uiIconFileUpload`).
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
- **number-input:** new entry point with `ui-number-input`: locale parsing and formatting,
  `min`/`max`/`step`, fraction digits, grouping, arrow/page/Home/End keys, stepper buttons that
  repeat while held, a `uiNumberParse` error, affixes; `UiNumberInputHarness` in testing.
- **labels:** `increment`, `decrement`, `invalidNumber`.
- **chip:** new entry point: `ui-chip` (removable, announced removal, `uiChipIcon`),
  `button[ui-filter-chip]` (`aria-pressed`), `ui-chip-set` (list or group with roving
  tabindex and RTL arrows) and `ui-chip-input` (`string[]` value, separators, paste, Backspace);
  `UiChipHarness` and `UiChipInputHarness` in testing.
- **tokens:** `--ui-chip-*`.
- **labels:** `removeChip`, `chipRemoved`.
- **select:** the listbox overlay, active option, filtering and labels moved into a shared
  internal base (`ɵUiOptionPanel`) used by select, multi-select and autocomplete. No API change.
- **autocomplete:** new entry point with `ui-autocomplete`: free text with suggestions, or a
  pick-one mode with `displayWith` for objects; `(searchChange)`, `filterOptions`, `loading`,
  `compareWith`; `UiAutocompleteHarness` in testing.
- **file-upload:** new entry point with `ui-file-upload`: a drop area that is a button (or
  `variant="button"`), a file list with sizes, remove buttons and progress bars, `accept` /
  `maxSize` / `maxFiles` reported as `uiFileType` / `uiFileSize` / `uiFileCount` form errors;
  `UiFileUploadHarness` in testing.
- **tokens:** `--ui-file-upload-*`.
- **multi-select:** `chips` (selected values as `ui-chip`s in the trigger), `selectAll` (a
  tri-state first option for the options the search shows) and `maxSelections`.
- **labels:** `dropFiles`, `chooseFiles`, `removeFile`, `fileRemoved`, `fileTooLarge`,
  `fileTypeNotAllowed`, `tooManyFiles`.

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

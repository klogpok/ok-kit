# Changelog

All notable changes to `@vplans/ui-kit`. The package is consumed from source inside the monorepo,
so versions mark review points rather than releases.

## Unreleased (phase 5: second audit)

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
  (`pnpm test-storybook`), type-aware ESLint rules, stricter Stylelint, playground smoke tests.

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

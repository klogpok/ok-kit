---
paths:
  - "projects/**/*.spec.ts"
  - "projects/ui-kit/testing/**"
---

# Unit tests and harnesses

- Angular 22 components are OnPush by default, including test hosts. Use signals for host state in specs. `ngDoCheck` of a child runs only when its parent is checked, so an OnPush test host must change a signal to re-render.
- jsdom has no Popover API, `matchMedia`, `scrollIntoView` or `scrollBy`: stub them per test.
- In Vitest (jsdom): the CDK key managers read `keyCode`, so pass it in `KeyboardEvent`. `InteractivityChecker` sees every element as hidden (no layout), so dialog focus tests need a fake checker (see `dialog.spec.ts`).
- Vitest does not load component styles, so `getComputedStyle` tests of component CSS pass either way. Check CSS fixes in the browser.
- CDK `sendKeys()` on a non-text input (`type="range"`) writes the key name into `value` and fires `input`, so the browser resets the value. Dispatch `keydown` with `{ key }` instead (see `UiSliderHarness`).
- jsdom has `PointerEvent` but no pointer capture (`setPointerCapture`): stub it on the element.
- `UiButtonHarness` also finds `ui-icon-button` (both have the `.ui-button` class), e.g. the close button of `ui-dialog-header`. Filter by `text` or `label`.
- The `ui-form-field` label contains the required marker (`*` and, for groups, the `required` label text). Harness `label` filters read `label[for]` with `text({ exclude })` to drop it.

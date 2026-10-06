---
paths:
  - "projects/**/*.spec.ts"
  - "projects/ui-kit/testing/**"
---

# Unit tests and harnesses

- On Angular 20 a component is checked eagerly unless it declares `ChangeDetectionStrategy.OnPush`. The lint rule that requires the declaration is off for `*.spec.ts` and `*.stories.ts`, so test hosts are eager; the kit's own components are OnPush. Keep host state in signals anyway: that is the style across the suite, and `ngDoCheck` of an OnPush child runs only when its parent is checked.
- The suite is zoneless, which Angular 20 is not by default: each test target in `angular.json` names a `providersFile` that provides `provideZonelessChangeDetection()` (`projects/ui-kit/test-setup/providers.ts`).
- Coverage thresholds live in `scripts/check-coverage.mjs`, not in `angular.json`: the Angular 20 unit-test builder has no threshold option. The script's comment says why branches is lower than the rest.
- CDK 20.2 harnesses put `view: window` into every synthetic event, and the global `window` under Vitest's jsdom is not a real `Window`. `projects/ui-kit/test-setup/jsdom-event-view.ts` substitutes the real one; do not remove it.
- jsdom has no Popover API, `matchMedia`, `scrollIntoView` or `scrollBy`: stub them per test.
- In Vitest (jsdom): the CDK key managers read `keyCode`, so pass it in `KeyboardEvent`. `InteractivityChecker` sees every element as hidden (no layout), so dialog focus tests need a fake checker (see `dialog.spec.ts`).
- Vitest does not load component styles, so `getComputedStyle` tests of component CSS pass either way. Check CSS fixes in the browser.
- CDK `sendKeys()` on a non-text input (`type="range"`) writes the key name into `value` and fires `input`, so the browser resets the value. Dispatch `keydown` with `{ key }` instead (see `UiSliderHarness`).
- jsdom has `PointerEvent` but no pointer capture (`setPointerCapture`): stub it on the element.
- The playground phase sections are `@defer (on viewport)` blocks. `app.spec.ts` sets `DeferBlockBehavior.Manual` and renders every block with `DeferBlockState.Complete` before it looks for their content.
- `UiButtonHarness` also finds `ui-icon-button` (both have the `.ui-button` class), e.g. the close button of `ui-dialog-header`. Filter by `text` or `label`.
- The `ui-form-field` label contains the required marker (`*` and, for groups, the `required` label text). Harness `label` filters read `label[for]` with `text({ exclude })` to drop it.
- The calendar opens on today's month when the control has no value, so a spec that clicks a day by `data-date` depends on the day it runs. Freeze the clock with `vi.useFakeTimers({ toFake: ['Date'] })` and `vi.setSystemTime(new Date(2026, 8, 25, 12))`, the same day the visual baselines use (see `visual.md`).
- `settle(fixture)` is copied verbatim into every spec that needs it (20 of 69 files), and so is `(x.textContent ?? '').trim()`. That duplication is deliberate: tickets 08-10 of the Angular 20 migration said no new harness or test helper is introduced, so do not extract it without asking.

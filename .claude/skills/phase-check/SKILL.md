---
name: phase-check
description: Full verification checklist for @vplans/ui-kit. Use before reporting a phase as done, before asking the user for a phase review, or when asked to run all checks.
---

# Phase check

Run every step. Report failures with their output; do not report the phase as done while a step fails.

## 1. Automated checks

Run `pnpm phase-check` from the repo root, in the background (it takes about 25 minutes; `test-storybook` and `test-host-css` are most of it). It checks that the branch contains the local `master`, then runs every check below in order and stops at the first failure with that step's error tail; full logs are in `dist/phase-check/`. On success it ends with the lines the report quotes: test counts, the four coverage numbers, story and capture counts, budget warnings. The steps are listed in `scripts/phase-check.lib.mjs`. A run cut short resumes with `pnpm phase-check --from <step>` while the commit is the same: the earlier steps are skipped, so say in the report which run they passed in.

- `pnpm test-storybook` runs axe on every story in three modes (light/rtl, dark/rtl, light/ltr).
- `pnpm test-host-css` prepends a host app's global CSS (the fixture in `scripts/host-css/`: Bootstrap 4.6.2 and the client's html/body rules) to every story in light RTL, light LTR and with a focused button, and fails when it changes a kit element (computed styles, or the pixels of a kit component). The inherited host body `color` and `letter-spacing` are accepted. Captures of a failure are in `dist/host-css/`; put the number of captures in the report.
- Budget warnings from `pnpm build:playground` are not failures, but list them in the report. The limits are in [docs/DECISIONS.md](../../../docs/DECISIONS.md) (phase 2 review answers).
- `pnpm test:coverage` fails below the thresholds in `scripts/check-coverage.mjs`. Put the four numbers in the report.
- `pnpm test-scripts` runs the `node:test` suites of `scripts/`.

## 2. Visual baselines

New or intentionally changed stories need new baselines:

While you iterate on one component's stories, run `pnpm test-storybook --filter <id part>` and `pnpm test-visual:update --filter <id part>` (e.g. `data-display-tree`); keep the full commands for the final pass.

1. `pnpm test-visual:update`.
2. Look at every new or changed PNG in `visual/` before committing it. Diffs of a failed run are in `dist/visual-diff/`. Baselines failing outside the stories you touched: follow the drift rule in `.claude/rules/visual.md`.
3. Commit the baselines separately (`chore(visual): ...`).

## 3. Browser check

Open states (a list opened with a key, a scrolled table, an open menu) are play stories: `test-storybook` runs axe on them and `test-visual` takes their snapshots, so give every new overlay or keyboard path one (see `.claude/rules/storybook.md`). Then check the new and changed stories in a real browser for light and dark themes and for RTL, for what the play stories do not assert. Start the Storybook dev server with `pnpm storybook` and stop it when the check is done. `playwright-core` with `channel: 'msedge'` works without downloading browsers. Vitest does not load component styles, so CSS fixes are verified here or in the baselines.

A change that only alters how stories look (a size, a color, a spacing) and adds no interaction is checked by the new and changed baselines of step 2: they cover light RTL, dark RTL and light LTR. Say in the report that the baselines were the browser check.

## 4. Report

End the phase with a report:

- what was done (commits, components, numbers: tests, coverage, stories, baselines);
- what is left;
- deviations from the plan in [docs/ROADMAP.md](../../../docs/ROADMAP.md) and the decisions the user must make, each filed as a `needs-info` ticket ([docs/agents/issue-tracker.md](../../../docs/agents/issue-tracker.md) → "Open review questions").

Every change to the public API (a new input, export, icon or class rename) gets an entry in an `Unreleased (<topic>)` section of `projects/ui-kit/CHANGELOG.md`. Record the status in `docs/ROADMAP.md`; work outside the phases gets its own section there, like "Leading actions в popup listbox", and a mention in the "Сейчас" line. Wait for approval before starting the next phase; after approval, record the review answers in `docs/DECISIONS.md` and close their tickets.

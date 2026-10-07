---
name: phase-check
description: Full verification checklist for @vplans/ui-kit. Use before reporting a phase as done, before asking the user for a phase review, or when asked to run all checks.
---

# Phase check

Run every step. Report failures with their output; do not report the phase as done while a step fails.

## 1. Automated checks

Run from the repo root, in this order (later steps depend on earlier builds):

```sh
pnpm tokens && pnpm lint && pnpm format:check && pnpm test:coverage && pnpm test:playground && pnpm build && pnpm build:playground && pnpm build-storybook && pnpm test-storybook && pnpm test-visual
```

Then type-check the stories:

```sh
pnpm exec ngc -p projects/ui-kit/.storybook/tsconfig.json --noEmit
```

- `pnpm test-storybook` runs axe on every story in three modes (light/rtl, dark/rtl, light/ltr).
- Budget warnings from `pnpm build:playground` are not failures, but list them in the report. The limits are in [docs/DECISIONS.md](../../../docs/DECISIONS.md) (phase 2 review answers).
- `pnpm test:coverage` fails below the thresholds in `scripts/check-coverage.mjs`. Put the four numbers in the report.

## 2. Visual baselines

New or intentionally changed stories need new baselines:

1. `pnpm test-visual:update`.
2. Look at every new or changed PNG in `visual/` before committing it. Diffs of a failed run are in `dist/visual-diff/`.
3. Commit the baselines separately (`chore(visual): ...`).

## 3. Browser check

Open states (a list opened with a key, a scrolled table, an open menu) are play stories: `test-storybook` runs axe on them and `test-visual` takes their snapshots, so give every new overlay or keyboard path one (see `.claude/rules/storybook.md`). Then check the new and changed stories in a real browser for light and dark themes and for RTL, for what the play stories do not assert. Start the Storybook dev server with `pnpm storybook` and stop it when the check is done. `playwright-core` with `channel: 'msedge'` works without downloading browsers. Vitest does not load component styles, so CSS fixes are verified only here.

## 4. Report

End the phase with a report:

- what was done (commits, components, numbers: tests, coverage, stories, baselines);
- what is left;
- deviations from the plan in [docs/ROADMAP.md](../../../docs/ROADMAP.md) and the decisions the user must make, each filed as a `needs-info` ticket ([docs/agents/issue-tracker.md](../../../docs/agents/issue-tracker.md) → "Open review questions").

Record the status in `docs/ROADMAP.md`. Wait for approval before starting the next phase; after approval, record the review answers in `docs/DECISIONS.md` and close their tickets.

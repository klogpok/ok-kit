# @vplans/ui-kit workspace

This repo holds an in-house Angular design system. The full brief is in [docs/SPEC.md](docs/SPEC.md).
Usage and contribution rules are in [projects/ui-kit/README.md](projects/ui-kit/README.md); follow them.

## Decisions (these override the brief)

- The stack is Angular 20.3 (CDK 20.2 — there is no CDK 20.3) with pnpm 12. No CI. The package is not published; it is consumed inside the monorepo.
- The consuming application is on Angular 20 and will not be upgraded, so the library must compile under its Angular 20 compiler. **Signal Forms is removed** and must not come back: see [docs/DECISIONS.md](docs/DECISIONS.md) → "Signal Forms is reversed".
- The package is `@vplans/ui-kit` and selectors use the `ui-` prefix (`ui-button`, `button[ui-button]`).
- Form controls speak **Reactive and template forms only**, through `ControlValueAccessor` (`formControl`, `formControlName`, `ngModel`):
  - custom controls extend `UiFormControlBase` (`@vplans/ui-kit/core`) and each one provides `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => X), multi: true }` itself — `providers` metadata is not inherited;
  - such a control must not inject `NgControl` while it is constructed (NG0200); `injectControlState()` resolves it on the first `sync()`;
  - native inputs use `injectControlState()` and provide no accessor of their own.
- Brand colors come from the VPlans app:
  - primary blue `#2490ed` (buttons use `#1a74c9` so text meets AA contrast);
  - cool gray text `#2b3549` and borders `#e4e7ed`;
  - success green `#008752`, olive status `#a19329`.
- The font stack is `Assistant, Roboto, "Helvetica Neue", sans-serif`.
- The app is Hebrew and RTL.
- Current sizes are accepted for now.

## Status and history

- Phases 1–7 are done and approved (2026-09-26). In phase 8, 8.1–8.5 (date range picker, time input, stepper, slider, segmented) are done and approved. The Angular 20 migration ran as its own phase after 8.5; it is approved and merged into `master` (2026-10-07), with two open questions left in [docs/DECISIONS.md](docs/DECISIONS.md). 8.6–8.7 were deferred until after it and are next. The plan for phases 8–9 and the migration phase are in [docs/ROADMAP.md](docs/ROADMAP.md).
- What each phase delivered and every review answer are in [docs/DECISIONS.md](docs/DECISIONS.md). Check it before you change an existing default or behavior: most were chosen by the user.

## Workflow per phase

1. Build components one at a time, each in its own secondary entry point (see README → "Adding a component").
2. Commit each component separately (`feat(<name>): ...`). Include tests and stories.
3. Before reporting a phase, run the `/phase-check` skill: the full check command, visual baselines, the browser check in light/dark/RTL and the report format.
4. End the phase with a report: what was done, what is left, which decisions the user must make. Wait for approval before starting the next phase.

## Gotchas

Area-specific gotchas live in `.claude/rules/` and load when you open matching files: `components.md` (Angular, focus, RTL, Storybook JIT), `forms.md`, `overlays.md`, `testing.md`, `storybook.md`, `visual.md`, `styles.md`. Add a new gotcha to the matching rule file, not here.

- The package is consumed through tsconfig paths, not `node_modules`.
- pnpm 12: dependencies that need build scripts must be listed under `allowBuilds` in `pnpm-workspace.yaml`. Do not use `pnpm dlx` for such CLIs.
- In sed and perl replacements `\u` upper-cases the next character, and the agent's Write/Edit tools and heredocs turn a typed `\u2066` into the raw character. Build the backslash in Node (`String.fromCharCode(92) + 'u2066'`) and check the file with grep.

## Agent skills

### Issue tracker

Issues and specs are local markdown under `.scratch/<feature>/`; there is no remote tracker.
See [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

The five canonical roles, unchanged: `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. See [docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

Single-context: `GLOSSARY.md` at the root and `docs/adr/`. See [docs/agents/domain.md](docs/agents/domain.md).

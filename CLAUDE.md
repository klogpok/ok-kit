# @vplans/ui-kit workspace

This repo holds an in-house Angular design system. The full brief is in [docs/SPEC.md](docs/SPEC.md).
Usage and contribution rules are in [projects/ui-kit/README.md](projects/ui-kit/README.md); follow them.

## Decisions (these override the brief)

- The stack is Angular 22.2 with pnpm 12. No CI. The package is not published; it is consumed inside the monorepo.
- The package is `@vplans/ui-kit` and selectors use the `ui-` prefix (`ui-button`, `button[ui-button]`).
- Form controls support **Signal Forms natively** and Reactive/template forms through CVA:
  - custom controls extend `UiFormControlBase` (`@vplans/ui-kit/core`);
  - native inputs use `injectControlState()`.
- Brand colors come from the VPlans app:
  - primary blue `#2490ed` (buttons use `#1a74c9` so text meets AA contrast);
  - cool gray text `#2b3549` and borders `#e4e7ed`;
  - success green `#008752`, olive status `#a19329`.
- The font stack is `Assistant, Roboto, "Helvetica Neue", sans-serif`.
- The app is Hebrew and RTL.
- Current sizes are accepted for now.

## Status and history

- Phases 1–7 are done and approved (2026-09-26). The next phase is 8; the plan for phases 8–9 is in [docs/ROADMAP.md](docs/ROADMAP.md).
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

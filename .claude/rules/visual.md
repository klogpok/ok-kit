---
paths:
  - "scripts/**"
  - "visual/**"
---

# Visual regression

- Baselines are taken in the Chromium headless shell of playwright-core, not the installed Edge, with `--disable-lcd-text` (1024×768, reduced motion, `animations: 'disabled'`, `he-IL`, Asia/Jerusalem). The date is fixed to 2026-09-25 with `context.clock.setFixedTime()`, so the "today" mark of the calendar does not move.
- The screenshot covers `#storybook-root` and open `.cdk-overlay-pane`s.
- The browser is pinned by the exact `playwright-core` version in `package.json`; on a new machine run `pnpm exec playwright-core install chromium-headless-shell`. Installed Edge re-rendered the text of 783 of 942 baselines within one major version, so do not switch back to `channel: 'msedge'`. Bump `playwright-core` on purpose, rerun `pnpm test-visual:update` in the same commit and review the diff. `test-storybook` and `test-host-css` keep using Edge: they compare nothing across runs.
- When `test-visual` fails on the base commit too (`master`, or the branch you started from), the environment drifted, not your change. Stop and report to the user: how many baselines fail and the diff range in %. Keep comparing against the committed baselines; re-taking them is the user's call.
- After `pnpm test-visual:update`, look at the new PNGs in `visual/` before committing them.
- `test-visual:update` keeps a baseline whose capture differs by less than 0.1% of the pixels and lists it under "Kept … within the limit". When that list names a story whose look you changed on purpose (a 16px icon), rerun with `--filter <id part> --force` so the baseline shows the new look.
- `check-host-css.mjs` (`pnpm test-host-css`) checks kit elements only: computed styles of what kit templates render, and the pixels of each outermost kit element cut out of both captures. A story's own markup may move or restyle under the host CSS (it takes Bootstrap's `p` margins and `text-align`); that is the host's styling of its own content, not a failure. The host fixture is vendored in `scripts/host-css/`; never read it from the client.
- `check-visual.mjs` fails a story taller than 16384px, the most a browser screenshot captures reliably. Lay long lists out in columns, as `Foundations/Tokens → Component tokens` does.

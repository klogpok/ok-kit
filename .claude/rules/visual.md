---
paths:
  - "scripts/**"
  - "visual/**"
---

# Visual regression

- Baselines are taken in the installed Edge (1024×768, reduced motion, `animations: 'disabled'`, `he-IL`, Asia/Jerusalem). The date is fixed to 2026-09-25 with `context.clock.setFixedTime()`, so the "today" mark of the calendar does not move.
- The screenshot covers `#storybook-root` and open `.cdk-overlay-pane`s.
- A new Edge version can change anti-aliasing: rerun `pnpm test-visual:update` and review the diff.
- After `pnpm test-visual:update`, look at the new PNGs in `visual/` before committing them.
- `check-host-css.mjs` (`pnpm test-host-css`) checks kit elements only: computed styles of what kit templates render, and the pixels of each outermost kit element cut out of both captures. A story's own markup may move or restyle under the host CSS (it takes Bootstrap's `p` margins and `text-align`); that is the host's styling of its own content, not a failure. The host fixture is vendored in `scripts/host-css/`; never read it from the client.
- `check-visual.mjs` fails a story taller than 16384px, the most a browser screenshot captures reliably. Lay long lists out in columns, as `Foundations/Tokens → Component tokens` does.

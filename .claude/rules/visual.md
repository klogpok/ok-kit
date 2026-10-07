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
- A story taller than 16384px (the browser's texture limit) fails now and then with `Unable to capture screenshot`. Keep long lists in columns; `Foundations/Tokens → Component tokens` was split into two for that.

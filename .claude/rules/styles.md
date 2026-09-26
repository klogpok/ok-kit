---
paths:
  - "projects/**/*.scss"
  - "projects/ui-kit/tokens/**"
---

# Styles and tokens

- Stylelint allows only logical `text-align` values (`start`, `end`, `center`).
- App SCSS uses `@use 'ui-kit/styles' as ui` with `stylePreprocessorOptions.includePaths: ["projects"]`.

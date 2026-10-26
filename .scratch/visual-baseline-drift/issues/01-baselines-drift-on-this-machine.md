# 01: Visual baselines drift on this machine

**Status:** needs-info
**Blocked by:** None

Found in the verify of `.scratch/calendar-dialog-field/` on 2026-10-26.

**Facts:**

- No Chromium headless shell was installed on this machine. A ticket agent installed it with
  `pnpm exec playwright-core install chromium-headless-shell` (`.claude/rules/visual.md`):
  `%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-1243`, `playwright-core` 1.63.0 as pinned
  in `package.json`.
- With it, `pnpm test-visual` fails 802 captures in about 45 story groups: 800 differ by 0.1–5.91%
  of the pixels, 2 by one pixel of width (`overlays-tooltip--corner-at-the-edge`, RTL).
- `master` (`5d05c3b`) fails the same way: `actions-button` up to 1.84%, `forms-switch` up to
  0.81%. The agents saw only the anti-aliasing of text differ.
- The `calendar-dialog-field` branch renders the 51 captures of `forms-date-picker`,
  `forms-date-range-picker` and `forms-calendar` with the same pixel counts as `master`.
- `test-storybook` and `test-host-css` (Edge) pass.

**Question:** what changed in the environment the baselines were taken in (fonts, machine,
display settings), and should the baselines be taken again on this machine?

**Options:**

1. Find the cause and fix the environment, keep the committed baselines.
2. Take the baselines again on this machine: `pnpm test-visual:update` on `master`, look at the new
   PNGs, one `chore(visual)` commit.
3. Raise the diff threshold of `check-visual.mjs`.

Until it is answered, a phase check compares a branch's `test-visual` failures with those of
`master`.

## Русский перевод

# 01: Visual baselines расходятся на этой машине

**Статус:** needs-info
**Заблокирован:** нет

Найдено при verify `.scratch/calendar-dialog-field/` 2026-10-26.

**Факты:**

- На машине не было Chromium headless shell. Агент тикета поставил его командой
  `pnpm exec playwright-core install chromium-headless-shell` (`.claude/rules/visual.md`):
  `%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-1243`, `playwright-core` 1.63.0, как
  закреплено в `package.json`.
- С ним `pnpm test-visual` падает на 802 снимках примерно в 45 группах stories: 800 отличаются на
  0.1–5.91% пикселей, 2 — на один пиксель ширины (`overlays-tooltip--corner-at-the-edge`, RTL).
- `master` (`5d05c3b`) падает так же: `actions-button` до 1.84%, `forms-switch` до 0.81%. Агенты
  видели отличие только в сглаживании текста.
- Ветка `calendar-dialog-field` рисует 51 снимок `forms-date-picker`, `forms-date-range-picker` и
  `forms-calendar` с тем же числом отличающихся пикселей, что и `master`.
- `test-storybook` и `test-host-css` (Edge) проходят.

**Вопрос:** что изменилось в окружении, где снимали baselines (шрифты, машина, настройки
дисплея), и снимать ли baselines заново на этой машине?

**Варианты:**

1. Найти причину и починить окружение, оставить закоммиченные baselines.
2. Переснять baselines на этой машине: `pnpm test-visual:update` на `master`, осмотреть новые PNG,
   один коммит `chore(visual)`.
3. Поднять порог расхождения в `check-visual.mjs`.

Пока ответа нет, phase check сравнивает падения `test-visual` ветки с падениями `master`.

# 04: Changelog, decisions and report

Status: done
Blocked by: 02, 03

Spec: `../spec.md`. Tickets 02 and 03 leave the shared docs to this ticket so they do not touch
the same files.

**What to build:**

- `projects/ui-kit/CHANGELOG.md`: the corner placements on tooltip and popover, the new `core`
  exports, and that `UiTooltipPosition` / `UiPopoverPosition` are now aliases of
  `UiOverlayPlacement`.
- `docs/DECISIONS.md`: a section for this work with the five grilling decisions of the spec and
  their reasons (corner not aligned, `corner-` prefix because the menu owns `top-start`, tooltip
  and popover only, vertical flip then push, block-axis gap only).
- `docs/ROADMAP.md`: the status of this work.
- Run `/phase-check` and report: what was done, what is left, which decisions the user must make;
  each open question becomes its own `needs-info` ticket here.

- [x] `CHANGELOG.md` notes the corners and the widened position types.
- [x] `docs/DECISIONS.md` records the five decisions and their reasons.
- [x] `docs/ROADMAP.md` shows the status.
- [x] `/phase-check` passes: tests, lint, build, visual baselines (new ones for the corners only),
      browser check in light, dark and RTL. (2026-10-23, `pnpm phase-check` green; the browser
      check is the play functions and baselines of `test-storybook` / `test-visual` in light-ltr,
      light-rtl and dark-rtl.)
- [x] The report is written; open questions are `needs-info` tickets.
- [x] One commit, `docs(overlay-corners): ...`.

## Русский перевод

# 04: Changelog, решения и отчёт

Статус: сделано
Заблокирован: 02, 03

Spec: `../spec.md`. Тикеты 02 и 03 оставляют общие документы этому тикету, чтобы не трогать одни и
те же файлы.

**Что сделать:**

- `projects/ui-kit/CHANGELOG.md`: угловые placement-ы у tooltip и popover, новые экспорты `core` и
  то, что `UiTooltipPosition` / `UiPopoverPosition` теперь псевдонимы `UiOverlayPlacement`.
- `docs/DECISIONS.md`: раздел для этой работы с пятью решениями из допроса и их причинами (угол, а
  не выравнивание; префикс `corner-`, потому что `top-start` занят у menu; только tooltip и popover;
  вертикальный флип, затем push; зазор только по вертикали).
- `docs/ROADMAP.md`: статус этой работы.
- Запустить `/phase-check` и написать отчёт: что сделано, что осталось, какие решения нужны от
  пользователя; каждый открытый вопрос — отдельный тикет `needs-info` здесь.

- [x] `CHANGELOG.md` отмечает углы и расширенные типы позиций.
- [x] `docs/DECISIONS.md` записывает пять решений и их причины.
- [x] `docs/ROADMAP.md` показывает статус.
- [x] `/phase-check` проходит: тесты, lint, build, визуальные baselines (новые только для углов),
      проверка в браузере в светлой, тёмной теме и RTL. (2026-10-23, `pnpm phase-check` зелёный;
      проверка в браузере — play-функции и baselines `test-storybook` / `test-visual` в light-ltr,
      light-rtl и dark-rtl.)
- [x] Отчёт написан; открытые вопросы — тикеты `needs-info`.
- [x] Один коммит, `docs(overlay-corners): ...`.

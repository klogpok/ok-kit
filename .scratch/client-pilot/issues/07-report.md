# 07: pilot report

**Status:** ready-for-agent
**Blocked by:** 05, 06

- [ ] Kit: `/phase-check` (full check command, visual baselines, browser in light/dark/RTL).
- [ ] Client: `npx ng build -c production --localize`, the action-weights spec through the
  `.scratch` tsconfig, `npm run test:price-quotes`, `sync:client --check` is clean, and
  `git diff --stat master` lists only paths under `apartment-changes-new/`.
- [ ] Report to the user: what was done, what broke and how it was fixed (kit ticket or a change
  inside `apartment-changes-new`), what is left, and the next screen from the survey
  (`create-quote-item-dialog`, `deadline-dialog` → `schedule-dialog`). Every open question becomes
  its own `needs-info` ticket here.
- [ ] ROADMAP section status and the delivered decisions in `docs/DECISIONS.md`.

## Русский перевод

# 07: отчёт пилота

**Статус:** ready-for-agent
**Зависит от:** 05, 06

- [ ] Кит: `/phase-check` (полная команда проверок, визуальные снимки, браузер в light/dark/RTL).
- [ ] Клиент: `npx ng build -c production --localize`, спек action-weights через tsconfig в
  `.scratch`, `npm run test:price-quotes`, `sync:client --check` чистый, а `git diff --stat master`
  показывает только пути внутри `apartment-changes-new/`.
- [ ] Отчёт пользователю: что сделано, что сломалось и как исправлено (тикет в ките или правка
  внутри `apartment-changes-new`), что осталось, и следующий экран по обзору
  (`create-quote-item-dialog`, `deadline-dialog` → `schedule-dialog`). Каждый открытый вопрос —
  отдельный тикет `needs-info` здесь же.
- [ ] Статус раздела ROADMAP и принятые решения в `docs/DECISIONS.md`.

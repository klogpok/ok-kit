# 07: Phase 9.1 report

**Spec:** [../spec.md](../spec.md)

**What to build:** phase 9.1 closes: the full check runs through the `/phase-check` skill (unit tests, coverage, stories with axe in three modes, visual baselines, the browser in light/dark/RTL), and the user gets a report of what was done, what is left and which decisions are theirs. Every open question becomes its own `needs-info` ticket in this directory. 

**Blocked by:** 01 (Tooltip defaults provider), 02 (Pagination defaults provider), 03 (Overlays fit the viewport without the scrollbar), 04 (Size and duration multipliers become component tokens), 05 (UiOption exposes only its inputs), 06 (Shared overlay presets and direction sync in core)

**Status:** ready-for-agent

- [ ] `/phase-check` passes, or every failure is named in the report
- [ ] The phase 9.1 section of the roadmap records the status, the commits and the deviations from the spec
- [ ] Every question for the user is a `needs-info` ticket with the facts and the options
- [ ] The user approved the sub-phase, and the approval is recorded in the decisions log

## Русский перевод

# 07: Отчёт подфазы 9.1

**Спека:** [../spec.md](../spec.md)

**Что сделать:** подфаза 9.1 закрывается: полный чеклист проходит через скилл `/phase-check` (unit-тесты, coverage, stories с axe в трёх режимах, визуальные снимки, браузер в light/dark/RTL), и пользователь получает отчёт: что сделано, что осталось, какие решения за ним. Каждый открытый вопрос — отдельный тикет `needs-info` в этой папке. 

**Заблокировано:** 01 (Defaults-провайдер tooltip), 02 (Defaults-провайдер pagination), 03 (Оверлеи помещаются во viewport без полосы прокрутки), 04 (Множители размеров и длительностей становятся component-токенами), 05 (UiOption открывает наружу только свои входы), 06 (Общие пресеты оверлеев и синхронизация направления в core)

**Статус:** ready-for-agent

- [ ] `/phase-check` проходит, или каждая ошибка названа в отчёте
- [ ] Раздел подфазы 9.1 в роадмапе фиксирует статус, коммиты и отклонения от спеки
- [ ] Каждый вопрос пользователю — тикет `needs-info` с фактами и вариантами
- [ ] Пользователь одобрил подфазу, одобрение записано в журнал решений

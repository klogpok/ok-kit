# 19: Harnesses for alert, avatar, badge, empty-state and progress, and the harness rule

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer reads what status components show: an alert's tone and text and its dismissal, an avatar's name and initials, a badge's text, count or dot, an empty state's title and actions, a progress bar's value or indeterminate state. The README rule says a harness is required for a component with state or behavior; divider, skeleton, spinner, icon and card are exempt.

**Blocked by:** 14 (Phase 9.3 report)

**Status:** ready-for-agent

- [ ] Five harnesses on the `UiHarness` base, one commit each, each with its own spec
- [ ] Exported from the testing entry point; README table and CHANGELOG updated
- [ ] The README harness rule is reworded with the exempt list

## Русский перевод

# 19: Harnesses для alert, avatar, badge, empty-state и progress и правило harnesses

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения читает то, что показывают статусные компоненты: тон и текст alert и его закрытие, имя и инициалы avatar, текст, счётчик или точку badge, заголовок и действия empty-state, значение или неопределённое состояние progress bar. Правило README говорит, что harness обязателен для компонента с состоянием или поведением; divider, skeleton, spinner, icon и card освобождены.

**Заблокировано:** 14 (Отчёт подфазы 9.3)

**Статус:** ready-for-agent

- [ ] Пять harnesses на базе `UiHarness`, по коммиту на каждый, у каждого свой спек
- [ ] Экспортируются из entry point testing; таблица README и CHANGELOG обновлены
- [ ] Правило harnesses в README переформулировано со списком исключений

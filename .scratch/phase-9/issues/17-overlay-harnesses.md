# 17: Harnesses for menu, popover, tooltip and toast

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer tests overlays without knowing about the overlay container: open a menu and trigger, check or select its items; open and close a popover and reach its content; show a tooltip and read its text; read a toast's message, press its action and dismiss it.

**Blocked by:** 14 (Phase 9.3 report)

**Status:** ready-for-agent

- [ ] Four harnesses on the `UiHarness` base, one commit each, each with its own spec
- [ ] Overlay content is looked up from the document root
- [ ] Exported from the testing entry point; README table and CHANGELOG updated

## Русский перевод

# 17: Harnesses для menu, popover, tooltip и toast

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения тестирует оверлеи, не зная о контейнере оверлея: открывает меню и вызывает, отмечает или выбирает его пункты; открывает и закрывает popover и добирается до его содержимого; показывает подсказку и читает её текст; читает сообщение toast, нажимает его действие и закрывает его.

**Заблокировано:** 14 (Отчёт подфазы 9.3)

**Статус:** ready-for-agent

- [ ] Четыре harness на базе `UiHarness`, по коммиту на каждый, у каждого свой спек
- [ ] Содержимое оверлеев ищется от корня документа
- [ ] Экспортируются из entry point testing; таблица README и CHANGELOG обновлены

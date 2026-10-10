# 16: Harnesses for accordion, tabs, breadcrumbs and pagination

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer tests navigation without querying the kit's DOM: expand and collapse accordion items and read their state, read and select tabs, read breadcrumb items including the collapsed ones and the current page, read the current page and page size of a paginator and move between pages.

**Blocked by:** 14 (Phase 9.3 report)

**Status:** ready-for-agent

- [ ] Four harnesses on the `UiHarness` base, one commit each, each with its own spec
- [ ] Filters by visible text where the component has it
- [ ] Exported from the testing entry point; README table and CHANGELOG updated

## Русский перевод

# 16: Harnesses для accordion, tabs, breadcrumbs и pagination

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения тестирует навигацию, не лазая в DOM кита: раскрывает и сворачивает пункты accordion и читает их состояние, читает и выбирает вкладки, читает пункты breadcrumbs, включая свёрнутые и текущую страницу, читает текущую страницу и размер страницы пагинатора и переходит между страницами.

**Заблокировано:** 14 (Отчёт подфазы 9.3)

**Статус:** ready-for-agent

- [ ] Четыре harness на базе `UiHarness`, по коммиту на каждый, у каждого свой спек
- [ ] Фильтры по видимому тексту там, где он есть у компонента
- [ ] Экспортируются из entry point testing; таблица README и CHANGELOG обновлены

# 02: Pagination defaults provider

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer sets the default page size, page size options, sibling count and first/last buttons for every paginator once with `provideUiPagination(...)`. A paginator without its own input uses those defaults; an input bound on one paginator still wins. Without the provider nothing changes.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `provideUiPagination` is exported from the pagination entry point and takes partial defaults over the built-in ones
- [ ] A spec shows that the provider changes each default and that a bound input overrides it, including the two-way page size
- [ ] README (pagination section) and CHANGELOG mention the provider

## Русский перевод

# 02: Defaults-провайдер pagination

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения один раз задаёт для всех пагинаторов размер страницы, варианты размера, число соседних страниц и кнопки первая/последняя через `provideUiPagination(...)`. Пагинатор без своего входа берёт эти умолчания; вход, привязанный к одному пагинатору, всё равно сильнее. Без провайдера ничего не меняется.

**Заблокировано:** Нет (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] `provideUiPagination` экспортируется из entry point pagination и принимает частичные умолчания поверх встроенных
- [ ] Спек показывает, что провайдер меняет каждое умолчание, а привязанный вход его перекрывает, включая двустороннюю привязку размера страницы
- [ ] README (раздел pagination) и CHANGELOG упоминают провайдер

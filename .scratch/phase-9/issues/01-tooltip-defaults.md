# 01: Tooltip defaults provider

**Spec:** [../spec.md](../spec.md)

**What to build:** an app developer sets the default tooltip position, show delay and hide delay once with `provideUiTooltip(...)`, in the same shape as `provideUiDialog`. Every tooltip without its own input uses those defaults; an input bound on one tooltip still wins. Without the provider nothing changes.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `provideUiTooltip` is exported from the tooltip entry point and takes partial defaults over the built-in ones
- [ ] A spec shows that the provider changes the default and that a bound input overrides it
- [ ] README (tooltip section) and CHANGELOG mention the provider

## Русский перевод

# 01: Defaults-провайдер tooltip

**Спека:** [../spec.md](../spec.md)

**Что сделать:** разработчик приложения один раз задаёт позицию подсказки, задержку показа и скрытия через `provideUiTooltip(...)`, в той же форме, что `provideUiDialog`. Каждая подсказка без своего входа берёт эти умолчания; вход, привязанный к одной подсказке, всё равно сильнее. Без провайдера ничего не меняется.

**Заблокировано:** Нет (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] `provideUiTooltip` экспортируется из entry point tooltip и принимает частичные умолчания поверх встроенных
- [ ] Спек показывает, что провайдер меняет умолчание, а привязанный вход его перекрывает
- [ ] README (раздел tooltip) и CHANGELOG упоминают провайдер

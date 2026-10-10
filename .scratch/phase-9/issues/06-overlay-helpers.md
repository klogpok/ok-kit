# 06: Shared overlay presets and direction sync in core

**Spec:** [../spec.md](../spec.md)

**What to build:** overlay positioning is defined once. Core holds the dropdown position presets, the four sides with their opposites, and one function that syncs an overlay's direction from its host. Select, time input, datepicker, date-range-picker, tooltip and popover use them and open exactly where they open today. Escape handling, the connected overlay template bindings and the menu's own preset map stay as they are.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] No position preset is defined twice across the six components
- [ ] Every direction sync goes through the shared function
- [ ] The specs of the six components pass, and visual baselines (including the open-state play stories) do not change

## Русский перевод

# 06: Общие пресеты оверлеев и синхронизация направления в core

**Спека:** [../spec.md](../spec.md)

**Что сделать:** позиционирование оверлеев описано один раз. В core лежат пресеты позиций dropdown, четыре стороны с противоположными и одна функция, синхронизирующая направление оверлея с хостом. Select, time input, datepicker, date-range-picker, tooltip и popover используют их и открываются ровно там же, где сейчас. Обработка Escape, привязки шаблона connected overlay и собственная карта пресетов menu остаются как есть.

**Заблокировано:** Нет (можно начинать сразу)

**Статус:** ready-for-agent

- [ ] Ни один пресет позиций не определён дважды в шести компонентах
- [ ] Каждая синхронизация направления идёт через общую функцию
- [ ] Спеки шести компонентов проходят, визуальные снимки (включая play-stories открытых состояний) не меняются

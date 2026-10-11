# 05: select, multi-select and autocomplete on the listbox

**Status:** ready-for-agent
**Blocked by:** 04

`select`, `multi-select` and `autocomplete` extend `UiFormControlBase` directly and use the listbox
controller. `UiOptionPanel` and `select-base.ts` keyboard code go away; chips, select all and
clearable stay in `select`. `select/public-api.ts` drops `ɵUiOptionPanel`, `ɵUiOptionParent` and
`ɵUiItemOption`.

- [ ] Existing specs of select, multi-select, autocomplete, `form-field/forms-interop.spec.ts` and
  the harness specs stay green; adapt only tests that reach into removed internals.
- [ ] The decisions in `DECISIONS.md` hold: a click opens without an active option, a selected
  value stays inactive on a click, multi-select options keep the plain text color.
- [ ] Visual baselines unchanged except the class rename, if it shows.
- [ ] Commits per field: `refactor(select): ...`, `refactor(autocomplete): ...`.

## Русский перевод

# 05: select, multi-select и autocomplete на listbox

**Статус:** ready-for-agent
**Зависит от:** 04

`select`, `multi-select` и `autocomplete` наследуют `UiFormControlBase` напрямую и используют
контроллер listbox. `UiOptionPanel` и код клавиатуры в `select-base.ts` уходят; чипсы, «выбрать
все» и clearable остаются в `select`. `select/public-api.ts` убирает `ɵUiOptionPanel`,
`ɵUiOptionParent` и `ɵUiItemOption`.

- [ ] Существующие spec select, multi-select, autocomplete, `form-field/forms-interop.spec.ts` и
  spec harness'ов зелёные; правятся только тесты, которые лезут в удалённые внутренности.
- [ ] Решения из `DECISIONS.md` сохраняются: клик открывает без active option, выбранное значение
  неактивно при клике, опции multi-select сохраняют обычный цвет текста.
- [ ] Визуальные снимки не меняются, кроме переименования класса, если оно видно.
- [ ] Коммиты по полю: `refactor(select): ...`, `refactor(autocomplete): ...`.

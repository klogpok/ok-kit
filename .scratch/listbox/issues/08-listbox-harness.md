# 08: one internal listbox harness

**Status:** ready-for-agent
**Blocked by:** 05, 06

`select-harness.ts`, `autocomplete-harness.ts` and the time harness each find the panel through
`aria-controls` + `documentRootLocatorFactory()` and read the options with near-identical code.
Extract an internal harness of the popup listbox (find the open panel, `getOptions`, select an
option, read the active option) in `projects/ui-kit/testing/`, and build the three on it. Prefer
roles and ARIA over BEM classes where the markup allows.

- [ ] Public interface of the three harnesses unchanged; their specs green unchanged.
- [ ] Commit `refactor(testing): select, autocomplete and time harnesses share a listbox harness`.

## Русский перевод

# 08: один внутренний listbox-harness

**Статус:** ready-for-agent
**Зависит от:** 05, 06

`select-harness.ts`, `autocomplete-harness.ts` и harness time каждый находят панель через
`aria-controls` + `documentRootLocatorFactory()` и читают опции почти одинаковым кодом. Выделить
внутренний harness popup listbox (найти открытую панель, `getOptions`, выбрать опцию, прочитать
active option) в `projects/ui-kit/testing/` и построить три harness'а на нём. Где разметка
позволяет, опираться на роли и ARIA, а не на BEM-классы.

- [ ] Публичный интерфейс трёх harness'ов не меняется; их spec зелёные без изменений.
- [ ] Коммит `refactor(testing): select, autocomplete and time harnesses share a listbox harness`.

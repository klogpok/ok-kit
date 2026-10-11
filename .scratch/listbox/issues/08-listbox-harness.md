# 08: one internal listbox harness

**Status:** done
**Blocked by:** 05, 06

`select-harness.ts`, `autocomplete-harness.ts` and the time harness each find the panel through
`aria-controls` + `documentRootLocatorFactory()` and read the options with near-identical code.
Extract an internal harness of the popup listbox (find the open panel, `getOptions`, select an
option, read the active option) in `projects/ui-kit/testing/`, and build the three on it. Prefer
roles and ARIA over BEM classes where the markup allows.

- [x] Public interface of the three harnesses unchanged; their specs green unchanged.
- [x] Commit `refactor(testing): select, autocomplete and time harnesses share a listbox harness`.

## Comments

**2026-10-11 - done.** Commit `refactor(testing): select, autocomplete and time harnesses share a listbox harness`.

- New internal `testing/listbox-harness.ts` (not in `public-api.ts`): `UiListboxHarness`
  (`[role="listbox"]`, its visible options) and `UiPopupListbox`, built from the field's control and
  the document root: `panel()` by `aria-controls` (`[id="…"]`), `getOptions()` (`[]` while closed,
  skips `[hidden]`), `getActiveOption()` by `aria-activedescendant`, `clickOptions(filters, { all, noun })`.
- `UiOptionHarness` and `UiOptionHarnessFilters` moved there; `select-harness.ts` re-exports them, so
  the public API is unchanged. `UiOptionHarness.isActive()` now reads `aria-activedescendant` instead
  of the `ui-option--active` class.
- Kept: time `getOptions()` opens the list, "No time matches", multi-select clicks every match. Time
  options now also skip `[hidden]` (none are hidden).
- The three harness specs are unchanged; `listbox-harness.spec.ts` covers the internal harness (3 tests).
  Full suite 963 green, lint and format clean.

## Русский перевод

# 08: один внутренний listbox-harness

**Статус:** сделано
**Зависит от:** 05, 06

`select-harness.ts`, `autocomplete-harness.ts` и harness time каждый находят панель через
`aria-controls` + `documentRootLocatorFactory()` и читают опции почти одинаковым кодом. Выделить
внутренний harness popup listbox (найти открытую панель, `getOptions`, выбрать опцию, прочитать
active option) в `projects/ui-kit/testing/` и построить три harness'а на нём. Где разметка
позволяет, опираться на роли и ARIA, а не на BEM-классы.

- [x] Публичный интерфейс трёх harness'ов не меняется; их spec зелёные без изменений.
- [x] Коммит `refactor(testing): select, autocomplete and time harnesses share a listbox harness`.

## Комментарии

**2026-10-11 - сделано.** Коммит `refactor(testing): select, autocomplete and time harnesses share a listbox harness`.

- Новый внутренний `testing/listbox-harness.ts` (не в `public-api.ts`): `UiListboxHarness`
  (`[role="listbox"]`, его видимые опции) и `UiPopupListbox`, который строится от control поля и
  корня документа: `panel()` по `aria-controls` (`[id="…"]`), `getOptions()` (`[]` пока закрыт,
  пропускает `[hidden]`), `getActiveOption()` по `aria-activedescendant`, `clickOptions(filters, { all, noun })`.
- `UiOptionHarness` и `UiOptionHarnessFilters` переехали туда; `select-harness.ts` их реэкспортирует,
  публичный API не изменился. `UiOptionHarness.isActive()` теперь читает `aria-activedescendant`, а не
  класс `ui-option--active`.
- Сохранено: `getOptions()` у time открывает список, "No time matches", multi-select кликает все
  совпадения. Опции time теперь тоже пропускают `[hidden]` (скрытых там нет).
- Spec трёх harness'ов не менялись; `listbox-harness.spec.ts` покрывает внутренний harness (3 теста).
  Весь набор 963 зелёный, lint и format чистые.

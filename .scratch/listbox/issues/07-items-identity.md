# 07: the active option survives a new items array with the same values

**Status:** done
**Blocked by:** 05

Today `itemEntries` is rebuilt from every new `items` array; the effect sees the active entry gone,
calls `setActiveItem(-1)` and, on an open list, `setFirstItemActive()`. A consumer that passes a
recomputed array with the same data (`computed` + `map`) sees the active option and the scroll jump
to the top. `option-items.spec.ts:343` covers only a real replacement.

- [x] Red test: open list, ArrowDown twice, emit a new array with the same values → the same option
  stays active.
- [x] The listbox reuses entries matched by value through `compareWith`; only a vanished value
  resets the active option (the existing test stays green).
- [x] Commit `fix(listbox): keep the active option when items are recomputed`.

## Comments

**2026-10-11 - done.** Commit `fix(listbox): keep the active option when items are recomputed`.
`itemEntries` in `listbox/listbox.ts` is a `linkedSignal`: an item takes the first unused previous
entry with the same value (`compareWith`), so the n-th of repeated values keeps the n-th entry. A
reused entry gets the new item (`UiItemEntry.item` reads a signal), so its label, description and
disabled state follow. The existing test is renamed "keeps the active option when the items are
replaced by copies": it never dropped the option (value 1 stays). New tests: recomputed values,
new label and state of a kept option, repeated values, a vanished value.

## Русский перевод

# 07: active option переживает новый массив items с теми же значениями

**Статус:** сделано
**Зависит от:** 05

Сейчас `itemEntries` пересобирается на каждый новый массив `items`; effect видит, что active entry
пропал, вызывает `setActiveItem(-1)` и на открытом списке `setFirstItemActive()`. У потребителя,
который передаёт пересчитанный массив с теми же данными (`computed` + `map`), active option и
прокрутка прыгают наверх. `option-items.spec.ts:343` покрывает только реальную замену.

- [x] Красный тест: открытый список, дважды ArrowDown, новый массив с теми же значениями → активной
  остаётся та же опция.
- [x] Listbox переиспользует записи, сопоставленные по значению через `compareWith`; только
  исчезнувшее значение сбрасывает active option (существующий тест остаётся зелёным).
- [x] Коммит `fix(listbox): keep the active option when items are recomputed`.

## Комментарии

**2026-10-11 - сделано.** Коммит `fix(listbox): keep the active option when items are recomputed`.
`itemEntries` в `listbox/listbox.ts` стал `linkedSignal`: item берёт первую неиспользованную
прежнюю запись с тем же значением (`compareWith`), поэтому n-е из повторяющихся значений сохраняет
n-ю запись. Переиспользованная запись получает новый item (`UiItemEntry.item` читает signal), так
что label, description и disabled обновляются. Существующий тест переименован в "keeps the active
option when the items are replaced by copies": опцию он никогда не сбрасывал (значение 1 остаётся).
Новые тесты: пересчитанные значения, новый label и состояние сохранённой опции, повторяющиеся
значения, исчезнувшее значение.

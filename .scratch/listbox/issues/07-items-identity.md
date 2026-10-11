# 07: the active option survives a new items array with the same values

**Status:** ready-for-agent
**Blocked by:** 05

Today `itemEntries` is rebuilt from every new `items` array; the effect sees the active entry gone,
calls `setActiveItem(-1)` and, on an open list, `setFirstItemActive()`. A consumer that passes a
recomputed array with the same data (`computed` + `map`) sees the active option and the scroll jump
to the top. `option-items.spec.ts:343` covers only a real replacement.

- [ ] Red test: open list, ArrowDown twice, emit a new array with the same values → the same option
  stays active.
- [ ] The listbox reuses entries matched by value through `compareWith`; only a vanished value
  resets the active option (the existing test stays green).
- [ ] Commit `fix(listbox): keep the active option when items are recomputed`.

## Русский перевод

# 07: active option переживает новый массив items с теми же значениями

**Статус:** ready-for-agent
**Зависит от:** 05

Сейчас `itemEntries` пересобирается на каждый новый массив `items`; effect видит, что active entry
пропал, вызывает `setActiveItem(-1)` и на открытом списке `setFirstItemActive()`. У потребителя,
который передаёт пересчитанный массив с теми же данными (`computed` + `map`), active option и
прокрутка прыгают наверх. `option-items.spec.ts:343` покрывает только реальную замену.

- [ ] Красный тест: открытый список, дважды ArrowDown, новый массив с теми же значениями → активной
  остаётся та же опция.
- [ ] Listbox переиспользует записи, сопоставленные по значению через `compareWith`; только
  исчезнувшее значение сбрасывает active option (существующий тест остаётся зелёным).
- [ ] Коммит `fix(listbox): keep the active option when items are recomputed`.

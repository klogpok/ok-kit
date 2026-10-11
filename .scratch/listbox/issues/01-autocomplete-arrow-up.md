# 01: autocomplete — ArrowUp on an open list without an active option

**Status:** done

Found by reading the code, not reproduced yet. After typing, `autocomplete.ts` calls
`keyManager.setActiveItem(-1)`. On the open list ArrowUp then goes to `keyManager.onKeydown`, and
the CDK key manager without `withWrap` does not move up from index -1: the key does nothing.
`select-base.ts:181` has the workaround ("the key manager would not move up from no option");
`autocomplete.ts:270` does not. `autocomplete.spec.ts:141` tests ArrowUp only on a closed list.

- [x] Red test first: type into an autocomplete, the list opens without an active option, ArrowUp
  activates the last option (ArrowDown the first, as in `select`).
- [x] Fix in `autocomplete.ts`, commit `fix(autocomplete): ...`.
- [x] If the test is green before the fix, close the ticket as not a bug and keep the test.

## Comments

**2026-10-11 - done.** Reproduced: the new test "moves from no active option to the end the arrow
key points to" failed before the fix (ArrowUp left no active option). `onKeydown` now starts at the
last option for ArrowUp and the first for ArrowDown when the list is open without an active option.
Alt+Arrow keeps its behavior: Alt+ArrowDown opens without moving, Alt+ArrowUp closes. Commit
`fix(autocomplete): arrow keys start at the list end without an active option`.

## Русский перевод

# 01: autocomplete — ArrowUp на открытом списке без active option

**Статус:** сделано

Найдено чтением кода, ещё не воспроизведено. После ввода текста `autocomplete.ts` вызывает
`keyManager.setActiveItem(-1)`. На открытом списке ArrowUp уходит в `keyManager.onKeydown`, а key
manager CDK без `withWrap` не двигается вверх с индекса -1: клавиша ничего не делает. В
`select-base.ts:181` есть обход («the key manager would not move up from no option»), в
`autocomplete.ts:270` — нет. `autocomplete.spec.ts:141` проверяет ArrowUp только на закрытом списке.

- [x] Сначала красный тест: ввести текст в autocomplete, список открыт без active option, ArrowUp
  делает активной последнюю опцию (ArrowDown — первую, как в `select`).
- [x] Исправление в `autocomplete.ts`, коммит `fix(autocomplete): ...`.
- [x] Если тест зелёный до исправления — закрыть тикет как «не баг», тест оставить.

## Комментарии

**2026-10-11 - сделано.** Воспроизведено: новый тест «moves from no active option to the end the
arrow key points to» падал до исправления (ArrowUp не делал активной ни одну опцию). Теперь
`onKeydown` на открытом списке без active option начинает с последней опции для ArrowUp и с первой
для ArrowDown. Alt+стрелки не изменились: Alt+ArrowDown открывает без перемещения, Alt+ArrowUp
закрывает. Коммит `fix(autocomplete): arrow keys start at the list end without an active option`.

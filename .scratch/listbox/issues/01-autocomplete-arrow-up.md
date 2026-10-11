# 01: autocomplete — ArrowUp on an open list without an active option

**Status:** ready-for-agent

Found by reading the code, not reproduced yet. After typing, `autocomplete.ts` calls
`keyManager.setActiveItem(-1)`. On the open list ArrowUp then goes to `keyManager.onKeydown`, and
the CDK key manager without `withWrap` does not move up from index -1: the key does nothing.
`select-base.ts:181` has the workaround ("the key manager would not move up from no option");
`autocomplete.ts:270` does not. `autocomplete.spec.ts:141` tests ArrowUp only on a closed list.

- [ ] Red test first: type into an autocomplete, the list opens without an active option, ArrowUp
  activates the last option (ArrowDown the first, as in `select`).
- [ ] Fix in `autocomplete.ts`, commit `fix(autocomplete): ...`.
- [ ] If the test is green before the fix, close the ticket as not a bug and keep the test.

## Русский перевод

# 01: autocomplete — ArrowUp на открытом списке без active option

**Статус:** ready-for-agent

Найдено чтением кода, ещё не воспроизведено. После ввода текста `autocomplete.ts` вызывает
`keyManager.setActiveItem(-1)`. На открытом списке ArrowUp уходит в `keyManager.onKeydown`, а key
manager CDK без `withWrap` не двигается вверх с индекса -1: клавиша ничего не делает. В
`select-base.ts:181` есть обход («the key manager would not move up from no option»), в
`autocomplete.ts:270` — нет. `autocomplete.spec.ts:141` проверяет ArrowUp только на закрытом списке.

- [ ] Сначала красный тест: ввести текст в autocomplete, список открыт без active option, ArrowUp
  делает активной последнюю опцию (ArrowDown — первую, как в `select`).
- [ ] Исправление в `autocomplete.ts`, коммит `fix(autocomplete): ...`.
- [ ] Если тест зелёный до исправления — закрыть тикет как «не баг», тест оставить.

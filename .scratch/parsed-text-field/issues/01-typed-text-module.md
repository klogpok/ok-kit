# 01: `ɵinjectTypedText()` owns typed text, commit and the parse error

**Status:** done

Spec: `../spec.md` → "Implementation Decisions": config, the "same value" rule, result, error
codes.

**What to build:** a maintainer gives a parsed text field its typed text by calling one injection
function with the field's value model, a notify callback and its value rules. No field uses it yet;
this ticket builds the module test-first.

- `projects/ui-kit/core/typed-text.ts` with `ɵinjectTypedText<V, T = string, E = string>(config)`
  and its config / result types, exported from `core/public-api.ts` with the `ɵ` prefix.
- Config: `value`, `notify`, `parse`, `format`, `valid`, `equals`, optional `commitValue`.
- Result: `text()`, `error()`, `input(text)`, `commit()`, `set(value)`, `write(value)`.
- The typed text is kept only while `same(typed.value, value())`; `same` also guards every write.

- [x] `core/typed-text.spec.ts` is written first and drives the module in an injection context,
      without a component, with a string-to-number rule set.
- [x] Typing writes and notifies; typing the same value (by `equals`) does not notify.
- [x] Commit of valid text drops it and `text()` shows the format; commit of invalid text keeps it
      and `error()` returns the code; commit of blank text drops it.
- [x] `error()` is `null` before commit, even for invalid text.
- [x] With `commitValue`, a valid commit writes the settled value and notifies once.
- [x] `set()` drops typed text and its error also for the same value, and notifies only on change.
- [x] `write()` drops typed text and stores `valid(value)` without notifying.
- [x] An external write of the same value keeps the typed text; a different or unreadable value
      drops it.
- [x] The injection call reads no class field declared after it (`useDefineForClassFields: false`).
- [x] `/phase-check` passes.
- [x] One commit, `feat(core): typed text of parsed text fields`.

## Русский перевод

# 01: `ɵinjectTypedText()` владеет typed text, commit и parse error

**Статус:** сделано

Spec: `../spec.md` → «Решения по реализации»: конфиг, правило «то же значение», результат, коды
ошибок.

**Что сделать:** мейнтейнер даёт parsed text field его typed text одним вызовом injection-функции
с value model поля, callback уведомления и правилами значения. Ни одно поле его пока не использует;
этот тикет строит module через TDD.

- `projects/ui-kit/core/typed-text.ts` с `ɵinjectTypedText<V, T = string, E = string>(config)` и
  типами конфига / результата, экспорт из `core/public-api.ts` с префиксом `ɵ`.
- Конфиг: `value`, `notify`, `parse`, `format`, `valid`, `equals`, необязательный `commitValue`.
- Результат: `text()`, `error()`, `input(text)`, `commit()`, `set(value)`, `write(value)`.
- Typed text сохраняется, только пока `same(typed.value, value())`; `same` также охраняет каждую
  запись.

- [x] `core/typed-text.spec.ts` пишется первым и ведёт module в injection context, без компонента,
      с набором правил «строка → число».
- [x] Ввод пишет и уведомляет; ввод того же значения (по `equals`) не уведомляет.
- [x] Commit валидного текста сбрасывает его, и `text()` показывает формат; commit неверного текста
      сохраняет его, и `error()` возвращает код; commit пустого текста сбрасывает его.
- [x] `error()` равен `null` до commit, даже для неверного текста.
- [x] С `commitValue` валидный commit пишет итоговое значение и уведомляет один раз.
- [x] `set()` сбрасывает typed text и его ошибку и при том же значении, а уведомляет только при
      изменении.
- [x] `write()` сбрасывает typed text и сохраняет `valid(value)` без уведомления.
- [x] Внешняя запись того же значения сохраняет typed text; другое или нечитаемое значение
      сбрасывает его.
- [x] Вызов injection-функции не читает поля класса, объявленные после него
      (`useDefineForClassFields: false`).
- [x] `/phase-check` проходит.
- [x] Один коммит, `feat(core): typed text of parsed text fields`.

# 02: `ui-time-input` uses the typed text module

**Status:** done
**Blocked by:** 01

Spec: `../spec.md` → "Implementation Decisions": what stays in the fields, aligned edge cases.

**What to build:** the time input loses its `Draft`, `linkedSignal`, `parseError`, `commitDraft()`
and value writes, and passes its time rules to `ɵinjectTypedText()`.

- `parse`: today's `parse()` (the locale format and `minTime` / `maxTime`); a non-blank text
  without an allowed time gives the code `'invalid'`.
- `format`: today's `display()`; `valid`: the `"HH:mm"` check; `equals`: `===`.
- `onInput` applies the mask, then calls `input()`, then opens the list and activates the nearest
  slot, as today. `pick()` calls `set()`; `writeValue` calls `write()`; Enter without an active
  time and blur call `commit()`.
- `ownErrors()` maps the code to `labels().invalidTime`.

- [x] No `Draft` interface, draft `linkedSignal` or `commitDraft()` is left in `time-input.ts`.
- [x] The existing time-input spec and harness pass; any test that asserted an aligned edge case
      (blank commit, unreadable written value, typing over it) changes in the same commit with a
      note in the commit body.
- [x] Public inputs, outputs, methods and the rendered DOM are unchanged.
- [ ] `/phase-check` passes, visual baselines unchanged; `pnpm sync:client --verify` passes.
- [x] One commit, `refactor(time): typed text module`.

## Русский перевод

# 02: `ui-time-input` использует module typed text

**Статус:** сделано
**Заблокирован:** 01

Spec: `../spec.md` → «Решения по реализации»: что остаётся в полях, выровненные крайние случаи.

**Что сделать:** time input теряет свои `Draft`, `linkedSignal`, `parseError`, `commitDraft()` и
записи значения и передаёт свои правила времени в `ɵinjectTypedText()`.

- `parse`: нынешний `parse()` (формат локали и `minTime` / `maxTime`); непустой текст без
  допустимого времени даёт код `'invalid'`.
- `format`: нынешний `display()`; `valid`: проверка `"HH:mm"`; `equals`: `===`.
- `onInput` применяет маску, затем вызывает `input()`, затем открывает список и активирует
  ближайший слот, как сейчас. `pick()` вызывает `set()`; `writeValue` вызывает `write()`; Enter без
  активного времени и blur вызывают `commit()`.
- `ownErrors()` отображает код в `labels().invalidTime`.

- [x] В `time-input.ts` не осталось interface `Draft`, draft `linkedSignal` и `commitDraft()`.
- [x] Существующие spec и harness time input проходят; тест, проверявший выровненный крайний
      случай (commit пустого текста, нечитаемое записанное значение, ввод поверх него), меняется в
      том же коммите с пояснением в теле коммита.
- [x] Публичные inputs, outputs, методы и отрисованный DOM не изменились.
- [ ] `/phase-check` проходит, visual baselines не изменились; `pnpm sync:client --verify`
      проходит.
- [x] Один коммит, `refactor(time): typed text module`.

# 04: `ui-datepicker` uses the typed text module

**Status:** done
**Blocked by:** 01

Spec: `../spec.md` → "Implementation Decisions": what stays in the fields, aligned edge cases.

**What to build:** the datepicker loses its `Draft`, `linkedSignal`, `parseError`, `commitDraft()`
and `setValue()`, and passes its day rules to `ɵinjectTypedText()`.

- `parse`: `parseDay` in the locale, accepted by `isDayEnabled` with `min`, `max` and
  `dateFilter`; a non-blank text without an allowed day gives the code `'invalid'`.
- `format`: `formatDay` in the locale; `valid`: `validDay`; `equals`: `sameDay`.
- Calendar pick, Today and Clear call `set()`; `writeValue` calls `write()`; Enter and blur call
  `commit()`. Alt+ArrowDown, the calendar dialog and touched on focus-out stay in the field.
- `ownErrors()` maps the code to `labels().invalidDate`.

- [x] No `Draft` interface, draft `linkedSignal`, `commitDraft()` or `setValue()` is left in
      `datepicker.ts`.
- [x] The existing datepicker spec and harness pass; any test that asserted blank commit changes in
      the same commit with a note in the commit body.
- [x] Public inputs, outputs, methods and the rendered DOM are unchanged.
- [ ] `/phase-check` passes, visual baselines unchanged; `pnpm sync:client --verify` passes.
- [x] One commit, `refactor(datepicker): typed text module in the datepicker`.

## Русский перевод

# 04: `ui-datepicker` использует module typed text

**Статус:** сделано
**Заблокирован:** 01

Spec: `../spec.md` → «Решения по реализации»: что остаётся в полях, выровненные крайние случаи.

**Что сделать:** datepicker теряет свои `Draft`, `linkedSignal`, `parseError`, `commitDraft()` и
`setValue()` и передаёт свои правила дня в `ɵinjectTypedText()`.

- `parse`: `parseDay` по локали, принятый `isDayEnabled` с `min`, `max` и `dateFilter`; непустой
  текст без допустимого дня даёт код `'invalid'`.
- `format`: `formatDay` по локали; `valid`: `validDay`; `equals`: `sameDay`.
- Выбор в календаре, Today и Clear вызывают `set()`; `writeValue` вызывает `write()`; Enter и blur
  вызывают `commit()`. Alt+ArrowDown, calendar dialog и touched на focus-out остаются в поле.
- `ownErrors()` отображает код в `labels().invalidDate`.

- [x] В `datepicker.ts` не осталось interface `Draft`, draft `linkedSignal`, `commitDraft()` и
      `setValue()`.
- [x] Существующие spec и harness datepicker проходят; тест, проверявший commit пустого текста,
      меняется в том же коммите с пояснением в теле коммита.
- [x] Публичные inputs, outputs, методы и отрисованный DOM не изменились.
- [ ] `/phase-check` проходит, visual baselines не изменились; `pnpm sync:client --verify`
      проходит.
- [x] Один коммит, `refactor(datepicker): typed text module in the datepicker`.

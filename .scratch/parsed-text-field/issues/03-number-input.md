# 03: `ui-number-input` uses the typed text module

**Status:** done
**Blocked by:** 01

Spec: `../spec.md` → "Implementation Decisions": `commitValue`, out-of-range values stay different.

**What to build:** the number input loses its `Draft`, `linkedSignal`, `parseError`,
`commitDraft()` and `setValue()`, and passes its number rules to `ɵinjectTypedText()`.

- `parse`: `parseNumber` in the `locale` label; `NaN` gives the code `'invalid'`, blank text gives
  no value and no error.
- `format`: today's `formatted()`; `valid`: `validNumber`; `equals`: `===`.
- `commitValue`: round to `maxFractionDigits`, then clamp to `min` / `max` (today's commit).
- Steps, Home/End and the stepper buttons call `set()`; `writeValue` calls `write()`; Enter and
  blur call `commit()`. Repeat timers and touched stay in the field.
- `ownErrors()` maps the code to `labels().invalidNumber`.

- [x] No `Draft` interface, draft `linkedSignal`, `commitDraft()` or `setValue()` is left in
      `number-input.ts`.
- [x] Clamping and rounding on commit work as today and notify once.
- [x] The existing number-input spec and harness pass without edits.
- [x] Public inputs, outputs, methods and the rendered DOM are unchanged.
- [ ] `/phase-check` passes, visual baselines unchanged; `pnpm sync:client --verify` passes.
- [x] One commit, `refactor(number-input): typed text module`.

## Русский перевод

# 03: `ui-number-input` использует module typed text

**Статус:** сделано
**Заблокирован:** 01

Spec: `../spec.md` → «Решения по реализации»: `commitValue`, значения вне границ остаются разными.

**Что сделать:** number input теряет свои `Draft`, `linkedSignal`, `parseError`, `commitDraft()` и
`setValue()` и передаёт свои правила числа в `ɵinjectTypedText()`.

- `parse`: `parseNumber` по label `locale`; `NaN` даёт код `'invalid'`, пустой текст — ни значения,
  ни ошибки.
- `format`: нынешний `formatted()`; `valid`: `validNumber`; `equals`: `===`.
- `commitValue`: округление до `maxFractionDigits`, затем clamp к `min` / `max` (нынешний commit).
- Шаги, Home/End и кнопки stepper вызывают `set()`; `writeValue` вызывает `write()`; Enter и blur
  вызывают `commit()`. Таймеры повтора и touched остаются в поле.
- `ownErrors()` отображает код в `labels().invalidNumber`.

- [x] В `number-input.ts` не осталось interface `Draft`, draft `linkedSignal`, `commitDraft()` и
      `setValue()`.
- [x] Clamp и округление при commit работают как сейчас и уведомляют один раз.
- [x] Существующие spec и harness number input проходят без правок.
- [x] Публичные inputs, outputs, методы и отрисованный DOM не изменились.
- [ ] `/phase-check` проходит, visual baselines не изменились; `pnpm sync:client --verify`
      проходит.
- [x] Один коммит, `refactor(number-input): typed text module`.

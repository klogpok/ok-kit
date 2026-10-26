# 02: `ui-datepicker` extends the calendar dialog field base

**Status:** done
**Blocked by:** 01

Spec: `../spec.md` → "Implementation Decisions": what stays in the fields.

**What to build:** `UiDatepicker` extends `ɵUiCalendarDialogField<Date | null>` instead of
`UiFormControlBase<Date | null>` and drops every member the base now owns.

- `classPrefix()` returns `'ui-datepicker'`; `typedText` is its existing typed text module, now
  `protected` instead of `private`.
- Stays in the field: the template, `min` / `max`, `name`, `labelStrategy`, `controlId` (`-input`),
  `focus()`, the value model, `writeValue()`, `ownErrors()`, the typed text config, `day`,
  `todayAllowed`, `onPick()`, `onToday()`, `onClear()`, `onInput()` and its two providers.
- The template keeps its `#toggleButton` and `#panel`, and calls the base's `onBlur()`,
  `onInputKeydown()`, `toggle()`, `onAttach()` and `close()`.

- [x] No member owned by the base is left in `datepicker.ts`.
- [x] The existing datepicker spec and harness pass without edits.
- [x] Public inputs, outputs, methods and the rendered DOM and classes are unchanged.
- [ ] `/phase-check` passes, visual baselines unchanged.
- [x] One commit, `refactor(datepicker): datepicker on the calendar dialog field base`.

## Русский перевод

# 02: `ui-datepicker` расширяет базу calendar dialog field

**Статус:** сделано
**Заблокирован:** 01

Spec: `../spec.md` → «Решения по реализации»: что остаётся в полях.

**Что сделать:** `UiDatepicker` расширяет `ɵUiCalendarDialogField<Date | null>` вместо
`UiFormControlBase<Date | null>` и убирает все члены, которыми теперь владеет база.

- `classPrefix()` возвращает `'ui-datepicker'`; `typedText` — его существующий module typed text, теперь
  `protected`, а не `private`.
- В поле остаются: шаблон, `min` / `max`, `name`, `labelStrategy`, `controlId` (`-input`),
  `focus()`, value model, `writeValue()`, `ownErrors()`, конфиг typed text, `day`, `todayAllowed`,
  `onPick()`, `onToday()`, `onClear()`, `onInput()` и его две строки providers.
- Шаблон сохраняет `#toggleButton` и `#panel` и вызывает `onBlur()`, `onInputKeydown()`,
  `toggle()`, `onAttach()` и `close()` базы.

- [x] В `datepicker.ts` не осталось членов, которыми владеет база.
- [x] Существующие spec и harness datepicker проходят без правок.
- [x] Публичные inputs, outputs, методы, отрисованный DOM и классы не изменились.
- [ ] `/phase-check` проходит, visual baselines не изменились.
- [x] Один коммит, `refactor(datepicker): datepicker on the calendar dialog field base`.

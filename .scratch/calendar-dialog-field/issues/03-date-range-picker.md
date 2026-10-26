# 03: `ui-date-range-picker` extends the calendar dialog field base

**Status:** done
**Blocked by:** 01

Spec: `../spec.md` → "Implementation Decisions": what stays in the fields, limits keep their
names.

**What to build:** `UiDateRangePicker` extends `ɵUiCalendarDialogField<UiDateRange | null>`
instead of `UiFormControlBase<UiDateRange | null>` and drops every member the base now owns.

- `classPrefix()` returns `'ui-date-range-picker'`; `typedText` is its existing typed text module, now
  `protected` instead of `private`.
- Stays in the field: the template, `minDate` / `maxDate` (not renamed, no `min` / `max` added),
  `presets`, `labelStrategy`, `controlId` (`-start`), `focus()`, the value model, `writeValue()`,
  `ownErrors()`, the typed text config, the two months, the group role and its labels,
  `invalidState()`, `onRangePick()`, `onPreset()`, `onClear()`, `onInput()` and its two
  providers. Its own host bindings (`role`, `aria-labelledby`, `aria-disabled`) stay next to the
  base's.
- The template keeps its `#toggleButton` and `#panel`, and calls the base's `onBlur()`,
  `onInputKeydown()`, `toggle()`, `onAttach()` and `close()`.

- [x] No member owned by the base is left in `date-range-picker.ts`.
- [x] The existing date range picker spec and harness pass without edits.
- [x] Public inputs, outputs, methods and the rendered DOM and classes are unchanged.
- [x] `/phase-check` passes, visual baselines unchanged. (2026-10-26: see ticket 01.)
- [x] One commit, `refactor(datepicker): range picker on the calendar dialog field base`.

## Русский перевод

# 03: `ui-date-range-picker` расширяет базу calendar dialog field

**Статус:** сделано
**Заблокирован:** 01

Spec: `../spec.md` → «Решения по реализации»: что остаётся в полях, пределы сохраняют имена.

**Что сделать:** `UiDateRangePicker` расширяет `ɵUiCalendarDialogField<UiDateRange | null>` вместо
`UiFormControlBase<UiDateRange | null>` и убирает все члены, которыми теперь владеет база.

- `classPrefix()` возвращает `'ui-date-range-picker'`; `typedText` — его существующий module typed
  text, теперь `protected`, а не `private`.
- В поле остаются: шаблон, `minDate` / `maxDate` (не переименовываются, `min` / `max` не
  добавляются), `presets`, `labelStrategy`, `controlId` (`-start`), `focus()`, value model,
  `writeValue()`, `ownErrors()`, конфиг typed text, два месяца, роль group и её подписи,
  `invalidState()`, `onRangePick()`, `onPreset()`, `onClear()`, `onInput()` и его две строки
  providers. Его собственные host bindings (`role`, `aria-labelledby`, `aria-disabled`) остаются
  рядом с bindings базы.
- Шаблон сохраняет `#toggleButton` и `#panel` и вызывает `onBlur()`, `onInputKeydown()`,
  `toggle()`, `onAttach()` и `close()` базы.

- [x] В `date-range-picker.ts` не осталось членов, которыми владеет база.
- [x] Существующие spec и harness date range picker проходят без правок.
- [x] Публичные inputs, outputs, методы, отрисованный DOM и классы не изменились.
- [x] `/phase-check` проходит, visual baselines не изменились. (2026-10-26: см. тикет 01.)
- [x] Один коммит, `refactor(datepicker): range picker on the calendar dialog field base`.

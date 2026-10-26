# 01: `ɵUiCalendarDialogField` owns the calendar dialog of a date field

**Status:** done
**Blocked by:** None (can start immediately)

Spec: `../spec.md` → "Implementation Decisions": what the field gives the base, what moves to it.

**What to build:** the abstract base class `UiCalendarDialogField<V>` in
`datepicker/calendar-dialog-field.ts`, exported from `@vplans/ui-kit/datepicker` as
`ɵUiCalendarDialogField`, with its own spec. The two pickers move onto it in tickets 02 and 03.

- An abstract `@Directive` extending `UiFormControlBase<V>`, implementing `UiFormFieldControl`.
- Abstract `classPrefix()` and `typedText` (`Pick<ɵUiTypedText<…>, 'commit'>`); the template
  contract (`#toggleButton`, `#panel`, one `ui-calendar`) documented on the class.
- The open state, `open()` / `close()` / `toggle()`, `onAttach()`, `onInputKeydown()`, `onBlur()`,
  `onFocusOut()`, `panelId`, `positions`, `calendarIcon`, the three queries; the inputs
  `dateFilter`, `startAt`, `placeholder`, `size`, `id`, `aria-label`; the outputs `opened` /
  `closed`; `labels`, the locale, `hint` and `inputMode`; the shared host bindings — copied from
  today's pickers with no change of behavior.
- README: the `datepicker` row of the entry point table lists `ɵUiCalendarDialogField` as
  internal, and "Adding a component" says that a calendar dialog field extends it, next to the
  popup listbox field paragraph.

- [x] `ɵUiCalendarDialogField` is exported from `@vplans/ui-kit/datepicker` and no field
      initializer of it reads a field of a subclass.
- [x] `datepicker/calendar-dialog-field.spec.ts` drives a minimal test field and covers every case
      listed in the spec under "Testing Decisions".
- [x] README updated as above.
- [ ] `/phase-check` passes, visual baselines unchanged.
- [ ] One commit, `refactor(datepicker): calendar dialog field base`.

## Русский перевод

# 01: `ɵUiCalendarDialogField` владеет calendar dialog поля даты

**Статус:** сделано
**Заблокирован:** нет (можно начинать сразу)

Spec: `../spec.md` → «Решения по реализации»: что поле даёт базе, что в неё переезжает.

**Что сделать:** абстрактный базовый класс `UiCalendarDialogField<V>` в
`datepicker/calendar-dialog-field.ts`, экспорт из `@vplans/ui-kit/datepicker` как
`ɵUiCalendarDialogField`, со своим spec. Оба picker переходят на него в тикетах 02 и 03.

- Абстрактный `@Directive`, расширяющий `UiFormControlBase<V>` и реализующий `UiFormFieldControl`.
- Абстрактные `classPrefix()` и `typedText` (`Pick<ɵUiTypedText<…>, 'commit'>`); шаблонный контракт
  (`#toggleButton`, `#panel`, один `ui-calendar`) описан на классе.
- Состояние открытия, `open()` / `close()` / `toggle()`, `onAttach()`, `onInputKeydown()`,
  `onBlur()`, `onFocusOut()`, `panelId`, `positions`, `calendarIcon`, три запроса; inputs
  `dateFilter`, `startAt`, `placeholder`, `size`, `id`, `aria-label`; outputs `opened` / `closed`;
  `labels`, локаль, `hint` и `inputMode`; общие host bindings — перенесены из нынешних pickers без
  изменения поведения.
- README: строка `datepicker` в таблице entry points называет `ɵUiCalendarDialogField` внутренним,
  а «Adding a component» говорит, что calendar dialog field расширяет его, рядом с абзацем о popup
  listbox field.

- [x] `ɵUiCalendarDialogField` экспортирован из `@vplans/ui-kit/datepicker`, и ни один его field
      initializer не читает поле подкласса.
- [x] `datepicker/calendar-dialog-field.spec.ts` ведёт минимальное тестовое поле и покрывает
      каждый случай из раздела spec «Решения по тестированию».
- [x] README обновлён, как описано выше.
- [ ] `/phase-check` проходит, visual baselines не изменились.
- [ ] Один коммит, `refactor(datepicker): calendar dialog field base`.

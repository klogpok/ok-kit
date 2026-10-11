# 03: datepicker and date range picker on the dropdown panel

**Status:** done
**Blocked by:** 02

`datepicker.ts` and `date-range-picker.ts` drop their own `cdkConnectedOverlay` template,
`positions`, `panelOffsetX`, `onAttach`, `onOutsideClick` and the ~10 lines of focus return in
`close()`, and use `uiDropdownPanel` with `returnFocusTo` = the toggle button. `notifyTouched`
stays in the field.

- [x] Both pickers on `uiDropdownPanel`; existing specs and harness specs stay green unchanged.
- [x] Visual baselines unchanged; check RTL in the Storybook manager (see `overlays.md`).
- [x] Commit `refactor(datepicker): open the calendar in the dropdown panel`.

## Comments

**2026-10-11 - done.** Both pickers use `<ng-template [uiDropdownPanel]="origin">` with
`UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK`, `[matchWidth]="false"`, `returnFocusTo` = the toggle
button and `(attached)` for the calendar focus; `close()` keeps `notifyTouched()`. The view
query is named `toggleElement`: the template reference `#toggleButton` would shadow a member of
that name. Specs and harness specs unchanged and green; visual baselines unchanged (none opens a
picker panel). Browser check in the built Storybook manager with a page scrollbar (Edge, scrollbars
shown): in RTL the overlay container starts after the 15 px scrollbar and the pane's start edge
meets the field's start edge; LTR the same; Escape returns focus to the toggle. Commit
`refactor(datepicker): open the calendar in the dropdown panel`.

## Русский перевод

# 03: datepicker и date range picker на dropdown panel

**Статус:** сделано
**Зависит от:** 02

`datepicker.ts` и `date-range-picker.ts` убирают свой шаблон `cdkConnectedOverlay`, `positions`,
`panelOffsetX`, `onAttach`, `onOutsideClick` и ~10 строк возврата фокуса в `close()` и используют
`uiDropdownPanel` с `returnFocusTo` = кнопка-переключатель. `notifyTouched` остаётся в поле.

- [x] Оба пикера на `uiDropdownPanel`; существующие spec и spec harness'ов зелёные без изменений.
- [x] Визуальные снимки не меняются; RTL проверить в Storybook manager (см. `overlays.md`).
- [x] Коммит `refactor(datepicker): open the calendar in the dropdown panel`.

## Комментарии

**2026-10-11 - сделано.** Оба пикера используют `<ng-template [uiDropdownPanel]="origin">` с
`UI_DROPDOWN_POSITIONS_WITH_END_FALLBACK`, `[matchWidth]="false"`, `returnFocusTo` = кнопка-переключатель и
`(attached)` для фокуса календаря; `close()` оставляет `notifyTouched()`. View
query назван `toggleElement`: template reference `#toggleButton` перекрыл бы член с таким
именем. Spec и spec harness'ов без изменений и зелёные; визуальные снимки не изменились (ни один не
открывает панель пикера). Проверка в собранном Storybook manager со скроллбаром страницы (Edge,
скроллбары видимы): в RTL overlay container начинается после скроллбара 15 px, начальный край
панели совпадает с начальным краем поля; в LTR так же; Escape возвращает фокус на кнопку. Коммит
`refactor(datepicker): open the calendar in the dropdown panel`.

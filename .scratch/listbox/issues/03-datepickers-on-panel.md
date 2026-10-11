# 03: datepicker and date range picker on the dropdown panel

**Status:** ready-for-agent
**Blocked by:** 02

`datepicker.ts` and `date-range-picker.ts` drop their own `cdkConnectedOverlay` template,
`positions`, `panelOffsetX`, `onAttach`, `onOutsideClick` and the ~10 lines of focus return in
`close()`, and use `uiDropdownPanel` with `returnFocusTo` = the toggle button. `notifyTouched`
stays in the field.

- [ ] Both pickers on `uiDropdownPanel`; existing specs and harness specs stay green unchanged.
- [ ] Visual baselines unchanged; check RTL in the Storybook manager (see `overlays.md`).
- [ ] Commit `refactor(datepicker): open the calendar in the dropdown panel`.

## Русский перевод

# 03: datepicker и date range picker на dropdown panel

**Статус:** ready-for-agent
**Зависит от:** 02

`datepicker.ts` и `date-range-picker.ts` убирают свой шаблон `cdkConnectedOverlay`, `positions`,
`panelOffsetX`, `onAttach`, `onOutsideClick` и ~10 строк возврата фокуса в `close()` и используют
`uiDropdownPanel` с `returnFocusTo` = кнопка-переключатель. `notifyTouched` остаётся в поле.

- [ ] Оба пикера на `uiDropdownPanel`; существующие spec и spec harness'ов зелёные без изменений.
- [ ] Визуальные снимки не меняются; RTL проверить в Storybook manager (см. `overlays.md`).
- [ ] Коммит `refactor(datepicker): open the calendar in the dropdown panel`.

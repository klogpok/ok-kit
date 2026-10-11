# 38: Date-range-picker harness works only with its own panel

**Spec:** [../spec.md](../spec.md) → 9.4, user story 48; answer to ticket [36](36-range-picker-harness-panel.md)

**What to build:** with two date-range pickers on a page, each `UiDateRangePickerHarness` reads and acts on its own calendar panel only, the same way `UiDatepickerHarness` does after the 9.4 review fix: the panel gets an id, the picker button points to it with `aria-controls` while it is open, and the harness looks only inside that panel. No visual change.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The range picker panel has an id linked by `aria-controls` while open
- [x] The harness looks only inside its own panel; a spec with two open range pickers fails before the fix and passes after
- [x] Visual baselines of the date stories do not change; the CHANGELOG lists the new attribute

## Русский перевод

# 38: Harness date-range-picker работает только со своей панелью

**Спека:** [../spec.md](../spec.md) → 9.4, пользовательская история 48; ответ на тикет [36](36-range-picker-harness-panel.md)

**Что сделать:** когда на странице два date-range-picker, каждый `UiDateRangePickerHarness` читает только свою панель календаря и действует только в ней — так же, как `UiDatepickerHarness` после исправления по ревью 9.4: у панели есть id, кнопка пикера ссылается на него через `aria-controls`, пока панель открыта, и harness ищет только внутри этой панели. Визуальных изменений нет.

**Заблокировано:** нет (можно начинать сразу)

**Статус:** сделано

- [x] У панели range picker есть id, связанный через `aria-controls`, пока она открыта
- [x] Harness ищет только внутри своей панели; spec с двумя открытыми range picker падает до исправления и проходит после
- [x] Визуальные снимки историй дат не меняются; CHANGELOG описывает новый атрибут

# 36: Date-range-picker harness finds its panel globally

**Spec:** [../spec.md](../spec.md) → 9.4, user story 48

**Status:** needs-info

**Facts:** the review found that the new datepicker harness looked up `.ui-datepicker__panel` anywhere in the document, so with two pickers it could act on the wrong calendar. That was fixed: the panel got an id linked by `aria-controls`, and the harness looks only inside its own panel; a spec with two open pickers covers it. The existing `UiDateRangePickerHarness` (phase 8.1) still looks up its panel globally. The story asks both date controls to "test the same way".

**Options:**

1. Fix it now the same way: panel id with `aria-controls` and a scoped lookup, with a two-picker spec (recommended; small).
2. Leave it: only one picker is open at a time in practice.

## Русский перевод

# 36: Harness date-range-picker ищет свою панель глобально

**Спека:** [../spec.md](../spec.md) → 9.4, пользовательская история 48

**Статус:** needs-info

**Факты:** ревью нашло, что новый harness datepicker искал `.ui-datepicker__panel` по всему документу, поэтому при двух пикерах мог работать не с тем календарём. Это исправлено: у панели появился id, связанный через `aria-controls`, и harness ищет только внутри своей панели; это покрывает spec с двумя открытыми пикерами. Существующий `UiDateRangePickerHarness` (фаза 8.1) по-прежнему ищет панель глобально. История просит, чтобы оба контрола даты «тестировались одинаково».

**Варианты:**

1. Исправить сейчас так же: id панели с `aria-controls` и поиск внутри неё, со spec на два пикера (рекомендую; правка небольшая).
2. Оставить: на практике открыт только один пикер.
